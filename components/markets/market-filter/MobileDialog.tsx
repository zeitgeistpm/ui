import { Dialog, Transition } from "@headlessui/react";
import { MarketFilter, MarketsOrderBy } from "lib/types/market-filter";
import { PropsWithChildren, useContext, useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, Icon, Plus, X } from "react-feather";
import { MarketFiltersContext } from "./MarketFiltersContainer";
import {
  marketCurrencyFilterOptions,
  marketStatusFilterOptions,
  marketTagFilterOptions,
  marketsOrderByOptions,
} from "lib/constants/market-filter";
import MarketActiveFilters from "./MarketActiveFilters";

type FilterButtonProps = PropsWithChildren<{
  RightBtn: Icon;
  onClick: () => void;
  className?: string;
}>;

const FilterButton = ({
  children,
  RightBtn,
  onClick,
  className = "",
}: FilterButtonProps) => {
  return (
    <div
      className={"flex items-center h-10 cursor-pointer " + className}
      onClick={onClick}
    >
      <div>{children}</div>
      <RightBtn className="ml-auto" size={24} />
    </div>
  );
};

const AllFilters = ({
  showSelection,
  activeFilters,
  onClear,
  onFilterRemove,
  ordering,
  close,
}) => {
  return (
    <>
      {activeFilters && (
        <MarketActiveFilters
          filters={activeFilters}
          onClear={onClear}
          onFilterRemove={onFilterRemove}
          className="flex flex-row mr-auto ml-auto gap-2"
        />
      )}
      <FilterButton
        RightBtn={Plus}
        onClick={() => {
          showSelection("Category");
        }}
      >
        Category
      </FilterButton>
      <FilterButton
        RightBtn={Plus}
        onClick={() => {
          showSelection("Currency");
        }}
      >
        Currency
      </FilterButton>
      <FilterButton
        RightBtn={Plus}
        onClick={() => {
          showSelection("Status");
        }}
      >
        Status
      </FilterButton>
      <FilterButton
        RightBtn={ChevronDown}
        onClick={() => {
          showSelection("Sort By");
        }}
      >
        Sort By: {ordering}
      </FilterButton>
      <button
        className="rounded-full bg-ztg-blue mt-auto h-14 text-white"
        onClick={close}
      >
        Show Markets
      </button>
    </>
  );
};

type SelectionType = "Category" | "Currency" | "Status" | "Sort By" | "None";

type FilterSelectionProps = {
  back: () => void;
  type: SelectionType;
  addFilter: (filter: MarketFilter) => void;
  withLiquidityOnly: boolean;
  onWithLiquidityOnlyChange: (liqudityOnly: boolean) => void;
  ordering: MarketsOrderBy;
  onOrderingChange: (v: MarketsOrderBy) => void;
};

const FilterSelection = ({
  back,
  type,
  addFilter,
  withLiquidityOnly,
  onWithLiquidityOnlyChange,
  ordering,
  onOrderingChange,
}: FilterSelectionProps) => {
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
                      addFilter(opt);
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
                      addFilter(opt);
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
                      addFilter(opt);
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
                        onOrderingChange(opt.value);
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

const TRANSITION_DURATION = 300;

export type MobileDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  addFilter: (filter: MarketFilter) => void;
  withLiquidityOnly: boolean;
  onWithLiquidityOnlyChange: (liqudityOnly: boolean) => void;
  ordering: MarketsOrderBy;
  onOrderingChange: (v: MarketsOrderBy) => void;
  onClear: () => void;
  onFilterRemove: (filter: MarketFilter) => void;
};

const MobileDialog = ({
  open,
  setOpen,
  addFilter,
  withLiquidityOnly,
  onWithLiquidityOnlyChange,
  ordering,
  onOrderingChange,
  onClear,
  onFilterRemove,
}: MobileDialogProps) => {
  const [showTransition, setShowTransition] = useState(open);
  const [currentSelection, setCurrentSelection] =
    useState<SelectionType>("None");
  const [step, setStep] = useState(0);
  const { activeFilters } = useContext(MarketFiltersContext);

  const close = () => {
    setTimeout(() => {
      setOpen(false);
      setStep(0);
    }, TRANSITION_DURATION);
    setShowTransition(false);
  };

  useEffect(() => {
    if (open == null) {
      return;
    }
    setShowTransition(open);
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={close}
      className="fixed top-0 left-0 w-full h-full bg-transparent z-50"
    >
      <Transition
        show={showTransition}
        enter={"transition ease-out " + `duration-${TRANSITION_DURATION}}`}
        enterFrom="transform -translate-y-full"
        enterTo="transform translate-y-0"
        leave={"transition ease-out " + `duration-${TRANSITION_DURATION}}`}
        leaveFrom="transform translate-y-0"
        leaveTo="transform -translate-y-full"
        className="absolute w-full h-full top-0 left-0 bg-white"
        appear={true}
      >
        <Dialog.Panel className="w-full h-full">
          <Dialog.Title className="py-3.5 px-8 h-[72px] border-b border-gray-200 text-xl flex items-center">
            <div className="text-xl">Filters</div>
            <div className="ml-auto">
              <X size={24} className="cursor-pointer" onClick={close} />
            </div>
          </Dialog.Title>
          <div
            className="px-10 flex flex-col h-full py-6"
            style={{ height: "calc(100vh - 72px)" }}
          >
            {
              {
                0: (
                  <AllFilters
                    showSelection={(selection) => {
                      setCurrentSelection(selection);
                      setStep(1);
                    }}
                    activeFilters={activeFilters}
                    onClear={onClear}
                    onFilterRemove={onFilterRemove}
                    ordering={ordering}
                    close={close}
                  />
                ),
                1: (
                  <FilterSelection
                    back={() => setStep(0)}
                    type={currentSelection}
                    addFilter={addFilter}
                    ordering={ordering}
                    onOrderingChange={onOrderingChange}
                    withLiquidityOnly={withLiquidityOnly}
                    onWithLiquidityOnlyChange={onWithLiquidityOnlyChange}
                  />
                ),
              }[step]
            }
          </div>
        </Dialog.Panel>
      </Transition>
    </Dialog>
  );
};

export default MobileDialog;
