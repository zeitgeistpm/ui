import { useQueryClient } from "@tanstack/react-query";
import {
  getIndexOf,
  IndexerContext,
  isRpcSdk,
  Market,
  MarketOutcomeAssetId,
} from "@zeitgeistpm/sdk-next";
import TransactionButton from "components/ui/TransactionButton";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsicFee } from "lib/hooks/queries/useExtrinsicFee";
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
  assetId: MarketOutcomeAssetId;
  onSuccess?: () => void;
}) => {
  const [sdk, id] = useSdkv2();
  const { data: disputes } = useMarketDisputes(market);
  const notificationStore = useNotifications();
  const queryClient = useQueryClient();
  const { data: constants, isLoading: isConstantsLoading } =
    useChainConstants();

  const disputeBond = constants?.markets.disputeBond;
  const disputeFactor = constants?.markets.disputeFactor;
  const tokenSymbol = constants?.tokenSymbol;

  const lastDispute = disputes?.[disputes.length - 1];
  const assetName = market.categories?.[getIndexOf(assetId)]?.name;
  const bondAmount =
    disputes && isConstantsLoading === false
      ? disputeBond! + disputes.length * disputeFactor!
      : disputeBond;

  const { send: dispute, isLoading } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        return sdk.api.tx.predictionMarkets.dispute(market.marketId, {
          Categorical: getIndexOf(assetId),
        });
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([
          id,
          marketDisputesRootKey,
          market.marketId,
        ]);
        notificationStore.pushNotification(
          `Successfully disputed. New report: ${assetName}`,
          {
            type: "Success",
          },
        );
        onSuccess?.();
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
        Bond will start at {disputeBond} {tokenSymbol}, increasing by{" "}
        {disputeFactor} {tokenSymbol} for each dispute.{" "}
        <span className="font-bold">
          Bonds will be slashed if the reported outcome is deemed to be
          incorrect
        </span>
      </div>

      <div className="flex flex-col item-center text-center">
        <span className="text-sky-600 text-[14px]">Previous Report:</span>
        <span className="">{getPreviousReportName()}</span>
      </div>
      <div className="flex flex-col item-center text-center">
        <span className="text-sky-600 text-[14px]">New Report:</span>
        <span className="">{assetName}</span>
      </div>
      {bondAmount !== disputeBond &&
      bondAmount !== undefined &&
      disputeFactor !== undefined ? (
        <div className="flex flex-col item-center text-center">
          <span className="text-sky-600 text-[14px]">Previous Bond:</span>
          <span className="">{bondAmount - disputeFactor}</span>
        </div>
      ) : (
        <></>
      )}
      <TransactionButton
        className="mb-ztg-10 mt-[20px]"
        onClick={() => dispute()}
        disabled={isLoading}
      >
        Confirm Dispute
      </TransactionButton>
    </div>
  );
};

export default CategoricalDisputeBox;
