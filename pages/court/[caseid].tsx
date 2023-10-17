import { ScalarRangeType, ZTG, isRpcSdk } from "@zeitgeistpm/sdk";
import MarketAssetDetails from "components/markets/MarketAssetDetails";
import ScalarPriceRange from "components/markets/ScalarPriceRange";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { useCaseMarketId } from "lib/hooks/queries/court/useCaseMarketId";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { isMarketCategoricalOutcome } from "lib/types";
import { useRouter } from "next/router";
import { NextPage } from "next/types";
import NotFoundPage from "pages/404";

const CasePage: NextPage = () => {
  if (process.env.NEXT_PUBLIC_SHOW_COURT !== "true") {
    return <NotFoundPage />;
  }
  const router = useRouter();
  const { caseid } = router.query;
  const caseId = Number(caseid);
  const { data: marketId } = useCaseMarketId(caseId);
  const { data: market } = useMarket(
    marketId != null ? { marketId } : undefined,
  );
  const [sdk] = useSdkv2();
  const notificationStore = useNotifications();
  const wallet = useWallet();

  const reportedOutcome =
    market?.report?.outcome != null &&
    isMarketCategoricalOutcome(market.report?.outcome)
      ? market.report?.outcome.categorical
      : market?.report?.outcome.scalar?.toString();

  const {
    isLoading: isAppealLoading,
    send: appeal,
    fee,
  } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk)) return;

      return sdk.api.tx.court.appeal(caseId);
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Successfully appeal case result", {
          type: "Success",
        });
      },
    },
  );
  return (
    <div className="flex flex-col">
      <div>Case - {caseid}</div>
      <div>{market && market.question}</div>
      <div>Original Report:{reportedOutcome}</div>
      <div>Timings?</div>
      <div>Jurors Table?</div>
      <TransactionButton onClick={appeal} disabled={isAppealLoading}>
        Appeal
      </TransactionButton>
      {market?.marketType?.scalar !== null &&
        market?.scalarType &&
        market.marketType.scalar?.[0] != null &&
        market.marketType.scalar[1] != null && (
          <ScalarPriceRange
            className="rounded-lg"
            scalarType={market.scalarType as ScalarRangeType}
            lowerBound={new Decimal(market.marketType.scalar[0])
              .div(ZTG)
              .toNumber()}
            upperBound={new Decimal(market.marketType.scalar[1])
              .div(ZTG)
              .toNumber()}
            status={market.status}
          />
        )}
      {marketId != null && <MarketAssetDetails marketId={marketId} />}
    </div>
  );
};

export default CasePage;
