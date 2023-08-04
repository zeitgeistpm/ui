const StatCard = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="flex flex-col bg-blue-100 w-full items-center justify-center">
      <div>{title}</div>
      <div>{value}</div>
    </div>
  );
};

const NetworkStats = ({
  tradersCount,
  marketCount,
  totalVolumeUsd,
}: {
  tradersCount: number;
  marketCount: number;
  totalVolumeUsd: number;
}) => {
  return (
    <div className="w-full flex justify-between gap-4">
      <StatCard title="Traders" value={tradersCount.toString()} />
      <StatCard title="Markets Created" value={marketCount.toString()} />
      <StatCard
        title="Total Volume"
        value={new Intl.NumberFormat("en-US", {
          maximumSignificantDigits: 5,
          notation: "compact",
        }).format(totalVolumeUsd)}
      />
    </div>
  );
};

export default NetworkStats;
