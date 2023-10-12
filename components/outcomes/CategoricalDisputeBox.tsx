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

  const outcomeAssets = market.outcomeAssets
    .map(
      (assetIdString) =>
        parseAssetId(assetIdString).unwrap() as CategoricalAssetId,
    )
    .filter(
      (asset) => market.report?.outcome.categorical !== getIndexOf(asset),
    );

  const disputeBond = constants?.markets.disputeBond;
  const tokenSymbol = constants?.tokenSymbol;

  const lastDispute = disputes?.[disputes.length - 1];

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
    const reportIndex =
      lastDispute?.outcome.asCategorical.toNumber() ??
      market.report?.outcome.categorical;

    if (reportIndex == null) return;

    return market?.categories?.[reportIndex]?.name;
  };

  return (
    <div className="p-[30px] flex flex-col items-center gap-y-3">
      <div className="font-bold text-[22px]">Dispute Outcome</div>
      <div className="text-center mb-[20px]">
        Bond cost: {disputeBond} {tokenSymbol}
        <span className="font-bold">
          Bonds will be slashed if the reported outcome is deemed to be
          incorrect
        </span>
      </div>

      <div className="flex flex-col item-center text-center">
        <span className="text-sky-600 text-[14px]">Previous Report:</span>
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
        <div className="flex flex-col item-center text-center">
          <span className="text-sky-600 text-[14px]">Previous Bond:</span>
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
