import { useQuery } from "@tanstack/react-query";
import { IOZtgAssetId, ZTG } from "@zeitgeistpm/sdk";
import { CreateMarketParams, RpcContext, isFullSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { getMetadataForCurrency } from "lib/constants/supported-currencies";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useFeePayingAsset } from "lib/hooks/queries/useFeePayingAsset";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { MarketDraftEditor } from "lib/state/market-creation/editor";
import { useWallet } from "lib/state/wallet";
import { assetsAreEqual } from "lib/util/assets-are-equal";
import { formatNumberCompact } from "lib/util/format-compact";
import { useState, useMemo, useEffect } from "react";
import { LuFileWarning, LuChevronDown, LuChevronUp } from "react-icons/lu";
import { Tab } from "@headlessui/react";
import Modal from "components/ui/Modal";
import { ModalPanel } from "components/ui/ModalPanel";
import { useChainTime } from "lib/state/chaintime";
import { blocksAsDuration } from "lib/state/market-creation/types/form";
import { timelineAsBlocks } from "lib/state/market-creation/types/timeline";
import { shortenAddress } from "lib/util";
import momentTz from "moment-timezone";
import dynamic from "next/dynamic";
import { minBaseLiquidity } from "lib/state/market-creation/constants/currency";

const QuillViewer = dynamic(() => import("components/ui/QuillViewer"), {
  ssr: false,
});

export type CostCalculatorProps = {
  editor: MarketDraftEditor;
  creationParams?: CreateMarketParams<RpcContext>;
  compact?: boolean;
};

