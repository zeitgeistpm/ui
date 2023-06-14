import { blockDate } from "@zeitgeistpm/utility/dist/time";
import Decimal from "decimal.js";
import { getMetadataForCurrency } from "lib/constants/supported-currencies";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { useChainTime } from "lib/state/chaintime";
import { MarketDraftEditor } from "lib/state/market-creation/editor";
import {
  Answers,
  Liquidity,
  Moderation,
  blocksAsDuration,
} from "lib/state/market-creation/types/form";
import { timelineAsBlocks } from "lib/state/market-creation/types/timeline";
import { shortenAddress } from "lib/util";
import { formatDuration } from "lib/util/format-duration";
import dynamic from "next/dynamic";
import Image from "next/image";
import React, { useMemo } from "react";
import { LuFileWarning } from "react-icons/lu";

const QuillViewer = dynamic(() => import("components/ui/QuillViewer"), {
  ssr: false,
});

export type MarketSummaryProps = {
  editor: MarketDraftEditor;
};

export const MarketSummary = ({ editor }: MarketSummaryProps) => {
  const chainTime = useChainTime();
  const { form } = editor;

  const timeline = useMemo(() => {
    return !form || !chainTime
      ? null
      : timelineAsBlocks(form, chainTime).unwrap();
  }, [form, chainTime]);

  const currencyMetadata = getMetadataForCurrency(form.currency!);

  const { data: baseAssetPrice } = useAssetUsdPrice(currencyMetadata?.assetId);

  const baseAssetLiquidityRow = form?.liquidity?.rows.find(
    (row) => row.asset === form.currency,
  );

  return (
    <div className="flex-1 text-center">
      <div className="mb-10">
        <Label className="mb-2">Question</Label>
        <h2 className="text-[1.4em]">
          {form?.question ? (
            form?.question
          ) : (
            <span className="text-orange-300 font-normal">
              No question given.
            </span>
          )}
        </h2>
      </div>

      <div className="mb-10">
        <Label className="mb-2">Answers</Label>
        <div className="md:flex md:justify-center gap-4 md:px-0">
          {form.answers?.answers?.length === 0 ? (
            <div className="italic text-gray-500">No answers supplied</div>
          ) : (
            <Answers
              answers={form.answers!}
              baseAssetPrice={baseAssetPrice!}
              liquidity={form?.liquidity}
              moderation={form.moderation!}
            />
          )}
        </div>
      </div>

      <div className="mb-10">
        <div className="">
          <div className="flex justify-center gap-2 items-center mb-2">
            <Label>Currency</Label>{" "}
            <div className="flex center gap-1">
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
                <div className="flex justify-center gap-4 mb-4">
                  <div className="flex justify-center gap-2 items-center">
                    <Label>Amount</Label>{" "}
                    <div>{baseAssetLiquidityRow?.amount ?? "--"}</div>
                  </div>
                  <div className="flex justify-center gap-2 items-center">
                    <Label>Weight</Label>{" "}
                    <div>{baseAssetLiquidityRow?.weight ?? "--"}</div>
                  </div>
                  <div className="flex justify-center gap-2 items-center">
                    <Label>Swap Fee</Label>{" "}
                    {form.liquidity?.swapFee?.value ?? "--"}%
                  </div>
                </div>

                <div>
                  <Label>Total Base Liquidity</Label>{" "}
                  {new Decimal(baseAssetLiquidityRow?.value).mul(2).toFixed(1)}{" "}
                  {baseAssetLiquidityRow?.asset}{" "}
                  <span className="text-gray-400">≈</span>{" "}
                  {baseAssetPrice
                    ?.mul(baseAssetLiquidityRow?.value)
                    .mul(2)
                    .toFixed(2)}{" "}
                  USD
                </div>
              </>
            ) : !form?.liquidity?.deploy &&
              form?.moderation === "Permissionless" ? (
              <div className="mt-4">
                <div className="mb-2 center text-gray-500">
                  <LuFileWarning size={22} />
                </div>
                <div className="center">
                  <p className="text-center md:max-w-lg text-gray-400 mb-3">
                    No liquidity pool will be deployed for the market.
                    <b className="inline">
                      You can deploy a pool after you create the market
                    </b>{" "}
                    from the market page.
                  </p>
                </div>
                <p className="mb-4 italic text-gray-400 text-xs">
                  Or you can add it now as part of the market creation process
                </p>
                <button
                  type="button"
                  className={`rounded-md py-1 px-3 transition-all active:scale-95 ${`bg-${currencyMetadata?.twColor}`}  text-white`}
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
        <div className="flex justify-center gap-2 items-center">
          <Label>Moderation</Label> <div>{form.moderation}</div>
        </div>
      </div>

      <div className="mb-10">
        <Label className="mb-2">Oracle</Label>
        <h3 className="text-base font-normal hidden md:block">
          {form?.oracle ? form?.oracle : "--"}
        </h3>
        <h3 className="text-base font-normal block md:hidden">
          {form?.oracle ? shortenAddress(form?.oracle, 6, 6) : "--"}
        </h3>
      </div>

      <div className="mb-10">
        <div className="flex justify-center items-center gap-6 mb-4">
          <div className="gap-2 items-center">
            <Label className="mb-2">Ends</Label>
            <div>
              {form.endDate
                ? Intl.DateTimeFormat("default", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(form.endDate))
                : "--"}
            </div>
          </div>
        </div>
        <div className="md:flex justify-center items-center gap-6">
          <div className="flex justify-center gap-2 items-center mb-2 md:mb-0">
            <Label>Grace</Label>{" "}
            <div>
              {form.gracePeriod?.type === "duration"
                ? timeline?.grace
                  ? timeline?.grace.period > 0
                    ? formatDuration(blocksAsDuration(timeline?.grace.period))
                    : "None"
                  : "--"
                : Intl.DateTimeFormat("default", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(
                    blockDate(chainTime!, form.gracePeriod?.block!).getTime(),
                  )}
            </div>
          </div>
          <div className="flex justify-center gap-2 items-center mb-2 md:mb-0">
            <Label>Reporting</Label>{" "}
            <div>
              {timeline?.report
                ? timeline?.report.period > 0
                  ? formatDuration(blocksAsDuration(timeline?.report.period))
                  : "None"
                : "--"}
            </div>
          </div>
          <div className="flex justify-center gap-2 items-center mb-2 md:mb-0">
            <Label>Dispute</Label>{" "}
            <div>
              {timeline?.dispute
                ? timeline?.dispute.period > 0
                  ? formatDuration(blocksAsDuration(timeline?.dispute.period))
                  : "None"
                : "--"}
            </div>
          </div>
        </div>
      </div>

      <div>
        <Label className="mb-2">Description</Label>
        <div className="flex center ">
          {form?.description ? (
            <div className="w-full md:w-2/3 max-w-2xl bg-gray-50 rounded-md p-4 h-fit">
              <QuillViewer value={form?.description} />
            </div>
          ) : (
            <span className="italic text-gray-500">No description given.</span>
          )}
        </div>
      </div>
    </div>
  );
};

const Answers = ({
  answers,
  liquidity,
  baseAssetPrice,
  moderation,
}: {
  answers: Answers;
  liquidity?: Liquidity;
  baseAssetPrice?: Decimal;
  moderation: Moderation;
}) => {
  return (
    <>
      {answers?.answers.map((answer, answerIndex) => {
        const answerLiquidity = liquidity?.rows[answerIndex];

        return (
          <>
            <div className="rounded-md bg-gray-50 py-3 px-5 mb-4 md:mb-0">
              <div className="text-xl font-semibold">
                {answerLiquidity?.asset}
              </div>
              {answers.type === "categorical" && (
                <div className="text-sm text-gray-400">{answer}</div>
              )}

              {liquidity &&
              liquidity.deploy &&
              moderation === "Permissionless" ? (
                <div className="!text-sm mt-3">
                  <div className="table-row mb-1">
                    <div className="table-cell text-left pr-4">
                      <Label className="text-xs">Amount</Label>{" "}
                    </div>
                    <div className="table-cell text-left">
                      <div>{answerLiquidity?.amount ?? "--"}</div>
                    </div>
                  </div>

                  <div className="table-row mb-1">
                    <div className="table-cell text-left pr-4">
                      <Label className="text-xs">Weight</Label>{" "}
                    </div>
                    <div className="table-cell text-left">
                      <div>{answerLiquidity?.weight ?? "--"}</div>
                    </div>
                  </div>

                  <div className="table-row">
                    <div className="table-cell text-left pr-4">
                      <Label className="text-xs">Value</Label>{" "}
                    </div>
                    <div className="table-cell text-left">
                      <div className="mb-1">
                        {answerLiquidity ? (
                          <>
                            {new Decimal(answerLiquidity?.value).toFixed(1)}{" "}
                            <span className="text-gray-400">≈</span>{" "}
                            {baseAssetPrice
                              ?.mul(answerLiquidity?.value)
                              .toFixed(2)}{" "}
                            USD
                          </>
                        ) : (
                          ""
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                ""
              )}
            </div>
          </>
        );
      })}
    </>
  );
};

const Label: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return <div className={`text-sm text-gray-400 ${className}`}>{children}</div>;
};

export default MarketSummary;
