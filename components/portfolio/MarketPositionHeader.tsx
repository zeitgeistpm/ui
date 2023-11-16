import Link from "next/link";

const MarketPositionHeader = ({
  marketId,
  question,
}: {
  marketId: number;
  question?: string;
}) => {
  return (
    <h3 className="mb-5 text-sm font-normal sm:text-base">
      <Link href={`/markets/${marketId}`}>{question}</Link>
    </h3>
  );
};

export default MarketPositionHeader;
