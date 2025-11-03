import { useQueryClient } from "@tanstack/react-query";
import {
  AssetId,
  CategoricalAssetId,
  getIndexOf,
  IndexerContext,
  IOCategoricalAssetId,
  isRpcSdk,
  Market,
} from "@zeitgeistpm/sdk";
import {
  CombinatorialToken,
  isCombinatorialToken,
} from "lib/types/combinatorial";
import { parseAssetIdStringWithCombinatorial } from "lib/util/parse-asset-id";
import TransactionButton from "components/ui/TransactionButton";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import {
  marketDisputesRootKey,
  useMarketDisputes,
} from "lib/hooks/queries/useMarketDisputes";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";

const CategoricalDisputeBox = ({
  market,
  assetId,
  onSuccess,
}: {
  market: Market<IndexerContext>;
  assetId?: AssetId;
  onSuccess?: () => void;
}) => {
  const [sdk, id] = useSdkv2();
  const { data: disputes } = useMarketDisputes(market);
  const notificationStore = useNotifications();
  const queryClient = useQueryClient();
  const { data: constants, isLoading: isConstantsLoading } =
    useChainConstants();

  // Helper function to get the categorical index from either outcome type
  const getCategoricalIndex = (
    outcome: CategoricalAssetId | CombinatorialToken,
    allAssets: any[],
  ): number | undefined => {
    if (isCombinatorialToken(outcome)) {
      // Find the index of this combinatorial token in the allAssets array
      const index = allAssets.findIndex(
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

  const allOutcomeAssets = market.outcomeAssets.map((assetIdString) =>
    parseAssetIdStringWithCombinatorial(assetIdString),
  );

  // Filter to only categorical and combinatorial tokens, exclude scalar outcomes
  const categoricalOutcomeAssets = allOutcomeAssets.filter(
    (asset): asset is CategoricalAssetId | CombinatorialToken =>
      !("ScalarOutcome" in asset),
  );

  const outcomeAssets = categoricalOutcomeAssets.filter((asset) => {
    const assetIndex = getCategoricalIndex(asset, allOutcomeAssets);
    return market.report?.outcome?.categorical !== assetIndex;
  });

  const disputeBond = constants?.markets.disputeBond;
  const tokenSymbol = constants?.tokenSymbol;

  const bondAmount =
    disputes && isConstantsLoading === false ? disputeBond : undefined;

  const {
    send: dispute,
    isLoading,
    isBroadcasting,
  } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        return sdk.api.tx.predictionMarkets.dispute(market.marketId);
      }
    },
    {
      onBroadcast: () => {},
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [id, marketDisputesRootKey, market.marketId],
        });
        if (onSuccess) {
          onSuccess();
        } else {
          notificationStore.pushNotification(`Successfully disputed.`, {
            type: "Success",
          });
        }
      },
    },
  );

  const getPreviousReportName = () => {
    const reportIndex = market.report?.outcome?.categorical;

    if (reportIndex == null) return;

    return market?.categories?.[reportIndex]?.name;
  };

  return (
    <div className="flex flex-col items-center gap-y-4">
      
      <div className="mb-4 flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-orange-400/40 bg-orange-500/20 p-4 text-center backdrop-blur-md">
        <div className="text-sm text-white/90">
          Bond cost: <span className="font-semibold text-white">{disputeBond} {tokenSymbol}</span>
        </div>
        <div className="text-sm font-semibold text-white/90">
          Bonds will be slashed if the reported outcome is deemed to be incorrect
        </div>
      </div>

      <div className="flex flex-col items-center text-center">
        <span className="text-sm text-white/70">
          Previous Report:
        </span>
        <span className="mt-1 font-semibold text-white">{getPreviousReportName()}</span>
      </div>
      
      {bondAmount !== disputeBond && bondAmount !== undefined && (
        <div className="flex flex-col items-center text-center">
          <span className="text-sm text-white/70">
            Previous Bond:
          </span>
          <span className="mt-1 font-semibold text-white">{bondAmount}</span>
        </div>
      )}
      
      <TransactionButton
        className="mt-4 w-full"
        onClick={() => dispute()}
        disabled={isLoading}
        loading={isBroadcasting}
      >
        Confirm Dispute
      </TransactionButton>
    </div>
  );
};

export default CategoricalDisputeBox;
