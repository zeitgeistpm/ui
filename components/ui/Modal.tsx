import { Dialog } from "@headlessui/react";
import { ReactNode } from "react";

const Modal = ({
  open,
  children,
  onClose,
}: {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
}) => {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-ztg-40">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        {children}
      </div>
    </Dialog>
  );
};

export default Modal;
