import { Dialog, Transition } from "@headlessui/react";
import { useState, useEffect, useRef } from "react";
import { X } from "react-feather";
import { SelectedMenu } from "../MarketFiltersContainer";
import FiltersList from "./FiltersList";
import FilterDetails from "./FilterDetails";
import { useDisableScroll } from "lib/hooks/useDisableScroll";

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

  useDisableScroll(open);

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
        className="absolute w-full h-full top-0 left-0 bg-white"
        appear={true}
      >
        <Dialog.Panel className="w-full h-full">
          <div className="py-3.5 px-8 h-[72px] border-b border-gray-200 text-xl flex items-center">
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
            className="px-10 flex flex-col h-full py-6"
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
