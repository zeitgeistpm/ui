import {
  marketTagFilterOptions,
  marketCurrencyFilterOptions,
  marketStatusFilterOptions,
} from "lib/constants/market-filter";
import DropDownSelect from "./DropDownSelect";
import { useMarketFiltersContext } from "./MarketFiltersContainer";
import { isWSX } from "lib/constants";

export type MarketFiltersDropdownsProps = {
  className?: string;
};

const Divider = () => {
  return (
    <div className="hidden h-[10px] w-[1px] bg-pastel-blue lg:block"></div>
  );
};

const MarketFiltersDropdowns = ({
  className = "",
}: MarketFiltersDropdownsProps) => {
  const { selectedMenu, portal, addActiveFilter } = useMarketFiltersContext();
  return (
    <div className={className}>
      {!isWSX && (
        <>
          <DropDownSelect
            label="Category"
            options={marketTagFilterOptions}
            add={addActiveFilter}
            portal={portal}
            isOpen={selectedMenu === "Category"}
          />
          <Divider />
          <DropDownSelect
            label="Currency"
            options={marketCurrencyFilterOptions}
            add={addActiveFilter}
            portal={portal}
            isOpen={selectedMenu === "Currency"}
          />
        </>
      )}
      <Divider />
      <DropDownSelect
        label="Status"
        options={marketStatusFilterOptions}
        add={addActiveFilter}
        portal={portal}
        isOpen={selectedMenu === "Status"}
      />
      <Divider />
    </div>
  );
};

export default MarketFiltersDropdowns;
