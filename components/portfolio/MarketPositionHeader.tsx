import Link from "next/link";

const MarketPositionHeader = ({
  marketId,
  question,
}: {
  marketId: number;
  question?: string;
}) => {
  return (
    <h3 className="text-ztg-16-150 mb-6 font-normal">
      <Link href={`/markets/${marketId}`}>{question}</Link>
    </h3>
  );
};

export default MarketPositionHeader;
