import Decimal from "decimal.js";

export const TwitterBird = () => {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="54" height="54" rx="27" fill="white" />
      <path
        d="M23.5502 37.7497C32.6045 37.7497 37.5583 30.2465 37.5583 23.7416C37.5583 23.5307 37.5536 23.3151 37.5442 23.1041C38.5079 22.4072 39.3395 21.544 40 20.5551C39.1025 20.9544 38.1496 21.2151 37.1739 21.3285C38.2013 20.7127 38.9705 19.7452 39.3391 18.6055C38.3726 19.1783 37.3156 19.5824 36.2134 19.8004C35.4708 19.0113 34.489 18.4889 33.4197 18.3138C32.3504 18.1387 31.2532 18.3208 30.2977 18.8319C29.3423 19.3429 28.5818 20.1545 28.1338 21.1411C27.6859 22.1277 27.5754 23.2344 27.8195 24.2901C25.8625 24.1918 23.9479 23.6835 22.2 22.7979C20.452 21.9122 18.9097 20.6692 17.673 19.1493C17.0444 20.233 16.8521 21.5154 17.135 22.7358C17.418 23.9563 18.1551 25.0232 19.1964 25.7197C18.4146 25.6949 17.65 25.4844 16.9656 25.1057V25.1666C16.9649 26.3039 17.3581 27.4063 18.0783 28.2865C18.7985 29.1667 19.8013 29.7703 20.9162 29.9947C20.1921 30.1929 19.432 30.2218 18.6948 30.0791C19.0095 31.0572 19.6216 31.9126 20.4458 32.5261C21.27 33.1395 22.2651 33.4804 23.2923 33.501C21.5484 34.8709 19.3942 35.6139 17.1766 35.6104C16.7833 35.6098 16.3904 35.5857 16 35.5382C18.2529 36.9835 20.8735 37.7511 23.5502 37.7497Z"
        fill="#748296"
      />
      <rect
        x="1"
        y="1"
        width="54"
        height="54"
        rx="27"
        stroke="#B5C1CA"
        strokeWidth="2"
      />
    </svg>
  );
};

interface TradeResultProps {
  type: "buy" | "sell";
  amount?: Decimal;
  tokenName?: string;
  baseTokenAmount?: Decimal;
  baseToken?: string;
  marketId: number;
  marketQuestion?: string;
  onContinueClick?: () => void;
}

const TradeResult = ({
  type,
  amount,
  tokenName,
  baseTokenAmount,
  baseToken,
  marketId,
  marketQuestion,
  onContinueClick,
}: TradeResultProps) => {
  const marketUrl = `https://app.zeitgeist.pm/markets/${marketId}`;
  const potentialGain = amount?.div(baseTokenAmount ?? 0);
  const twitterBaseUrl = "https://twitter.com/intent/tweet?text=";
  const tweetUrl =
    type === "buy"
      ? `${twitterBaseUrl}I'm using %40ZeitgeistPM to bet on "${marketQuestion}" %0A%0AIf I'm right, I'll gain ${potentialGain
          ?.minus(1)
          .times(100)
          .toFixed(
            0,
          )}%25!%0A%0ACheck out the market here%3A%0A&url=${marketUrl}`
      : `${twitterBaseUrl}I'm using %40ZeitgeistPM to bet on "${marketQuestion}" %0A%0ACheck out the market here%3A%0A&url=${marketUrl}`;

  return (
    <div className="flex flex-col items-center gap-y-[10px] rounded-ztg-10 bg-white p-[30px] text-ztg-18-150">
      <div>You've just {type === "buy" ? "bought" : "sold"}</div>
      <div className="text-[58px]">{amount?.toFixed(2)}</div>
      <div className="text-center">
        <span className="font-bold capitalize">{tokenName}</span> Predictions
        For
        <div className="font-bold">
          {baseTokenAmount?.toFixed(2)} {baseToken}
        </div>
      </div>
      <a
        target="_blank"
        rel="noopener noreferrer"
        href={tweetUrl}
        className="mb-4"
      >
        <TwitterBird />
      </a>

      <button onClick={onContinueClick} className="text-ztg-blue font-bold">
        Continue Trading
      </button>
    </div>
  );
};

export default TradeResult;
