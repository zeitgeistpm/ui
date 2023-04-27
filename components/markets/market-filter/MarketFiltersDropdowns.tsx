import { useContext } from "react";
import { MarketsOrderBy } from "@zeitgeistpm/sdk/dist/types";
import {
  marketTagFilterOptions,
  marketCurrencyFilterOptions,
  marketStatusFilterOptions,
} from "lib/constants/market-filter";
import { MarketFilter } from "lib/types/market-filter";
import DropDownSelect from "./DropDownSelect";
import { MarketFiltersContext } from "./MarketFiltersContainer";

export type MarketFiltersDropdownsProps = {
  addFilter: (filter: MarketFilter) => void;
  className?: string;
};

const Divider = () => {
  return (
    <div className="hidden lg:block w-[1px] h-[10px] bg-pastel-blue"></div>
  );
};

const MarketFiltersDropdowns = ({
  addFilter,
  className = "",
}: MarketFiltersDropdownsProps) => {
  const { selectedMenu, portal } = useContext(MarketFiltersContext);
  return (
    <div className={className}>
      <DropDownSelect
        label="Category"
        options={marketTagFilterOptions}
        add={addFilter}
        portal={portal}
        isOpen={selectedMenu === "Category"}
      />
      <Divider />
      <DropDownSelect
        label="Currency"
        options={marketCurrencyFilterOptions}
        add={addFilter}
        portal={portal}
        isOpen={selectedMenu === "Currency"}
      />
      <Divider />
      <DropDownSelect
        label="Status"
        options={marketStatusFilterOptions}
        add={addFilter}
        portal={portal}
        isOpen={selectedMenu === "Status"}
      />
      <Divider />
    </div>
  );
};

export default MarketFiltersDropdowns;
