import { Listbox } from "@headlessui/react";
import {
  CategoricalAssetId,
  getIndexOf,
  IndexerContext,
  IOCategoricalAssetId,
  isRpcSdk,
  Market,
  parseAssetId,
} from "@zeitgeistpm/sdk-next";
import TransactionButton from "components/ui/TransactionButton";
import TruncatedText from "components/ui/TruncatedText";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { MarketCategoricalOutcome } from "lib/types";
import { calcMarketColors } from "lib/util/color-calc";
import { useState } from "react";
import { RiArrowDownSLine } from "react-icons/ri";

const CategoricalReportBox = ({
  market,
  onReport,
}: {
  market: Market<IndexerContext>;
  onReport?: (outcome: MarketCategoricalOutcome) => void;
}) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const notificationStore = useNotifications();

  if (!market) return null;

  const outcomeAssets = market.outcomeAssets.map(
    (assetIdString) =>
      parseAssetId(assetIdString).unwrap() as CategoricalAssetId,
  );

  const [selectedOutcome, setSelectedOutcome] = useState(outcomeAssets[0]);

  const { send, isLoading, isBroadcasting, isSuccess } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk)) return;

      if (!IOCategoricalAssetId.is(selectedOutcome)) return;

      const ID = selectedOutcome.CategoricalOutcome[1];

      return sdk.api.tx.predictionMarkets.report(market.marketId, {
        Categorical: ID,
      });
    },
    {
      onBroadcast: () => {},
      onSuccess: () => {
        if (onReport) {
          onReport?.({ categorical: getIndexOf(selectedOutcome) });
        } else {
          notificationStore.pushNotification("Outcome Reported", {
            type: "Success",
          });
        }
      },
    },
  );

  const reportDisabled = !sdk || !isRpcSdk(sdk) || isLoading || isSuccess;

  const handleSignTransaction = async () => send();

  return (
    <div className="relative">
      <div className="relative">
        <Listbox
          value={selectedOutcome}
          onChange={(assetId) => {
            setSelectedOutcome(assetId);
          }}
        >
          <Listbox.Button className="mb-2 w-full">
            <div className="center gap-2 text-2xl">
              <TruncatedText
                length={24}
                text={
                  market.categories?.[getIndexOf(selectedOutcome)]?.name ?? ""
                }
              >
                {(text) => <>{text}</>}
              </TruncatedText>
              {outcomeAssets && outcomeAssets.length > 1 && (
                <RiArrowDownSLine />
              )}
            </div>
          </Listbox.Button>
          <Listbox.Options className="absolute top-[100%] left-[50%] -translate-x-[50%] min-w-[290px] mt-1 rounded-xl shadow-lg z-50 bg-fog-of-war text-white">
            {outcomeAssets?.map((asset, index) => {
              const assetIndex = getIndexOf(asset);
              const category = market?.categories?.[assetIndex];
              const colors = calcMarketColors(
                market?.marketId!,
                outcomeAssets.length,
              );
              return (
                <Listbox.Option
                  key={assetIndex}
                  value={asset}
                  className="font-light flex gap-3 items-center text-base mb-2 cursor-pointer py-4 px-5 hover:bg-slate-50 hover:bg-opacity-10"
                >
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: colors[index] }}
                  ></div>
                  {category?.name || assetIndex}
                </Listbox.Option>
              );
            })}
          </Listbox.Options>
        </Listbox>
      </div>

      <TransactionButton
        className="my-ztg-10 shadow-ztg-2 center"
        onClick={handleSignTransaction}
        disabled={reportDisabled}
        loading={isBroadcasting}
      >
        <span className="mr-1">Report Outcome</span>
        <TruncatedText
          length={12}
          text={market.categories?.[getIndexOf(selectedOutcome)]?.name ?? ""}
        >
          {(text) => <>{text}</>}
        </TruncatedText>
      </TransactionButton>
    </div>
  );
};

export default CategoricalReportBox;
