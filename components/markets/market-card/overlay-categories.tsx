export type MarketCategory = { name?: string; color?: string };
export type MarketCategories = MarketCategory[];

export type MarketCardOverlayCategoryProps = {
  category: MarketCategory;
  className?: string;
};

const MarketCardOverlayCategory = ({
  category,
  className = "",
}: MarketCardOverlayCategoryProps) => {
  return (
    <div className={"flex flex-row h-[35px] flex-shrink-0 " + className}>
      <div
        className="w-[20px] h-[20px] rounded-full border-sky-600 border-[2px]"
        style={{ backgroundColor: `${category.color}` }}
      ></div>
      <div className="flex flex-col w-[95px] flex-shrink-0 ml-[7px]">
        <div className="font-lato font-bold uppercase text-ztg-14-110 truncate h-[17px] flex-shrink-0">
          {category.name}
        </div>
        {/* TODO: make a component for price diff */}
        <div className="h-full flex flex-row items-center">
          <div
            className="mr-[5px]"
            style={{
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: "10px solid #E90303",
            }}
          ></div>
          <div className="font-mono text-ztg-10-150">0.5%</div>
        </div>
      </div>
    </div>
  );
};

const MarketCardOverlayCategories = ({
  categories,
}: {
  categories: MarketCategories;
}) => {
  const numCategories = categories.length;
  return (
    <div className="flex flex-col max-h-[215px] overflow-y-scroll">
      {categories.map((cat, idx) => {
        const botMargin = idx === numCategories - 1 ? "mb-0" : "mb-[25px]";
        return (
          <MarketCardOverlayCategory
            key={`cat-${idx}`}
            category={cat}
            className={botMargin}
          />
        );
      })}
    </div>
  );
};

export default MarketCardOverlayCategories;
