import { Dialog, Transition } from "@headlessui/react";
import { ReactNode, Fragment, useEffect } from "react";

const Modal = ({
  open,
  children,
  onClose,
}: {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (typeof window !== undefined) {
      const htmlElement = document.documentElement;

      if (open) {
        htmlElement.classList.add("dialog-open");
      } else {
        htmlElement.classList.remove("dialog-open");
      }
    }
  }, [open]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog open={true} onClose={onClose} className="relative z-ztg-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-sky-950/40 backdrop-blur-sm"
            aria-hidden="true"
          />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div
            className={`fixed inset-0 z-50 flex w-screen items-center justify-center p-4`}
          >
            {children}
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
};

export default Modal;
