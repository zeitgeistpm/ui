import momentTz from "moment-timezone";
import moment from "moment";
import Decimal from "decimal.js";
import { getMetadataForCurrency } from "lib/constants/supported-currencies";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { useChainTime } from "lib/state/chaintime";
import { MarketDraftEditor } from "lib/state/market-creation/editor";
import {
  Answers,
  CurrencyTag,
  Liquidity,
  Moderation,
  blocksAsDuration,
} from "lib/state/market-creation/types/form";
import { timelineAsBlocks } from "lib/state/market-creation/types/timeline";
import { shortenAddress } from "lib/util";
import partialRight from "lodash-es/partialRight";
import dynamic from "next/dynamic";
import Image from "next/image";
import React, { useMemo } from "react";
import { LuFileWarning } from "react-icons/lu";
import { CreateMarketParams, RpcContext } from "@zeitgeistpm/sdk";

const QuillViewer = dynamic(() => import("components/ui/QuillViewer"), {
  ssr: false,
});

export type MarketSummaryProps = {
  editor: MarketDraftEditor;
  creationParams?: CreateMarketParams<RpcContext>;
};

export const MarketSummary = ({
  editor,
  creationParams,
}: MarketSummaryProps) => {
  const chainTime = useChainTime();
  const { form } = editor;

  const momentFn = form?.timeZone
    ? partialRight(momentTz.tz, form.timeZone)
    : moment;

  const timeline = useMemo(() => {
    return !form || !chainTime
      ? null
      : timelineAsBlocks(form, chainTime).unwrap();
  }, [form, chainTime]);

  const currencyMetadata = getMetadataForCurrency(form.currency!);

  const { data: baseAssetPrice } = useAssetUsdPrice(currencyMetadata?.assetId);

  const baseAmount = form.liquidity?.amount;

  return (
    <div className="space-y-4">
      {/* Question */}
      <div className="rounded-md border border-sky-200/30 bg-white/80 p-4 backdrop-blur-md">
        <Label className="mb-2">Market Question</Label>
        <p className="text-base font-semibold text-sky-900">
          {form?.question ? (
            form?.question
          ) : (
            <span className="font-normal text-orange-400">
              No question given.
            </span>
          )}
        </p>
      </div>

      {/* Answers */}
      <div>
        <Label className="mb-3">Answer Options</Label>
        {form.answers?.answers?.length === 0 ? (
          <div className="rounded-md border border-sky-200/30 bg-white/80 p-4 text-center italic text-sky-700 backdrop-blur-md">
            No answers supplied
          </div>
        ) : (
          <AnswersDisplay
            answers={form.answers!}
            baseAssetPrice={baseAssetPrice!}
            baseCurrency={form.currency!}
            liquidity={form?.liquidity}
            moderation={form.moderation!}
          />
        )}
      </div>

      {/* Currency & Liquidity */}
      <div className="rounded-md border border-sky-200/30 bg-white/80 p-4 backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2">
          <Label>Currency:</Label>
          <div className="flex items-center gap-1.5">
            {form.currency ? (
              <>
                <span className="font-medium text-sky-900">{form.currency}</span>
                <div className="relative h-4 w-4">
                  <Image
                    alt="Currency token logo"
                    fill
                    sizes="100vw"
                    src={currencyMetadata?.image!}
                  />
                </div>
              </>
            ) : (
              <span className="text-sky-700">--</span>
            )}
          </div>
        </div>

        {form?.liquidity?.deploy && form?.moderation === "Permissionless" ? (
          <div className="space-y-2 border-t border-sky-200/30 pt-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-sky-700">Base Amount:</span>{" "}
                <span className="font-medium text-sky-900">{baseAmount ?? "--"}</span>
              </div>
              <div>
                <span className="text-sky-700">Swap Fee:</span>{" "}
                <span className="font-medium text-sky-900">{form.liquidity?.swapFee?.value ?? "--"}%</span>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-sky-700">Total Liquidity:</span>{" "}
              <span className="font-semibold text-sky-900">
                {baseAmount} {form.currency}
              </span>{" "}
              <span className="text-sky-400">≈</span>{" "}
              <span className="font-medium text-sky-700">
                ${baseAssetPrice?.mul(baseAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        ) : !form?.liquidity?.deploy && form?.moderation === "Permissionless" ? (
          <div className="border-t border-sky-200/30 pt-3">
            <div className="mb-2 flex items-center justify-center text-orange-500">
              <LuFileWarning size={18} />
            </div>
            <p className="mb-2 text-center text-sm text-sky-900">
              No liquidity pool will be deployed.{" "}
              <span className="font-semibold">
                You can deploy a pool after market creation
              </span>{" "}
              from the market page.
            </p>
            <div className="text-center">
              <button
                type="button"
                className="rounded-md border border-sky-600/50 bg-sky-600/90 px-3 py-1.5 text-xs text-white backdrop-blur-md transition-all hover:bg-sky-600 active:scale-95"
                onClick={() => {
                  editor.mergeFormData({
                    liquidity: {
                      deploy: true,
                    },
                  });
                  editor.goToSection("Liquidity");
                }}
              >
                Add Liquidity Now?
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Moderation */}
      <div className="rounded-md border border-sky-200/30 bg-white/80 p-4 backdrop-blur-md">
        <Label className="mb-2">Moderation</Label>
        <p className="text-sm font-medium text-sky-900">{form.moderation}</p>
        {creationParams?.disputeMechanism && (
          <div className="mt-3 rounded-md border border-purple-400/30 bg-purple-50/50 p-2.5 backdrop-blur-sm">
            <Label className="mb-1 text-purple-900">Dispute Mechanism</Label>
            <p className="text-sm text-purple-900">
              {creationParams.disputeMechanism.toString()}
            </p>
          </div>
        )}
      </div>

      {/* Oracle */}
      <div className="rounded-md border border-sky-200/30 bg-white/80 p-4 backdrop-blur-md">
        <Label className="mb-2">Oracle</Label>
        <p className="hidden text-sm font-medium text-sky-900 md:block">
          {form?.oracle ? form?.oracle : "--"}
        </p>
        <p className="block text-sm font-medium text-sky-900 md:hidden">
          {form?.oracle ? shortenAddress(form?.oracle, 6, 6) : "--"}
        </p>
      </div>

      {/* Timeline */}
      <div className="rounded-md border border-sky-200/30 bg-white/80 p-4 backdrop-blur-md">
        <div className="mb-3">
          <Label className="mb-1.5">Ends</Label>
          <p className="text-sm font-medium text-sky-900">
            {form.endDate
              ? `${momentFn(form.endDate).format("MMM D, YYYY, h:mm:ss A")} ${
                  form.timeZone ?? ""
                }`
              : "--"}
          </p>
        </div>
        <div className="grid gap-3 border-t border-sky-200/30 pt-3 md:grid-cols-2">
          <div>
            <Label className="mb-1.5">Reporting Period</Label>
            <p className="text-sm text-sky-900">
              {timeline?.report
                ? timeline?.report.period > 0
                  ? blocksAsDuration(timeline?.report.period).humanize()
                  : "None"
                : "--"}
            </p>
          </div>
          <div>
            <Label className="mb-1.5">Dispute Period</Label>
            <p className="text-sm text-sky-900">
              {timeline?.dispute
                ? timeline?.dispute.period > 0
                  ? blocksAsDuration(timeline?.dispute.period).humanize()
                  : "None"
                : "--"}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-md border border-sky-200/30 bg-white/80 p-4 backdrop-blur-md">
        <Label className="mb-2">Description</Label>
        {form?.description ? (
          <div className="prose prose-sm max-w-none text-sky-900">
            <QuillViewer value={form?.description} />
          </div>
        ) : (
          <p className="italic text-sky-700 opacity-75">
            No description given.
          </p>
        )}
      </div>

      {/* Creator Fee */}
      <div className="rounded-md border border-sky-200/30 bg-white/80 p-4 backdrop-blur-md">
        <Label className="mb-2">Creator Fee</Label>
        <p className="text-sm font-medium text-sky-900">
          {form?.creatorFee?.value} %
        </p>
      </div>
    </div>
  );
};

const AnswersDisplay = ({
  answers,
  liquidity,
  baseCurrency,
  baseAssetPrice,
  moderation,
}: {
  answers: Answers;
  liquidity?: Liquidity;
  baseCurrency: CurrencyTag;
  baseAssetPrice?: Decimal;
  moderation: Moderation;
}) => {
  return (
    <div
      className="max-w-full gap-3 md:grid"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      }}
    >
      {answers?.answers.map((answer, answerIndex) => {
        const answerLiquidity = liquidity?.rows?.[answerIndex];

        return (
          <div
            key={answerIndex}
            className="mb-4 flex-1 rounded-md border border-sky-200/30 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md md:mb-0"
          >
            <div className="mb-2 text-base font-semibold uppercase text-sky-900">
              {answerLiquidity?.asset}
            </div>
            {answers.type === "categorical" && (
              <div className="mb-2 text-sm text-sky-700">{answer}</div>
            )}

            {liquidity &&
            liquidity.deploy &&
            moderation === "Permissionless" ? (
              <div className="space-y-1.5 border-t border-sky-200/30 pt-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-sky-700">Amount:</span>
                  <span className="font-medium text-sky-900">
                    {Number(answerLiquidity?.amount).toFixed(1) ?? "--"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-700">Value:</span>
                  <span className="font-medium text-sky-900">
                    {answerLiquidity ? (
                      <>
                        {new Decimal(answerLiquidity?.amount || 0)
                          .mul(answerLiquidity?.price.price ?? 0)
                          .toFixed(1)}{" "}
                        <span className="text-sky-400">≈</span>{" "}
                        {baseAssetPrice
                          ?.mul(answerLiquidity?.amount || 0)
                          .mul(answerLiquidity?.price.price ?? 0)
                          .toFixed(2)}{" "}
                        USD
                      </>
                    ) : (
                      ""
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sky-700">Price:</span>
                  <span className="font-semibold text-sky-900">
                    {new Decimal(answerLiquidity?.price.price ?? 0).toFixed(2)}{" "}
                    {baseCurrency}
                  </span>
                </div>
              </div>
            ) : (
              ""
            )}
          </div>
        );
      })}
    </div>
  );
};

const Label: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return (
    <div className={`text-sm font-medium text-sky-900 ${className}`}>
      {children}
    </div>
  );
};

export default MarketSummary;
