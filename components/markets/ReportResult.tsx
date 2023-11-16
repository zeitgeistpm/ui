import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { ScalarRangeType } from "@zeitgeistpm/sdk";
import { TwitterBird } from "components/markets/TradeResult";
import {
  MarketCategoricalOutcome,
  MarketScalarOutcome,
  displayOutcome,
} from "lib/types";
import { AiOutlineFileDone } from "react-icons/ai";

export const ReportResult = ({
  market,
  outcome,
}: {
  market: FullMarketFragment;
  outcome:
    | MarketCategoricalOutcome
    | (MarketScalarOutcome & { type: ScalarRangeType });
}) => {
  const outcomeName = displayOutcome(market, outcome);

  const marketUrl = `https://app.zeitgeist.pm/markets/${market.marketId}`;

  const twitterBaseUrl = "https://twitter.com/intent/tweet?text=";
  const tweetUrl = `${twitterBaseUrl}I just reported the outcome of %40ZeitgeistPM market: "${market.question}" to be ${outcomeName}%0A%0ACheck out the market here%3A%0A&url=${marketUrl}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div>
        <AiOutlineFileDone size={64} className="text-ztg-blue" />
      </div>
      <p className="text">Successfully reported!</p>
      <div className="mb-4 text-2xl font-semibold">
        {"scalar" in outcome && "Value: "}
        {outcomeName}
      </div>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={tweetUrl}
        className="mb-4"
      >
        <TwitterBird />
      </a>
    </div>
  );
};

export default ReportResult;
