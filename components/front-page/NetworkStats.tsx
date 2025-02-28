const StatCard = ({ title, value }: { title: string; value: string }) => {
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-md bg-white py-2">
      <div className="">
        <div className="mb-1 text-center font-mono text-3xl md:mb-0 md:text-left">
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
    <div className="relative z-10 mt-10 flex w-full flex-col gap-4 sm:flex-row">
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
