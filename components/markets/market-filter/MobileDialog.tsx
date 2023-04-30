import { Dialog, Transition } from "@headlessui/react";
import { allCurrencies } from "lib/constants";
import { defaultTags, marketStatuses } from "lib/constants/markets";
import { MarketsOrderBy } from "lib/types/market-filter";
import capitalize from "lodash-es/capitalize";
import { PropsWithChildren, useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, Icon, Plus, X } from "react-feather";

type FilterButtonProps = PropsWithChildren<{
  RightBtn: Icon;
  onClick: () => void;
}>;

const FilterButton = ({ children, RightBtn, onClick }: FilterButtonProps) => {
  return (
    <div className="flex items-center h-10 cursor-pointer" onClick={onClick}>
      <div>{children}</div>
      <RightBtn className="ml-auto" size={24} />
    </div>
  );
};

const AllFilters = ({ showSelection }) => {
  return (
    <>
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
        Sort By: {}
      </FilterButton>
    </>
  );
};

type SelectionType = "Category" | "Currency" | "Status" | "Sort By" | "None";

type FilterSelectionProps = {
  back: () => void;
  type: SelectionType;
};

const FilterSelection = ({ back, type }: FilterSelectionProps) => {
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
                {defaultTags.map((tag) => (
                  <a className="w-1/2 mb-7 cursor-pointer">{tag}</a>
                ))}
              </>
            ),
            Currency: (
              <>
                {allCurrencies.map((currency) => (
                  <a className="w-1/2 mb-7 cursor-pointer">
                    {capitalize(currency)}
                  </a>
                ))}
              </>
            ),
            Status: (
              <>
                {marketStatuses.map((status) => (
                  <a className="w-1/2 mb-7 cursor-pointer">{status}</a>
                ))}
              </>
            ),
            "Sort By": (
              <>
                {Object.values(MarketsOrderBy).map((value) => {
                  return <a className="w-1/2 mb-7 cursor-pointer">{value}</a>;
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
};

const MobileDialog = ({ open, setOpen }: MobileDialogProps) => {
  const [showTransition, setShowTransition] = useState(open);
  const [currentSelection, setCurrentSelection] =
    useState<SelectionType>("None");
  const [step, setStep] = useState(0);

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
          <Dialog.Title className="py-3.5 px-8 h-[72px] border-b border-gray-200 text-xl flex items-center mb-6">
            <div className="text-xl">Filters</div>
            <div className="ml-auto">
              <X size={24} className="cursor-pointer" onClick={close} />
            </div>
          </Dialog.Title>
          <div className="px-10 flex flex-col">
            {
              {
                0: (
                  <AllFilters
                    showSelection={(selection) => {
                      setCurrentSelection(selection);
                      setStep(1);
                    }}
                  />
                ),
                1: (
                  <FilterSelection
                    back={() => setStep(0)}
                    type={currentSelection}
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