export const CostCalculator = ({
  editor,
  creationParams,
  compact = false,
}: CostCalculatorProps) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const { data: constants } = useChainConstants();
  const [isExpanded, setIsExpanded] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const feesEnabled = !(
    !sdk ||
    !creationParams ||
    !editor.isValid ||
    !wallet.activeAccount
  );

  const { data: baseFee } = useQuery(
    [creationParams?.metadata, wallet.activeAccount?.address],
    async () => {
      if (!feesEnabled) {
        return new Decimal(0);
      }
      if (!isFullSdk(sdk)) return new Decimal(0);
      const paymentInfo =
        await sdk.model.markets.create.calculateFees(creationParams);
      return new Decimal(paymentInfo.partialFee.toString() ?? 0).div(ZTG);
    },
    {
      initialData: new Decimal(0),
      enabled: feesEnabled,
    },
  );

  const { data: feeDetails } = useFeePayingAsset(baseFee);

  const baseCurrency = editor.form.currency
    ? getMetadataForCurrency(editor.form.currency)
    : null;

  const { data: ztgBalance } = useBalance(wallet.realAddress, {
    Ztg: null,
  });

  const { data: foreignAssetBalance } = useBalance(
    wallet.realAddress,
    baseCurrency?.assetId,
  );

  const { data: rawAssetPrice } = useAssetUsdPrice(baseCurrency?.assetId);
  const isStablecoin = false;
  const baseAssetPrice = isStablecoin ? new Decimal(1) : rawAssetPrice;

  const bondCost =
    editor.form.moderation === "Permissionless"
      ? constants?.markets.validityBond
      : constants?.markets.advisoryBond;

  const oracleBond = constants?.markets.oracleBond;

  const ztgTransactionFee = IOZtgAssetId.is(feeDetails?.assetId)
    ? feeDetails?.amount
    : new Decimal(0);

  // Calculate liquidity cost: use minimum if deploying permissionless market with ZTG
  // and amount is below minimum or empty
  const liquidityAmount = useMemo(() => {
    if (
      editor.form.moderation === "Permissionless" &&
      editor.form.liquidity?.deploy &&
      editor.form.currency === "ZTG"
    ) {
      const enteredAmount = new Decimal(editor.form.liquidity.amount || 0).toNumber();
      const minimum = minBaseLiquidity[editor.form.currency] ?? 0;
      // Use minimum if amount is 0, empty, or below minimum
      return Math.max(enteredAmount, minimum);
    }
    return 0;
  }, [
    editor.form.moderation,
    editor.form.liquidity?.deploy,
    editor.form.liquidity?.amount,
    editor.form.currency,
  ]);

  const ztgCost = new Decimal(bondCost ?? 0)
    .plus(oracleBond ?? 0)
    .plus(liquidityAmount)
    .plus(ztgTransactionFee ?? 0);

  const baseAssetTransactionFee = assetsAreEqual(
    baseCurrency?.assetId,
    feeDetails?.assetId,
  )
    ? feeDetails?.amount
    : new Decimal(0);

  const foreignCurrencyCost =
    editor.form.liquidity?.deploy && editor.form.currency !== "ZTG"
      ? new Decimal(editor.form.liquidity.amount || 0).plus(
          baseAssetTransactionFee ?? 0,
        )
      : null;

  const foreignCurrencyCostUsd =
    foreignCurrencyCost && baseAssetPrice
      ? foreignCurrencyCost.mul(baseAssetPrice)
      : null;

  const ztgBalanceDelta = ztgBalance?.div(ZTG).minus(ztgCost);
  const foreignAssetBalanceDelta =
    foreignCurrencyCost &&
    foreignAssetBalance?.div(ZTG).minus(foreignCurrencyCost);

  const hasEnoughLiquidty =
    ztgBalanceDelta?.gte(0) &&
    (!foreignCurrencyCost || foreignAssetBalanceDelta?.gte(0));

  const currency = editor.form.currency?.toUpperCase().trim();
  const isZtgCurrency = currency === "ZTG" || !currency;
  const shouldShowBreakdown =
    foreignCurrencyCost &&
    foreignCurrencyCost.gt(0) &&
    !isZtgCurrency &&
    !IOZtgAssetId.is(feeDetails?.assetId);

  if (compact) {
    return (
      <>
        <div className="fixed bottom-0 left-0 right-0 z-40  bg-ztg-primary-600/95 shadow-lg backdrop-blur-lg">
          <div className="container-fluid">
            <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white/70">
                    Estimated Cost
                  </span>
                  {!hasEnoughLiquidty && (
                    <div className="flex items-center gap-1.5 text-xs text-ztg-red-400">
                      <LuFileWarning size={12} className="shrink-0" />
                      <span>
                        Insufficient balance.
                        {ztgBalanceDelta?.lessThan(0) &&
                          ` Missing ${ztgBalanceDelta.abs().toFixed(2)} ZTG`}
                        {foreignAssetBalanceDelta?.lessThan(0) &&
                          ` Missing ${foreignAssetBalanceDelta.abs().toFixed(1)} ${editor.form.currency}`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  {shouldShowBreakdown ? (
                    <>
                      <span className="text-lg font-bold text-white/90 md:text-xl">
                        {ztgCost.toFixed(3)} ZTG
                      </span>
                      <span className="text-lg font-bold text-white/90 md:text-xl">
                        +
                      </span>
                      <span className="text-lg font-bold text-white/90 md:text-xl">
                        {foreignCurrencyCost.toNumber().toFixed(1)}{" "}
                        {editor.form.currency}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-bold text-white/90 md:text-xl">
                      {ztgCost.toFixed(3)} ZTG
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setResetConfirmOpen(true)}
                  className="rounded-lg border-2 border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10 active:scale-95 md:px-5 md:py-2.5 md:text-sm"
                >
                  Reset
                </button>
                <button
                  onClick={() => setDetailsOpen(true)}
                  className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95 md:px-5 md:py-2.5 md:text-sm"
                >
                  View Summary
                </button>
              </div>
            </div>
          </div>
        </div>
        <CostDetailsModal
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          editor={editor}
          constants={constants}
          bondCost={bondCost}
          oracleBond={oracleBond}
          feeDetails={feeDetails}
          ztgCost={ztgCost}
          liquidityAmount={liquidityAmount}
          foreignCurrencyCost={foreignCurrencyCost}
          foreignCurrencyCostUsd={foreignCurrencyCostUsd}
          baseCurrency={baseCurrency}
          hasEnoughLiquidty={hasEnoughLiquidty ?? false}
          ztgBalanceDelta={ztgBalanceDelta}
          foreignAssetBalanceDelta={foreignAssetBalanceDelta ?? undefined}
          creationParams={creationParams}
        />
        <ResetConfirmationModal
          open={resetConfirmOpen}
          onClose={() => setResetConfirmOpen(false)}
          onConfirm={() => {
            editor.reset();
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-white/70">
              Estimated Total Cost
            </span>
            <div className="flex items-baseline gap-2">
              {shouldShowBreakdown ? (
                <>
                  <span className="text-xl font-bold text-white/90">
                    {ztgCost.toFixed(3)} ZTG
                  </span>
                  <span className="text-xl font-bold text-white/90">+</span>
                  <span className="text-xl font-bold text-white/90">
                    {foreignCurrencyCost.toNumber().toFixed(1)}{" "}
                    {editor.form.currency}
                  </span>
                </>
              ) : (
                <span className="text-xl font-bold text-white/90">
                  {ztgCost.toFixed(3)} ZTG
                </span>
              )}
            </div>
          </div>
          {isExpanded ? (
            <LuChevronUp className="h-5 w-5 text-white/70" />
          ) : (
            <LuChevronDown className="h-5 w-5 text-white/70" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-3  pt-4">
            <CostBreakdownItem
              label={`${editor.form.moderation} Bond`}
              value={`${bondCost} ZTG`}
              description={
                editor.form.moderation === "Permissionless"
                  ? "Returned if market isn't deleted by committee"
                  : "Returned if market is approved"
              }
            />
            <CostBreakdownItem
              label="Oracle Bond"
              value={`${oracleBond} ZTG`}
              description="Returned if oracle reports outcome on time"
            />
            {editor.form.moderation === "Permissionless" &&
              editor.form.liquidity?.deploy &&
              editor.form.currency === "ZTG" && (
                <CostBreakdownItem
                  label="Liquidity"
                  value={`${liquidityAmount} ${editor.form.currency}`}
                  description="Can be withdrawn at any time"
                />
              )}
            {editor.form.moderation === "Permissionless" &&
              editor.form.liquidity?.deploy &&
              editor.form.currency !== "ZTG" && (
                <CostBreakdownItem
                  label="Liquidity"
                  value={`${foreignCurrencyCost?.toNumber().toFixed(1) || 0} ${editor.form.currency}`}
                  description="Can be withdrawn at any time"
                />
              )}
            <CostBreakdownItem
              label="Transaction Fee"
              value={`${formatNumberCompact(feeDetails?.amount.toNumber() ?? 0)} ${feeDetails?.symbol || "ZTG"}`}
              description="Network fee to submit transaction"
            />
          </div>
        )}

        {!hasEnoughLiquidty && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border-2 border-ztg-red-500/60 bg-ztg-red-500/10 px-3 py-2 text-xs text-ztg-red-400">
            <LuFileWarning size={16} className="shrink-0" />
            <span>
              Insufficient balance.
              {ztgBalanceDelta?.lessThan(0) &&
                ` Missing ${ztgBalanceDelta.abs().toFixed(2)} ZTG`}
              {foreignAssetBalanceDelta?.lessThan(0) &&
                ` Missing ${foreignAssetBalanceDelta.abs().toFixed(1)} ${editor.form.currency}`}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

const CostBreakdownItem = ({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="text-xs font-semibold text-white/90">{label}</div>
        <div className="mt-0.5 text-xs text-white/70">{description}</div>
      </div>
      <div className="text-sm font-semibold text-white/90">{value}</div>
    </div>
  );
};

const CostDetailsModal = ({
  open,
  onClose,
  editor,
  constants,
  bondCost,
  oracleBond,
  feeDetails,
  ztgCost,
  liquidityAmount,
  foreignCurrencyCost,
  foreignCurrencyCostUsd,
  baseCurrency,
  hasEnoughLiquidty,
  ztgBalanceDelta,
  foreignAssetBalanceDelta,
  creationParams,
}: {
  open: boolean;
  onClose: () => void;
  editor: MarketDraftEditor;
  constants: any;
  bondCost?: number;
  oracleBond?: number;
  feeDetails?: any;
  ztgCost: Decimal;
  liquidityAmount: number;
  foreignCurrencyCost: Decimal | null;
  foreignCurrencyCostUsd: Decimal | null;
  baseCurrency: any;
  hasEnoughLiquidty: boolean;
  ztgBalanceDelta?: Decimal;
  foreignAssetBalanceDelta?: Decimal;
  creationParams?: CreateMarketParams<RpcContext>;
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const chainTime = useChainTime();
  const { form } = editor;

  // Reset to Summary tab when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTab(0);
    }
  }, [open]);

  const timeline = useMemo(() => {
    return !form || !chainTime
      ? null
      : timelineAsBlocks(form, chainTime).unwrap();
  }, [form, chainTime]);

  const currency = editor.form.currency?.toUpperCase().trim();
  const isZtgCurrency = currency === "ZTG" || !currency;
  const shouldShowBreakdown =
    foreignCurrencyCost &&
    foreignCurrencyCost.gt(0) &&
    !isZtgCurrency &&
    !IOZtgAssetId.is(feeDetails?.assetId);

  const tabs = ["Summary", "Cost Breakdown"];

  return (
    <Modal open={open} onClose={onClose}>
      <ModalPanel
        size="lg"
        className="flex h-[70vh] flex-col overflow-hidden"
      >
        <div className="flex h-full flex-col px-4 pt-4 md:px-6 md:pt-6">
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <div className="flex h-full min-h-0 flex-col">
              <Tab.List className="mb-4 flex flex-shrink-0 gap-2 border-b-2 border-white/20">
                {tabs.map((tab) => (
                  <Tab
                    key={tab}
                    className={({ selected }) =>
                      `border-b-2 px-3 pb-2 text-sm font-semibold transition-colors ${
                        selected
                          ? "border-ztg-green-500 text-white/90"
                          : "border-transparent text-white/90/60 hover:text-white/90"
                      }`
                    }
                  >
                    {tab}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels className="min-h-0 flex-1 overflow-hidden">
                <Tab.Panel className="h-full overflow-hidden">
                  <div
                    className="no-scroll-bar h-full space-y-4 overflow-y-auto px-0 pb-6 md:pb-8"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    <div className="space-y-2 rounded-lg bg-white/5 p-4">
                      <label className="text-xs font-semibold text-white/70">
                        Market Question
                      </label>
                      <p className="text-sm font-medium text-white/90">
                        {form?.question || (
                          <span className="text-orange-400">
                            No question given
                          </span>
                        )}
                      </p>
                    </div>

                    {form.answers && (
                      <div className="space-y-2 rounded-lg bg-white/5 p-4">
                        <label className="text-xs font-semibold text-white/70">
                          Answer Options
                          {form.answers.type === "categorical" &&
                            ` (${form.answers.answers.length})`}
                          {form.answers.type === "scalar" && " (Scalar)"}
                          {form.answers.type === "yes/no" && " (Yes/No)"}
                        </label>
                        {form.answers.type === "categorical" && (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {(form.answers.answers as string[]).map(
                              (answer, idx) => (
                                <div
                                  key={idx}
                                  className="rounded border border-white/20 bg-white/5 px-2 py-1.5"
                                >
                                  <div className="text-xs font-medium uppercase text-white/90">
                                    {answer}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                        {form.answers.type === "scalar" && (
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded border border-white/20 bg-white/5 px-2 py-1.5">
                              <div className="text-xs text-white/70">
                                Short (Lower)
                              </div>
                              <div className="text-xs font-medium text-white/90">
                                {form.answers.numberType === "date"
                                  ? new Date(
                                      (form.answers.answers as number[])[0],
                                    ).toLocaleDateString()
                                  : (form.answers.answers as number[])[0]}
                              </div>
                            </div>
                            <div className="rounded border border-white/20 bg-white/5 px-2 py-1.5">
                              <div className="text-xs text-white/70">
                                Long (Upper)
                              </div>
                              <div className="text-xs font-medium text-white/90">
                                {form.answers.numberType === "date"
                                  ? new Date(
                                      (form.answers.answers as number[])[1],
                                    ).toLocaleDateString()
                                  : (form.answers.answers as number[])[1]}
                              </div>
                            </div>
                          </div>
                        )}
                        {form.answers.type === "yes/no" && (
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded border border-white/20 bg-white/5 px-2 py-1.5">
                              <div className="text-xs font-medium uppercase text-white/90">
                                Yes
                              </div>
                            </div>
                            <div className="rounded border border-white/20 bg-white/5 px-2 py-1.5">
                              <div className="text-xs font-medium uppercase text-white/90">
                                No
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pricing & Settings */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 rounded-lg bg-white/5 p-4">
                        <label className="text-xs font-semibold text-white/70">
                          Currency & Type
                        </label>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Currency:</span>
                            <span className="font-medium text-white/90">
                              {form.currency || "--"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Type:</span>
                            <span className="font-medium text-white/90">
                              {form.moderation || "--"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Creator Fee:</span>
                            <span className="font-medium text-white/90">
                              {form.creatorFee?.value || "0"}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 rounded-lg bg-white/5 p-4">
                        <label className="text-xs font-semibold text-white/70">
                          Timeline
                        </label>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">End Date:</span>
                            <span className="font-medium text-white/90">
                              {form.endDate
                                ? momentTz
                                    .tz(form.endDate, form.timeZone || "UTC")
                                    .format("MMM D, YYYY h:mm A")
                                : "--"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Reporting:</span>
                            <span className="font-medium text-white/90">
                              {timeline?.report?.period
                                ? blocksAsDuration(
                                    timeline.report.period,
                                  ).humanize()
                                : "--"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/70">Dispute:</span>
                            <span className="font-medium text-white/90">
                              {timeline?.dispute?.period
                                ? blocksAsDuration(
                                    timeline.dispute.period,
                                  ).humanize()
                                : "--"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Oracle & Liquidity */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 rounded-lg bg-white/5 p-4">
                        <label className="text-xs font-semibold text-white/70">
                          Oracle Account
                        </label>
                        <p className="font-mono text-xs font-medium text-white/90">
                          {form?.oracle
                            ? shortenAddress(form.oracle, 8, 8)
                            : "--"}
                        </p>
                      </div>

                      <div className="space-y-2 rounded-lg bg-white/5 p-4">
                        <label className="text-xs font-semibold text-white/70">
                          Liquidity Pool
                        </label>
                        {form?.liquidity?.deploy &&
                        form?.moderation === "Permissionless" ? (
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-white/70">Amount:</span>
                              <span className="font-medium text-white/90">
                                {form.liquidity.amount} {form.currency}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-white/70">Swap Fee:</span>
                              <span className="font-medium text-white/90">
                                {form.liquidity.swapFee?.value || "--"}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-orange-400">
                            {form?.moderation === "Advised"
                              ? "Will be available after approval"
                              : "No liquidity - can be added later"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {form?.description && (
                      <div className="space-y-2 rounded-lg bg-white/5 p-4">
                        <label className="text-xs font-semibold text-white/70">
                          Description
                        </label>
                        <div className="prose prose-sm max-w-none text-xs text-white/90">
                          <QuillViewer value={form.description || ""} />
                        </div>
                      </div>
                    )}
                  </div>
                </Tab.Panel>

                {/* Cost Breakdown Tab */}
                <Tab.Panel className="h-full overflow-hidden">
                  <div
                    className="no-scroll-bar h-full space-y-4 overflow-y-auto px-0 pb-6 md:pb-8"
                    style={{ WebkitOverflowScrolling: "touch" }}
                  >
                    <CostBreakdownItem
                      label={`${editor.form.moderation} Bond`}
                      value={`${bondCost} ZTG`}
                      description={
                        editor.form.moderation === "Permissionless"
                          ? "Returned if the market isn't deleted by the committee."
                          : "Returned if the market is approved or ends before being approved by the committee."
                      }
                    />
                    <CostBreakdownItem
                      label="Oracle Bond"
                      value={`${oracleBond} ZTG`}
                      description="Returned if oracle reports the market outcome on time."
                    />
                    {editor.form.moderation === "Permissionless" &&
                      editor.form.liquidity?.deploy && (
                        <CostBreakdownItem
                          label="Liquidity"
                          value={`${liquidityAmount.toFixed(1)} ${editor.form.currency}`}
                          description="Can be withdrawn at any time, will collect fees but subject to impermanent loss."
                        />
                      )}
                    <CostBreakdownItem
                      label="Transaction Fee"
                      value={`${formatNumberCompact(feeDetails?.amount.toNumber() ?? 0)} ${feeDetails?.symbol || "ZTG"}`}
                      description="Cost to submit the transaction on-chain."
                    />
                    <div className="border-t-2 border-white/20 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white/90">
                            Total
                          </div>
                          <div className="mt-0.5 text-xs text-white/70">
                            Total estimated cost for creating the market
                          </div>
                        </div>
                        <div className="text-right">
                          {shouldShowBreakdown ? (
                            <>
                              <div className="text-lg font-bold text-white/90">
                                {ztgCost.toFixed(3)} ZTG
                              </div>
                              <div className="text-sm font-semibold text-white/90">
                                + {foreignCurrencyCost.toNumber().toFixed(1)}{" "}
                                {editor.form.currency}
                              </div>
                            </>
                          ) : (
                            <div className="text-lg font-bold text-white/90">
                              {ztgCost.toFixed(3)} ZTG
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {!hasEnoughLiquidty && (
                      <div className="rounded-lg border-2 border-ztg-red-500/60 bg-ztg-red-500/10 p-4">
                        <div className="text-sm font-semibold text-ztg-red-400">
                          Insufficient Balance
                        </div>
                        <div className="mt-2 text-xs text-ztg-red-400">
                          Missing balance needed to create the market:
                          {ztgBalanceDelta?.lessThan(0) && (
                            <div className="mt-1">
                              {ztgBalanceDelta.abs().toFixed(2)} ZTG
                            </div>
                          )}
                          {foreignAssetBalanceDelta?.lessThan(0) && (
                            <div className="mt-1">
                              {foreignAssetBalanceDelta.abs().toFixed(1)}{" "}
                              {editor.form.currency}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </div>
          </Tab.Group>
        </div>
      </ModalPanel>
    </Modal>
  );
};

const ResetConfirmationModal = ({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalPanel size="sm" className="p-6 md:p-8">
        <h2 className="mb-4 text-lg font-bold text-white/90 md:text-xl">
          Reset Form
        </h2>
        <p className="mb-6 text-sm text-white/70">
          Are you sure you want to reset all form fields? This will clear all
          your entered data and return the form to its default starting values.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border-2 border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/10 active:scale-95 md:px-5 md:py-2.5"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg border-2 border-ztg-red-500/60 bg-ztg-red-500/90 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-sm transition-all hover:border-ztg-red-400 hover:bg-ztg-red-500 active:scale-95 md:px-5 md:py-2.5"
          >
            Reset
          </button>
        </div>
      </ModalPanel>
    </Modal>
  );
};

export default CostCalculator;
