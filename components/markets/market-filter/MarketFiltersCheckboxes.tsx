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
    <label className={"font-medium text-black " + className}>
      <Input
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
