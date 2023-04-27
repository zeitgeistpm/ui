import React from "react";

type MarketFiltersCheckboxesProps = {
  withLiquidityOnly: boolean;
  onWithLiquidityOnlyChange: (liqudityOnly: boolean) => void;
  className?: string;
};

const MarketFiltersCheckboxes: React.FC<MarketFiltersCheckboxesProps> = ({
  withLiquidityOnly,
  onWithLiquidityOnlyChange,
  className = "",
}) => {
  return withLiquidityOnly != null ? (
    <label className={"text-black font-medium " + className}>
      <input
        className="mr-[10px]"
        type="checkbox"
        checked={withLiquidityOnly}
        onChange={(e) => onWithLiquidityOnlyChange(e.target.checked)}
      />
      Liquidity only
    </label>
  ) : (
    <></>
  );
};

export default MarketFiltersCheckboxes;
