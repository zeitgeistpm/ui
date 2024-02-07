import { IndexerContext, isRpcSdk, Market } from "@zeitgeistpm/sdk";
import { MarketStatus } from "@zeitgeistpm/indexer";
import TransactionButton from "components/ui/TransactionButton";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";

const ScalarDisputeBox = ({
  market,
  onSuccess,
}: {
  market: Market<IndexerContext>;
  onSuccess?: () => void;
}) => {
  const [sdk] = useSdkv2();
  const notificationStore = useNotifications();
  const { data: constants } = useChainConstants();

  const disputeBond = constants?.markets.disputeBond;
  const tokenSymbol = constants?.tokenSymbol;

  const wallet = useWallet();
  const signer = wallet.activeAccount;

  const bondAmount =
    market.status === MarketStatus.Disputed && disputeBond
      ? disputeBond
      : undefined;

  const isScalarDate = market.scalarType === "date";

  const { send, isLoading, isBroadcasting } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk) || !signer) return;
      return sdk.api.tx.predictionMarkets.dispute(market.marketId);
    },
    {
      onBroadcast: () => {},
      onSuccess: () => {
        if (onSuccess) {
          onSuccess?.();
        } else {
          notificationStore.pushNotification("Outcome Disputed", {
            type: "Success",
          });
        }
      },
    },
  );

  const handleSignTransaction = async () => send();

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

      {bondAmount !== disputeBond && bondAmount !== undefined && (
        <div className="item-center flex flex-col text-center">
          <span className="text-[14px] text-sky-600">Previous Bond:</span>
          <span className="">{bondAmount}</span>
        </div>
      )}
      <TransactionButton
        className="mb-ztg-10 mt-[20px]"
        onClick={handleSignTransaction}
        disabled={isLoading}
        loading={isBroadcasting}
      >
        Confirm Dispute
      </TransactionButton>
    </div>
  );
};

export default ScalarDisputeBox;
