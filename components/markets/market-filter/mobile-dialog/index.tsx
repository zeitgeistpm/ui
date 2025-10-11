import { Dialog, Transition } from "@headlessui/react";
import { useState, useEffect, useRef } from "react";
import { X } from "react-feather";
import { SelectedMenu } from "../MarketFiltersContainer";
import FiltersList from "./FiltersList";
import FilterDetails from "./FilterDetails";

const TRANSITION_DURATION = 300;

import { MarketType } from "lib/types/market-filter";

export type MobileDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  marketType?: MarketType;
  onMarketTypeChange?: (type: MarketType) => void;
};

const MobileDialog = ({ open, setOpen, marketType, onMarketTypeChange }: MobileDialogProps) => {
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
        <Dialog.Panel className="h-full w-full bg-gradient-to-b from-white via-sky-50/20 to-white">
          <div className="flex h-16 items-center border-b border-sky-200 bg-white px-6 py-3 shadow-sm">
            <div className="text-lg font-semibold text-gray-900">Filters</div>
            <div className="ml-auto">
              <button
                onClick={close}
                tabIndex={1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-sky-50 hover:text-sky-700"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div
            className="flex h-full flex-col px-6 py-4"
            style={{ height: "calc(100vh - 64px)" }}
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
