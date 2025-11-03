import { PropsWithChildren, useState } from "react";
import {
  Icon,
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Grid,
  Layers,
  BarChart2,
  Clock,
  TrendingUp,
  TrendingDown,
} from "react-feather";
import MarketActiveFilters from "../MarketActiveFilters";
import MarketFiltersCheckboxes from "../MarketFiltersCheckboxes";
import { SelectedMenu } from "../MarketFiltersContainer";
import {
  MarketType,
  MarketsOrderBy,
  MarketOrderByOption,
} from "lib/types/market-filter";
import { marketsOrderByOptions } from "lib/constants/market-filter";

const MobileSortSelect = ({
  value,
  onChange,
}: {
  value: MarketsOrderBy;
  onChange: (ordering: MarketsOrderBy) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = marketsOrderByOptions.find(
    (opt) => opt.value === value,
  );

  const isTimeBased =
    value === MarketsOrderBy.Newest || value === MarketsOrderBy.Oldest;
  const isVolumeBased =
    value === MarketsOrderBy.MostVolume || value === MarketsOrderBy.LeastVolume;

  let Icon:
    | typeof Clock
    | typeof BarChart2
    | typeof TrendingUp
    | typeof TrendingDown = BarChart2;
  if (isTimeBased) {
    Icon = Clock;
  } else if (value === MarketsOrderBy.MostVolume) {
    Icon = TrendingUp;
  } else if (value === MarketsOrderBy.LeastVolume) {
    Icon = TrendingDown;
  }

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-[48px] w-full touch-manipulation items-center justify-between rounded-lg bg-white/15 px-4 py-3 text-base font-semibold text-white shadow-md backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className="text-white/70" />
          <span>
            {isVolumeBased ? "Volume" : selectedOption?.label || "Sort"}
          </span>
        </div>
        <ChevronDown
          size={20}
          className={`text-white/70 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 right-0 top-full z-[101] mt-2 rounded-lg border-2 border-white/10 bg-ztg-primary-700/95 p-2 shadow-2xl backdrop-blur-lg">
            <div className="flex flex-wrap gap-2">
              {marketsOrderByOptions.map((option) => {
                const isTimeBasedOption =
                  option.value === MarketsOrderBy.Newest ||
                  option.value === MarketsOrderBy.Oldest;
                const isVolumeBasedOption =
                  option.value === MarketsOrderBy.MostVolume ||
                  option.value === MarketsOrderBy.LeastVolume;

                let OptionIcon:
                  | typeof Clock
                  | typeof BarChart2
                  | typeof TrendingUp
                  | typeof TrendingDown = BarChart2;
                if (isTimeBasedOption) {
                  OptionIcon = Clock;
                } else if (option.value === MarketsOrderBy.MostVolume) {
                  OptionIcon = TrendingUp;
                } else if (option.value === MarketsOrderBy.LeastVolume) {
                  OptionIcon = TrendingDown;
                }

                const isSelected = value === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex min-h-[44px] touch-manipulation items-center gap-3 rounded-lg px-4 py-3 text-base font-semibold shadow-md backdrop-blur-sm transition-all active:scale-[0.98] ${
                      isSelected
                        ? "bg-ztg-green-600/80 text-white ring-2 ring-ztg-green-500/50"
                        : "bg-white/15 text-white/90 hover:bg-white/20 hover:text-white hover:shadow-lg"
                    }`}
                  >
                    <OptionIcon
                      size={18}
                      className={isSelected ? "text-white" : "text-white/70"}
                    />
                    <span>{isVolumeBasedOption ? "Volume" : option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

type FilterButtonProps = PropsWithChildren<{
  RightIcon?: Icon;
  onClick?: () => void;
  className?: string;
}>;

const FilterButton = ({
  children,
  RightIcon,
  onClick = () => {},
  className = "",
}: FilterButtonProps) => {
  return (
    <button
      className={
        "mb-2.5 flex min-h-[48px] w-full touch-manipulation items-center rounded-lg bg-white/15 px-4 py-3 text-left shadow-md backdrop-blur-sm transition-all hover:bg-white/20 hover:shadow-lg active:scale-[0.98] " +
        className
      }
      onClick={onClick}
    >
      <div className="text-base font-semibold text-white">{children}</div>
      {RightIcon && (
        <RightIcon className="ml-auto text-ztg-green-400" size={20} />
      )}
    </button>
  );
};

export type FiltersListProps = {
  showMenu: (menu: SelectedMenu) => void;
  close: () => void;
  marketType?: MarketType;
  onMarketTypeChange?: (type: MarketType) => void;
};

const MobileMarketTypeToggle = ({
  value,
  onChange,
}: {
  value: MarketType;
  onChange: (type: MarketType) => void;
}) => {
  const options: { value: MarketType; label: string; icon: typeof Grid }[] = [
    { value: "regular", label: "Single", icon: Grid },
    { value: "multi", label: "Multi", icon: Layers },
  ];

  return (
    <div className="flex gap-2">
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex min-h-[48px] flex-1 touch-manipulation items-center justify-center gap-3 rounded-lg px-4 py-3 text-base font-semibold shadow-md backdrop-blur-sm transition-all active:scale-[0.98] ${
              isSelected
                ? "bg-ztg-green-600/80 text-white ring-2 ring-ztg-green-500/50"
                : "bg-white/15 text-white/90 hover:bg-white/20 hover:text-white hover:shadow-lg"
            }`}
          >
            <Icon
              size={20}
              className={isSelected ? "text-white" : "text-white/70"}
            />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

const FiltersList = ({
  showMenu,
  close,
  marketType = "regular",
  onMarketTypeChange,
  ordering,
  onOrderingChange,
}: FiltersListProps) => {
  return (
    <>
      {/* Market Type Section */}
      <div className="mb-5">
        <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
          <span className="h-1 w-6 rounded-full bg-ztg-green-500"></span>
          Market Type
        </div>
        <div className="rounded-lg bg-white/15 p-3 shadow-md backdrop-blur-sm">
          <MobileMarketTypeToggle
            value={marketType}
            onChange={onMarketTypeChange || (() => {})}
          />
        </div>
      </div>

      {/* Active Filters */}
      <MarketActiveFilters className="mb-5 flex w-full flex-row flex-wrap justify-start gap-1.5" />

      {/* Filter Options */}
      <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
        <span className="h-1 w-6 rounded-full bg-ztg-green-500"></span>
        Filter By
      </div>
      <FilterButton
        RightIcon={ChevronRight}
        onClick={() => {
          showMenu("Category");
        }}
      >
        Category
      </FilterButton>
      <FilterButton
        RightIcon={ChevronRight}
        onClick={() => {
          showMenu("Currency");
        }}
      >
        Currency
      </FilterButton>
      <FilterButton
        RightIcon={ChevronRight}
        onClick={() => {
          showMenu("Status");
        }}
      >
        Status
      </FilterButton>

      {/* Sort By Section */}
      <div className="mb-2.5 mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
        <span className="h-1 w-6 rounded-full bg-ztg-green-500"></span>
        Sort By
      </div>
      <div className="mb-6">
        <MobileSortSelect
          value={ordering || MarketsOrderBy.Newest}
          onChange={onOrderingChange || (() => {})}
        />
      </div>

      {/* Liquidity Checkbox */}
      <div className="mb-6 rounded-lg bg-white/15 px-4 py-3 shadow-md backdrop-blur-sm">
        <MarketFiltersCheckboxes />
      </div>

      {/* Show Markets Button */}
      <button
        className="sticky bottom-0 mt-auto min-h-[48px] touch-manipulation rounded-lg bg-ztg-green-600/80 px-4 py-3 text-base font-semibold text-white shadow-md backdrop-blur-sm transition-all hover:bg-ztg-green-600 active:scale-[0.98]"
        onClick={close}
      >
        Show Markets
      </button>
    </>
  );
};

export default FiltersList;
