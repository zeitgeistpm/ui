import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { ScalarRangeType } from "@zeitgeistpm/sdk";
import { TwitterBird } from "components/markets/TradeResult";
import {
  MarketCategoricalOutcome,
  MarketScalarOutcome,
  displayOutcome,
} from "lib/types";
import { AiOutlineFileDone } from "react-icons/ai";

export const DisputeResult = ({ market }: { market: FullMarketFragment }) => {
  const marketUrl = `https://app.zeitgeist.pm/markets/${market.marketId}`;

  const twitterBaseUrl = "https://twitter.com/intent/tweet?text=";
  const tweetUrl = `${twitterBaseUrl}I just disputed the outcome of %40ZeitgeistPM market: "${market.question}"%0A%0ACheck out the market here%3A%0A&url=${marketUrl}`;

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-orange-400/50 bg-orange-500/30 backdrop-blur-md">
        <AiOutlineFileDone size={32} className="text-orange-400" />
      </div>
      <p className="text-lg font-semibold text-white">Successfully disputed!</p>

      <a
        target="_blank"
        rel="noopener noreferrer"
        href={tweetUrl}
        className="mt-2 rounded-lg border-2 border-white/10 bg-ztg-primary-800/60 px-4 py-2 backdrop-blur-md transition-all hover:bg-ztg-primary-700/60"
      >
        <TwitterBird />
      </a>
    </div>
  );
};

export default DisputeResult;
