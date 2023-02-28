import { Dialog } from "@headlessui/react";
import { useState } from "react";

const ManageLiquidityButton = ({ poolId }: { poolId: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  //todo
  return (
    <div>
      <button onClick={() => setIsOpen(true)}>Manage</button>
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-sm rounded bg-black">
            <Dialog.Title>Complete your order</Dialog.Title>

            {/* ... */}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default ManageLiquidityButton;
