import { Dialog, Transition } from "@headlessui/react";
import { useState, useEffect, useRef } from "react";
import { X } from "react-feather";
import { SelectedMenu } from "../MarketFiltersContainer";
import FiltersList from "./FiltersList";
import FilterDetails from "./FilterDetails";

const TRANSITION_DURATION = 300;

import { MarketType, MarketsOrderBy } from "lib/types/market-filter";

export type MobileDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  marketType?: MarketType;
  onMarketTypeChange?: (type: MarketType) => void;
  ordering?: MarketsOrderBy;
  onOrderingChange?: (ordering: MarketsOrderBy) => void;
};

const MobileDialog = ({
  open,
  setOpen,
  marketType,
  onMarketTypeChange,
  ordering,
  onOrderingChange,
}: MobileDialogProps) => {
  const [showTransition, setShowTransition] = useState(open);
  const [currentSelection, setCurrentSelection] =
    useState<SelectedMenu>("None");
  const [step, setStep] = useState(0);
  const focusRef = useRef<HTMLDivElement>(null);

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
      className="fixed left-0 top-0 z-50 h-full w-full bg-transparent"
      initialFocus={focusRef}
      ref={focusRef}
      tabIndex={1}
    >
      <Transition
        show={showTransition}
        enter={"transition ease-out " + `duration-${TRANSITION_DURATION}}`}
        enterFrom="transform -translate-y-full"
        enterTo="transform translate-y-0"
        leave={"transition ease-out " + `duration-${TRANSITION_DURATION}}`}
        leaveFrom="transform translate-y-0"
        leaveTo="transform -translate-y-full"
        className="absolute left-0 top-0 h-full w-full bg-white"
        appear={true}
      >
        <Dialog.Panel className="h-full w-full bg-ztg-primary-500">
          <div className="flex h-14 items-center justify-between border-b-2 border-white/10 bg-white/15 px-4 py-3 shadow-md backdrop-blur-md">
            <div className="text-base font-semibold text-white">Filters</div>
            <button
              onClick={close}
              tabIndex={1}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-all active:scale-95 hover:bg-white/20 hover:text-white touch-manipulation"
            >
              <X size={20} />
            </button>
          </div>
          <div
            className="flex h-full flex-col overflow-y-auto px-4 py-5"
            style={{ height: "calc(100vh - 56px)" }}
          >
            {
              {
                0: (
                  <FiltersList
                    showMenu={(selection) => {
                      setCurrentSelection(selection);
                      setStep(1);
                    }}
                    close={close}
                    marketType={marketType}
                    onMarketTypeChange={onMarketTypeChange}
                    ordering={ordering}
                    onOrderingChange={onOrderingChange}
                  />
                ),
                1: (
                  <FilterDetails
                    back={() => {
                      setStep(0);
                      setCurrentSelection("None");
                    }}
                    menu={currentSelection}
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
