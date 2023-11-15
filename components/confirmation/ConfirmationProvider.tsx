import { Dialog } from "@headlessui/react";
import Modal from "components/ui/Modal";
import { useConfirmation } from "lib/state/confirm-modal/useConfirmation";

export const ConfirmationProvider = () => {
  const { confirmations, confirm, dismiss } = useConfirmation();
  return (
    <>
      {Object.entries(confirmations).map(([id, value]) => (
        <Modal key={id} open={value.open} onClose={() => dismiss(id)}>
          <Dialog.Panel className="w-full max-w-[526px] rounded-ztg-10 bg-white p-[30px]">
            <h2 className="mb-3 text-base">{value.title}</h2>
            <p className="mb-8 text-sm">{value.description}</p>
            <div className="flex items-center justify-end gap-3">
              <button
                className="rounded-md px-4 py-2 text-gray-400"
                onClick={() => dismiss(id)}
              >
                {value.cancelLabel ?? "Cancel"}
              </button>
              <button
                className="rounded-md bg-ztg-blue px-4 py-2 text-white"
                onClick={() => confirm(id)}
              >
                {value.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </Dialog.Panel>
        </Modal>
      ))}
    </>
  );
};
