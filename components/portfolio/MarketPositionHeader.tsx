import Link from "next/link";

const MarketPositionHeader = ({
  marketId,
  question,
}: {
  marketId: number;
  question: string;
}) => {
  return (
    <h2 className="text-xl text-center font-light mb-6">
      <Link href={`/markets/${marketId}`}>
        <span className="hover:text-blue-600">{question}</span>
      </Link>
    </h2>
  );
};

export default MarketPositionHeader;
