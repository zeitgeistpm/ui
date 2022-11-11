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

  const handleLeftClick = () => {
    console.log("left");
  };
  const handleRightClick = () => {
    console.log("right");
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-ztg-30">
        <div className="font-lato font-bold text-[28px]">{title}</div>
        <div className="flex ml-auto">
          <button
            onClick={handleLeftClick}
            className="w-[20px] h-[20px] bg-blue-600 mr-[10px]"
          ></button>
          <button
            onClick={handleRightClick}
            className="w-[20px] h-[20px] bg-red-600"
          ></button>
        </div>
      </div>
      {/* <div className="flex h-[175px] gap-x-[30px] overflow-auto"> */}
      <div className="flex h-[175px] gap-x-[30px] overflow-x-scroll no-scroll-bar">
        {markets.map((market) => (
          <div className="bg-anti-flash-white rounded-ztg-10 min-w-[320px] w-full"></div>
        ))}
      </div>
    </div>
  );
};

export default MarketScroll;
