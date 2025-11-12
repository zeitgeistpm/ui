import React from "react";
import { useMarketFiltersContext } from "./MarketFiltersContainer";
import Input from "components/ui/Input";

type MarketFiltersCheckboxesProps = {
  className?: string;
};

const MarketFiltersCheckboxes: React.FC<MarketFiltersCheckboxesProps> = ({
  className = "",
}) => {
  const { withLiquidityOnly, setWithLiquidityOnly } = useMarketFiltersContext();
  return withLiquidityOnly != null ? (
    <label
      className={
        "flex cursor-pointer items-center text-sm font-semibold text-white/90 transition-colors hover:text-white/90 " +
        className
      }
    >
      <Input
        className="mr-1.5 h-3.5 w-3.5 cursor-pointer accent-ztg-green-500"
        type="checkbox"
        checked={withLiquidityOnly}
        onChange={(e) => setWithLiquidityOnly(e.target.checked)}
      />
      Liquidity Only
    </label>
  ) : (
    <></>
  );
};

export default MarketFiltersCheckboxes;
