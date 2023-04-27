import { Dialog } from "@headlessui/react";
import { useState } from "react";

export type MobileDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const MobileDialog = () => {
  const [open, setOpen] = useState(true);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      className="relative z-40"
    >
      <div className="fixed w-full h-full bg-white top-0">
        <Dialog.Panel>
          <Dialog.Title>Filters</Dialog.Title>
          <p>I am mobile content</p>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default MobileDialog;
