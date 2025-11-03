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
    <div className="flex flex-col items-center gap-y-4">
      
      <div className="mb-4 flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-orange-400/40 bg-orange-500/20 p-4 text-center backdrop-blur-md">
        <div className="text-sm text-white/90">
          Bond cost: <span className="font-semibold text-white">{disputeBond} {tokenSymbol}</span>
        </div>
        <div className="text-sm font-semibold text-white/90">
          Bonds will be slashed if the reported outcome is deemed to be incorrect
        </div>
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
