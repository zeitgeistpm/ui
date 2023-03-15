import Link from "next/link";

const MarketPositionHeader = ({
  marketId,
  question,
}: {
  marketId: number;
  question: string;
}) => {
  return (
    <h2 className="text-ztg-16-150 text-center mb-6">
      <Link href={`/markets/${marketId}`}>{question}</Link>
    </h2>
  );
};

export default MarketPositionHeader;
