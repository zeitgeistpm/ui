import { IndexerContext, isRpcSdk, Market } from "@zeitgeistpm/sdk-next";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useMarketDisputes } from "lib/hooks/queries/useMarketDisputes";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import moment from "moment";

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
  const disputeFactor = constants?.markets.disputeFactor;
  const tokenSymbol = constants?.tokenSymbol;

  const { data: disputes } = useMarketDisputes(market);
  const lastDispute = disputes?.[disputes.length - 1];

  const wallet = useWallet();
  const signer = wallet.activeAccount;

  const bondAmount =
    disputes && disputeBond && disputeFactor
      ? disputeBond + disputes.length * disputeFactor
      : disputeBond;

  const isScalarDate = market.scalarType === "date";

  const getPreviousReport = () => {
    const reportVal = new Decimal(
      lastDispute?.outcome.asScalar.toString() ?? market.report?.outcome.scalar,
    )
      .div(ZTG)
      .toString();
    if (isScalarDate) {
      return moment(Number(reportVal)).format("YYYY-MM-DD HH:mm");
    } else {
      return reportVal;
    }
  };

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
        <span className="">{getPreviousReport()}</span>
      </div>
      {/* {isScalarDate ? (
        <DateTimeInput
          timestamp={scalarReportValue}
          onChange={setScalarReportValue}
          isValidDate={(current) => {
            const loBound = bounds[0].toNumber();
            const hiBound = bounds[1].toNumber();
            if (current.valueOf() >= loBound && current.valueOf() <= hiBound) {
              return true;
            }
            return false;
          }}
        />
      ) : (
        <Input
          type="number"
          value={scalarReportValue}
          placeholder="New reported value"
          onChange={(e) => setScalarReportValue(e.target.value)}
          min={bounds[0].toString()}
          max={bounds[1].toString()}
          className="text-ztg-14-150 p-2 bg-sky-200 rounded-md w-full outline-none text-center font-mono mt-2"
        />
      )} */}

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
