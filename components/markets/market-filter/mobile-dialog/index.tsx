import { Dialog, Transition } from "@headlessui/react";
import { useState, useEffect, useRef } from "react";
import { X } from "react-feather";
import { SelectedMenu } from "../MarketFiltersContainer";
import FiltersList from "./FiltersList";
import FilterDetails from "./FilterDetails";

const TRANSITION_DURATION = 300;

export type MobileDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const MobileDialog = ({ open, setOpen }: MobileDialogProps) => {
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
        <Dialog.Panel className="h-full w-full">
          <div className="flex h-[72px] items-center border-b border-gray-200 px-8 py-3.5 text-xl">
            <div className="text-xl">Filters</div>
            <div className="ml-auto">
              <X
                size={24}
                className="cursor-pointer"
                onClick={close}
                tabIndex={1}
              />
            </div>
          </div>
          <div
            className="flex h-full flex-col px-10 py-6"
            style={{ height: "calc(100vh - 72px)" }}
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
