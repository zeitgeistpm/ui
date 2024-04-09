import { useQueryClient } from "@tanstack/react-query";
import {
  CategoricalAssetId,
  getIndexOf,
  IndexerContext,
  isRpcSdk,
  Market,
  MarketOutcomeAssetId,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import TransactionButton from "components/ui/TransactionButton";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import {
  marketDisputesRootKey,
  useMarketDisputes,
} from "lib/hooks/queries/useMarketDisputes";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { findAsset } from "lib/util/assets";

const CategoricalDisputeBox = ({
  market,
  assetId,
  onSuccess,
}: {
  market: Market<IndexerContext>;
  assetId?: MarketOutcomeAssetId;
  onSuccess?: () => void;
}) => {
  const [sdk, id] = useSdkv2();
  const { data: disputes } = useMarketDisputes(market);
  const notificationStore = useNotifications();
  const queryClient = useQueryClient();
  const { data: constants, isLoading: isConstantsLoading } =
    useChainConstants();

  const outcomeAssets = market.assets
    .map(({ assetId }) => parseAssetId(assetId).unwrap() as CategoricalAssetId)
    .filter(
      (asset) => market.report?.outcome?.categorical !== getIndexOf(asset),
    );

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
        queryClient.invalidateQueries([
          id,
          marketDisputesRootKey,
          market.marketId,
        ]);
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
        <span className="text-[14px] text-sky-600">Previous Report:</span>
        <span className="">{getPreviousReportName()}</span>
      </div>
      {/* <div className="flex flex-col item-center text-center">
        <span className="text-sky-600 text-[14px]">New Report:</span>

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
          <span className="text-[14px] text-sky-600">Previous Bond:</span>
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
