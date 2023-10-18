import { Dialog } from "@headlessui/react";
import Modal from "components/ui/Modal";
import { useConfirmation } from "lib/state/confirm-modal/useConfirmation";

export const ConfirmationProvider = () => {
  const { confirmations, confirm, dismiss } = useConfirmation();
  return (
    <>
      {Object.entries(confirmations).map(([id, value]) => (
        <Modal key={id} open={value.open} onClose={() => dismiss(id)}>
          <Dialog.Panel className="bg-white w-full max-w-[526px] p-[30px] rounded-ztg-10">
            <h2 className="text-base mb-3">{value.title}</h2>
            <p className="text-sm mb-4">{value.description}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                className="text-gray-400 rounded-md py-2 px-4"
                onClick={() => dismiss(id)}
              >
                Cancel
              </button>
              <button
                className="bg-ztg-blue text-white rounded-md py-2 px-4"
                onClick={() => confirm(id)}
              >
                Confirm
              </button>
            </div>
          </Dialog.Panel>
        </Modal>
      ))}
    </>
  );
};
