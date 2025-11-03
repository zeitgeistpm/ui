import { Listbox } from "@headlessui/react";
import {
  CategoricalAssetId,
  getIndexOf,
  IndexerContext,
  IOCategoricalAssetId,
  isRpcSdk,
  Market,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import {
  CombinatorialToken,
  isCombinatorialToken,
} from "lib/types/combinatorial";
import MarketContextActionOutcomeSelector from "components/markets/MarketContextActionOutcomeSelector";
import TransactionButton from "components/ui/TransactionButton";
import TruncatedText from "components/ui/TruncatedText";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { MarketCategoricalOutcome } from "lib/types";
import { calcMarketColors } from "lib/util/color-calc";
import { parseAssetIdStringWithCombinatorial } from "lib/util/parse-asset-id";
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

  const outcomeAssets = market.outcomeAssets.map((assetIdString) =>
    parseAssetIdStringWithCombinatorial(assetIdString),
  );

  // Filter to only categorical and combinatorial tokens, exclude scalar outcomes
  const categoricalOutcomeAssets = outcomeAssets.filter(
    (asset): asset is CategoricalAssetId | CombinatorialToken =>
      !("ScalarOutcome" in asset),
  );

  const [selectedOutcome, setSelectedOutcome] = useState<
    CategoricalAssetId | CombinatorialToken
  >(categoricalOutcomeAssets[0]);

  // Helper function to get the categorical index from either outcome type
  const getCategoricalIndex = (
    outcome: CategoricalAssetId | CombinatorialToken,
  ): number | undefined => {
    if (isCombinatorialToken(outcome)) {
      // Find the index of this combinatorial token in the outcomeAssets array
      const index = outcomeAssets.findIndex(
        (asset) =>
          isCombinatorialToken(asset) &&
          asset.CombinatorialToken === outcome.CombinatorialToken,
      );
      return index >= 0 ? index : undefined;
    } else if (IOCategoricalAssetId.is(outcome)) {
      return getIndexOf(outcome);
    }
    return undefined;
  };

  const { send, isLoading, isBroadcasting, isSuccess } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk)) return;

      // Get the categorical index regardless of token type
      const categoricalIndex = getCategoricalIndex(selectedOutcome);
      if (categoricalIndex === undefined) return;

      // Always report as Categorical with the index
      return sdk.api.tx.predictionMarkets.report(market.marketId, {
        Categorical: categoricalIndex,
      });
    },
    {
      onBroadcast: () => {},
      onSuccess: () => {
        if (onReport) {
          // Always pass the categorical index
          const categoricalIndex = getCategoricalIndex(selectedOutcome);
          if (categoricalIndex !== undefined) {
            onReport?.({ categorical: categoricalIndex });
          }
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
    <>
      <div className="mb-8">
        {market && selectedOutcome && (
          <MarketContextActionOutcomeSelector
            market={market}
            selected={selectedOutcome}
            options={outcomeAssets}
            onChange={(assetId) => {
              setSelectedOutcome(
                assetId as CategoricalAssetId | CombinatorialToken,
              );
            }}
          />
        )}
      </div>
      <TransactionButton
        className="center my-ztg-10"
        onClick={handleSignTransaction}
        disabled={reportDisabled}
        loading={isBroadcasting}
      >
        <span className="mr-1">Report Outcome</span>
        <TruncatedText
          length={12}
          text={
            // Use the categorical index to get the category name for both types
            market.categories?.[getCategoricalIndex(selectedOutcome) ?? 0]
              ?.name ?? ""
          }
        >
          {(text) => <>{text}</>}
        </TruncatedText>
      </TransactionButton>
    </>
  );
};

export default CategoricalReportBox;
