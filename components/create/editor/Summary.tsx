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
  //todo: this will be wrong
  const baseAssetLiquidityRow = form?.liquidity?.rows?.find(
    (row) => row.asset === form.currency,
  );
  const amm2Liquidity = editor.form?.liquidity?.amount;

  return (
    <div className="flex-1 text-center">
      <div className="mb-10">
        <Label className="mb-2">Question</Label>
        <h2 className="text-[1.4em]">
          {form?.question ? (
            form?.question
          ) : (
            <span className="font-normal text-orange-300">
              No question given.
            </span>
          )}
        </h2>
      </div>

      <div className="mb-10">
        <Label className="mb-2">Answers</Label>
        <div className="gap-4 md:flex md:justify-center md:px-0">
          {form.answers?.answers?.length === 0 ? (
            <div className="italic text-gray-500">No answers supplied</div>
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
      </div>

      <div className="mb-10">
        <div className="">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Label>Currency</Label>{" "}
            <div className="center flex gap-1">
              {form.currency ? (
                <>
                  {form.currency}
                  <div className="relative h-5 w-5">
                    <Image
                      alt="Currency token logo"
                      fill
                      sizes="100vw"
                      src={currencyMetadata?.image!}
                    />
                  </div>
                </>
              ) : (
                "--"
              )}
            </div>
          </div>
          <div>
            {baseAssetLiquidityRow &&
            form?.liquidity?.deploy &&
            form?.moderation === "Permissionless" ? (
              <>
                <div className="mb-4 flex justify-center gap-4">
                  <div className="flex items-center justify-center gap-2">
                    <Label>Amount</Label>{" "}
                    <div>
                      {amm2Liquidity ?? baseAssetLiquidityRow?.amount ?? "--"}
                    </div>
                  </div>
                  {/* {!amm2Liquidity && (
                    <div className="flex items-center justify-center gap-2">
                      <Label>Weight</Label>{" "}
                      <div>{baseAssetLiquidityRow?.weight ?? "--"}</div>
                    </div>
                  )} */}
                  <div className="flex items-center justify-center gap-2">
                    <Label>Swap Fee</Label>{" "}
                    {form.liquidity?.swapFee?.value ?? "--"}%
                  </div>
                </div>

                <div>
                  <Label>Total Base Liquidity</Label>{" "}
                  {amm2Liquidity
                    ? amm2Liquidity
                    : new Decimal(baseAssetLiquidityRow?.value)
                        .mul(2)
                        .toFixed(1)}{" "}
                  {baseAssetLiquidityRow?.asset}{" "}
                  <span className="text-gray-400">≈</span>{" "}
                  {baseAssetPrice
                    ?.mul(Number(amm2Liquidity) ?? baseAssetLiquidityRow?.value)
                    .mul(2)
                    .toFixed(2)}{" "}
                  USD
                </div>
              </>
            ) : !form?.liquidity?.deploy &&
              form?.moderation === "Permissionless" ? (
              <div className="mt-4">
                <div className="center mb-2 text-gray-500">
                  <LuFileWarning size={22} />
                </div>
                <div className="center">
                  <p className="mb-3 text-center text-gray-400 md:max-w-lg">
                    No liquidity pool will be deployed for the market.
                    <b className="inline">
                      You can deploy a pool after you create the market
                    </b>{" "}
                    from the market page.
                  </p>
                </div>
                <p className="mb-4 text-xs italic text-gray-400">
                  Or you can add it now as part of the market creation process
                </p>
                <button
                  type="button"
                  className={`rounded-md px-3 py-1 transition-all active:scale-95 ${`bg-${currencyMetadata?.twColor}`}  text-white`}
                  onClick={() => {
                    editor.mergeFormData({
                      liquidity: {
                        deploy: true,
                      },
                    });
                    editor.goToSection("Liquidity");
                  }}
                >
                  Add Liquidity?
                </button>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-center gap-2">
          <Label>Moderation</Label> <div>{form.moderation}</div>
        </div>
        {creationParams?.disputeMechanism && (
          <div className="mt-2 inline-block items-center justify-center gap-2 rounded-md bg-purple-400 p-2 text-white">
            <Label className="text-white">Dispute Mechanism</Label>{" "}
            <div>{creationParams.disputeMechanism.toString()}</div>
          </div>
        )}
      </div>

      <div className="mb-10">
        <Label className="mb-2">Oracle</Label>
        <h3 className="hidden text-base font-normal md:block">
          {form?.oracle ? form?.oracle : "--"}
        </h3>
        <h3 className="block text-base font-normal md:hidden">
          {form?.oracle ? shortenAddress(form?.oracle, 6, 6) : "--"}
        </h3>
      </div>

      <div className="mb-10">
        <div className="mb-4 flex items-center justify-center gap-6">
          <div className="items-center gap-2">
            <Label className="mb-2">Ends</Label>
            <div>
              {form.endDate
                ? `${momentFn(form.endDate).format("MMM D, YYYY, h:mm:ss A")} ${
                    form.timeZone ?? ""
                  }`
                : "--"}
            </div>
          </div>
        </div>
        <div className="items-center justify-center gap-6 md:flex">
          <div className="mb-2 flex items-center justify-center gap-2 md:mb-0">
            <Label>Grace</Label>{" "}
            <div>
              {form.gracePeriod?.type === "duration"
                ? timeline?.grace
                  ? timeline?.grace.period > 0
                    ? blocksAsDuration(timeline?.grace.period).humanize()
                    : "None"
                  : "--"
                : `${momentFn(form.gracePeriod?.date).format(
                    "MMM D, YYYY, h:mm:ss A",
                  )} ${form.timeZone ?? ""}`}
            </div>
          </div>
          <div className="mb-2 flex items-center justify-center gap-2 md:mb-0">
            <Label>Reporting</Label>{" "}
            <div>
              {timeline?.report
                ? timeline?.report.period > 0
                  ? blocksAsDuration(timeline?.report.period).humanize()
                  : "None"
                : "--"}
            </div>
          </div>
          <div className="mb-2 flex items-center justify-center gap-2 md:mb-0">
            <Label>Dispute</Label>{" "}
            <div>
              {timeline?.dispute
                ? timeline?.dispute.period > 0
                  ? blocksAsDuration(timeline?.dispute.period).humanize()
                  : "None"
                : "--"}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <Label>Description</Label>
        <div className="center flex ">
          {form?.description ? (
            <div className="h-fit w-full max-w-2xl rounded-md bg-gray-50 p-4 md:w-2/3">
              <QuillViewer value={form?.description} />
            </div>
          ) : (
            <span className="italic text-gray-500">No description given.</span>
          )}
        </div>
      </div>
      <div>
        <Label className="mb-2">Creator Fee</Label>
        <div className="center flex ">{form?.creatorFee?.value} %</div>
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
            className="mb-4 flex-1 rounded-md bg-gray-50 px-5 py-3 md:mb-0"
          >
            <div className="text-xl font-semibold uppercase">
              {answerLiquidity?.asset}
            </div>
            {answers.type === "categorical" && (
              <div className="text-sm text-gray-400">{answer}</div>
            )}

            {liquidity &&
            liquidity.deploy &&
            moderation === "Permissionless" ? (
              <div className="mt-3 !text-sm">
                <div className="mb-1 table-row">
                  <div className="table-cell pr-4 text-left">
                    <Label className="text-xs">Amount</Label>{" "}
                  </div>
                  <div className="table-cell text-left">
                    <div>
                      {Number(answerLiquidity?.amount).toFixed(1) ?? "--"}
                    </div>
                  </div>
                </div>
                <div className="mb-1 table-row">
                  <div className="table-cell pr-4 text-left">
                    <Label className="text-xs">Value</Label>{" "}
                  </div>
                  <div className="table-cell text-left">
                    <div className="mb-1">
                      {answerLiquidity ? (
                        <>
                          {new Decimal(answerLiquidity?.amount ?? 0).toFixed(1)}{" "}
                          <span className="text-gray-400">≈</span>{" "}
                          {baseAssetPrice
                            ?.mul(answerLiquidity?.amount ?? 0)
                            .mul(answerLiquidity?.price.price ?? 0)
                            .toFixed(2)}{" "}
                          USD
                        </>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                </div>

                <div className="table-row ">
                  <div className="table-cell pr-4 text-left">
                    <Label className="text-xs">Price</Label>{" "}
                  </div>
                  <div className="table-cell text-left">
                    <div className="flex gap-2">
                      <div className="font-semibold">
                        {new Decimal(answerLiquidity?.price.price ?? 0).toFixed(
                          2,
                        )}
                      </div>
                      <div className="font-bold">{baseCurrency}</div>
                    </div>
                  </div>
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
  return <div className={`text-sm text-gray-400 ${className}`}>{children}</div>;
};

export default MarketSummary;
