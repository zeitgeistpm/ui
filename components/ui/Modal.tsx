import { Dialog, Transition } from "@headlessui/react";
import { ReactNode, Fragment } from "react";
import { useScrollLock } from "lib/hooks/useScrollLock";

export interface ModalProps {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  /**
   * Whether to prevent closing on backdrop click
   * @default false
   */
  closeOnBackdropClick?: boolean;
}

const Modal = ({
  open,
  children,
  onClose,
  closeOnBackdropClick = true,
}: ModalProps) => {
  // Lock body scroll when modal is open
  useScrollLock(open);

  const handleClose = (value: boolean) => {
    if (!value && closeOnBackdropClick) {
      onClose();
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        open={open}
        onClose={handleClose}
        className="relative z-ztg-50"
        static={!closeOnBackdropClick}
      >
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
            className="fixed inset-0 bg-ztg-primary-950/50 backdrop-blur-md"
            aria-hidden="true"
            style={{ zIndex: 40 }}
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
            className="fixed inset-0 z-50 flex w-screen items-center justify-center p-4"
            style={{ pointerEvents: "none" }}
          >
            <div style={{ pointerEvents: "auto" }}>{children}</div>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
};

export default Modal;
