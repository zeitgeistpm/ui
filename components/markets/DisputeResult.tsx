import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { TwitterBird } from "components/markets/TradeResult";
import { AiOutlineFileDone } from "react-icons/ai";

export const DisputeResult = ({ market }: { market: FullMarketFragment }) => {
  const marketUrl = `https://app.zeitgeist.pm/markets/${market.marketId}`;

  const twitterBaseUrl = "https://twitter.com/intent/tweet?text=";
  const tweetUrl = `${twitterBaseUrl}I just disputed the outcome of %40ZeitgeistPM market: "${market.question}"%0A%0ACheck out the market here%3A%0A&url=${marketUrl}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div>
        <AiOutlineFileDone size={64} className="text-ztg-blue" />
      </div>
      <p className="text">Successfully disputed!</p>

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

export default DisputeResult;
