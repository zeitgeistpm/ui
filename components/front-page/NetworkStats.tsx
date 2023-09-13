const StatCard = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="flex flex-col bg-white w-full items-center justify-center rounded-md py-2">
      <div className="">
        <div className="text-3xl font-mono text-center mb-1 md:mb-0 md:text-left">
          {value}
        </div>
        <div className="text-sm font-light">{title}</div>
      </div>
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
    <div className="relative w-full flex flex-col sm:flex-row gap-4 mt-10 z-10">
      <StatCard
        title="All-time trading volume"
        value={`$${new Intl.NumberFormat("en-US", {
          maximumSignificantDigits: 5,
        }).format(totalVolumeUsd)}`}
      />
      <StatCard title="Markets Created" value={marketCount.toString()} />
      <StatCard title="Total Traders" value={tradersCount.toString()} />
    </div>
  );
};

export default NetworkStats;
