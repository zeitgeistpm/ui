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
    <div className="flex flex-col items-center gap-y-3 p-[30px]">
      <div className="text-[22px] font-bold">Dispute Outcome</div>
      <div className="mb-[20px] flex flex-col items-center justify-center gap-3 text-center">
        <div>
          Bond cost: {disputeBond} {tokenSymbol}
        </div>
        <div className="font-bold">
          Bonds will be slashed if the reported outcome is deemed to be
          incorrect
        </div>
      </div>

      <div className="item-center flex flex-col text-center">
        <span className="text-[14px] text-ztg-primary-600">
          Previous Report:
        </span>
        <span className="">{getPreviousReportName()}</span>
      </div>
      {/* <div className="flex flex-col item-center text-center">
        <span className="text-ztg-primary-600 text-[14px]">New Report:</span>

        <div className="mb-4">
          {market && selectedAssetId && (
            <MarketContextActionOutcomeSelector
              market={market}
              selected={selectedAssetId}
              options={outcomeAssets}
              onChange={(assetId) => {
                setSelectedAssetId(assetId as CategoricalAssetId);
              }}
            />
          )}
        </div>
      </div> */}
      {bondAmount !== disputeBond && bondAmount !== undefined && (
        <div className="item-center flex flex-col text-center">
          <span className="text-[14px] text-ztg-primary-600">
            Previous Bond:
          </span>
          <span className="">{bondAmount}</span>
        </div>
      )}
      <TransactionButton
        className="mb-ztg-10 mt-[20px]"
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
