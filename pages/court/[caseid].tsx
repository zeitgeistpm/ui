import { ScalarRangeType, ZTG } from "@zeitgeistpm/sdk-next";
import MarketAssetDetails from "components/markets/MarketAssetDetails";
import ScalarPriceRange from "components/markets/ScalarPriceRange";
import Decimal from "decimal.js";
import { useCaseMarketId } from "lib/hooks/queries/court/useCaseMarketId";
import { useMarket } from "lib/hooks/queries/useMarket";
import { isMarketCategoricalOutcome } from "lib/types";
import { useRouter } from "next/router";
import { NextPage } from "next/types";

const CasePage: NextPage = () => {
  const router = useRouter();
  const { caseid } = router.query;
  const caseId = Number(caseid);
  console.log(caseId);
  const { data: marketId } = useCaseMarketId(caseId);
  const { data: market } = useMarket(
    marketId != null ? { marketId } : undefined,
  );

  const reportedOutcome =
    market?.report?.outcome != null &&
    isMarketCategoricalOutcome(market.report?.outcome)
      ? market.report?.outcome.categorical
      : market?.report?.outcome.scalar?.toString();

  return (
    <div className="flex flex-col">
      <div>Case - {caseid}</div>
      <div>{market && market.question}</div>
      <div>Original Report:{reportedOutcome}</div>
      <div>Timings?</div>
      <div>Jurors Table?</div>
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
