import {
  marketTagFilterOptions,
  marketCurrencyFilterOptions,
  marketStatusFilterOptions,
  marketsOrderByOptions,
} from "lib/constants/market-filter";
import { ChevronLeft } from "react-feather";
import { useMarketFiltersContext } from "../MarketFiltersContainer";
import { SelectionType } from "./types";

type FilterDetailsProps = {
  back: () => void;
  type: SelectionType;
};

const FilterDetails = ({ back, type }: FilterDetailsProps) => {
  const { addActiveFilter, setOrdering } = useMarketFiltersContext();

  return (
    <>
      <a
        className="cursor-pointer flex mr-auto text-sky-600 mt-1"
        onClick={back}
      >
        <ChevronLeft size={24} className="inline-block" />{" "}
        <div className="inline-block">Back</div>
      </a>
      <h3 className="text-2xl my-7">{type}</h3>
      <div className="flex flex-wrap">
        {
          {
            Category: (
              <>
                {marketTagFilterOptions.map((opt, index) => (
                  <a
                    className="w-1/2 mb-7 cursor-pointer"
                    onClick={() => {
                      addActiveFilter(opt);
                      back();
                    }}
                    key={index}
                  >
                    {opt.value}
                  </a>
                ))}
              </>
            ),
            Currency: (
              <>
                {marketCurrencyFilterOptions.map((opt, index) => (
                  <a
                    className="w-1/2 mb-7 cursor-pointer"
                    onClick={() => {
                      addActiveFilter(opt);
                      back();
                    }}
                    key={index}
                  >
                    {opt.value}
                  </a>
                ))}
              </>
            ),
            Status: (
              <>
                {marketStatusFilterOptions.map((opt, index) => (
                  <a
                    className="w-1/2 mb-7 cursor-pointer"
                    onClick={() => {
                      addActiveFilter(opt);
                      back();
                    }}
                    key={index}
                  >
                    {opt.value}
                  </a>
                ))}
              </>
            ),
            "Sort By": (
              <>
                {marketsOrderByOptions.map((opt, index) => {
                  return (
                    <a
                      className="w-1/2 mb-7 cursor-pointer"
                      onClick={() => {
                        setOrdering(opt.value);
                        back();
                      }}
                      key={index}
                    >
                      {opt.value}
                    </a>
                  );
                })}
              </>
            ),
          }[type]
        }
      </div>
    </>
  );
};

export default FilterDetails;
