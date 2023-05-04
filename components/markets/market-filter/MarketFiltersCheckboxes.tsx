import React from "react";
import { useMarketFiltersContext } from "./MarketFiltersContainer";

type MarketFiltersCheckboxesProps = {
  className?: string;
};

const MarketFiltersCheckboxes: React.FC<MarketFiltersCheckboxesProps> = ({
  className = "",
}) => {
  const { withLiquidityOnly, setWithLiquidityOnly } = useMarketFiltersContext();
  return withLiquidityOnly != null ? (
    <label className={"text-black font-medium " + className}>
      <input
        className="mr-[10px]"
        type="checkbox"
        checked={withLiquidityOnly}
        onChange={(e) => setWithLiquidityOnly(e.target.checked)}
      />
      Liquidity only
    </label>
  ) : (
    <></>
  );
};

export default MarketFiltersCheckboxes;
