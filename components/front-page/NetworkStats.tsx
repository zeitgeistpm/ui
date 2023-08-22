const StatCard = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="flex flex-col bg-white w-full items-center justify-center rounded-md py-2">
      <div className="text-[26px]">{value}</div>
      <div className="text-sm">{title}</div>
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
    <div className="w-full flex flex-col sm:flex-row gap-4 mt-10">
      <StatCard
        title="Total Volume"
        value={`$${new Intl.NumberFormat("en-US", {
          maximumSignificantDigits: 5,
        }).format(totalVolumeUsd)}`}
      />
      <StatCard title="Markets Created" value={marketCount.toString()} />
      <StatCard title="Traders" value={tradersCount.toString()} />
    </div>
  );
};

export default NetworkStats;
