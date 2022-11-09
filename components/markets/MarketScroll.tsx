interface MarketCardData {}

interface MarketScrollProps {}

const MarketScroll = ({
  title,
  markets,
}: {
  title: string;
  markets: MarketScrollProps[];
}) => {
  console.log(markets);

  return (
    <div className="flex flex-col ">
      <div>{title}</div>
      <div className="flex h-[175px] gap-x-[30px]">
        {markets.map((market) => (
          <div className="bg-anti-flash-white rounded-ztg-10 min-w-[320px] w-full"></div>
        ))}
      </div>
    </div>
  );
};

export default MarketScroll;
