import { Dialog } from "@headlessui/react";
import { useState } from "react";

const ManageLiquidityButton = ({ poolId }: { poolId: number }) => {
  const [isOpen, setIsOpen] = useState(false);

  //todo
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Manage</button>
      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <Dialog.Panel>
          <Dialog.Title>Deactivate account</Dialog.Title>
          <Dialog.Description>
            This will permanently deactivate your account
          </Dialog.Description>

          <p>
            Are you sure you want to deactivate your account? All of your data
            will be permanently removed. This action cannot be undone.
          </p>

          <button onClick={() => setIsOpen(false)}>Deactivate</button>
          <button onClick={() => setIsOpen(false)}>Cancel</button>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default ManageLiquidityButton;
