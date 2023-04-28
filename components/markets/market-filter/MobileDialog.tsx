import { Dialog, Transition } from "@headlessui/react";
import { useEffect, useState } from "react";

export type MobileDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const AllFilters = ({ setNext }) => {
  return (
    <>
      <p>Main Fitlers screen</p>
      <a className="block cursor-pointer" onClick={() => setNext()}>
        Next
      </a>
    </>
  );
};

const FilterSelection = ({ setPrev }) => {
  return (
    <>
      <p>Filter Selection</p>
      <a className="block cursor-pointer" onClick={() => setPrev()}>
        Prev
      </a>
    </>
  );
};

const MobileDialog = ({ open, setOpen }: MobileDialogProps) => {
  const [showTransition, setShowTransition] = useState(open);
  const [step, setStep] = useState(0);

  const setNext = () => {
    setStep((step) => step + 1);
  };

  const setPrev = () => {
    setStep((step) => step - 1);
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
      onClose={() => {
        setTimeout(() => {
          setOpen(false);
        }, 100);
        setShowTransition(false);
      }}
      className="fixed top-0 left-0 w-full h-full bg-transparent z-50"
    >
      <Transition
        show={showTransition}
        enter="transition duration-100 ease-out"
        enterFrom="transform -translate-y-full"
        enterTo="transform translate-y-0"
        leave="transition duration-100 ease-out"
        leaveFrom="transform translate-y-0"
        leaveTo="transform -translate-y-full"
        className="absolute w-full h-full top-0 left-0 bg-white"
        appear={true}
      >
        <Dialog.Panel>
          <Dialog.Title>Filters</Dialog.Title>
          {
            {
              0: <AllFilters setNext={setNext} />,
              1: <FilterSelection setPrev={setPrev} />,
            }[step]
          }
        </Dialog.Panel>
      </Transition>
    </Dialog>
  );
};

export default MobileDialog;
