import Modal from "components/ui/Modal";
import { ModalPanel, ModalBody } from "components/ui/ModalPanel";
import { useConfirmation } from "lib/state/confirm-modal/useConfirmation";

export const ConfirmationProvider = () => {
  const { confirmations, confirm, dismiss } = useConfirmation();
  return (
    <>
      {Object.entries(confirmations).map(([id, value]) => (
        <Modal key={id} open={value.open} onClose={() => dismiss(id)}>
          <ModalPanel size="sm">
            <ModalBody>
              <h2 className="mb-3 text-lg md:text-xl font-semibold text-white">
                {value.title}
              </h2>
              <p className="mb-6 text-sm md:text-base text-white/80">{value.description}</p>
              <div className="flex items-center justify-end gap-3">
                <button
                  className="rounded-md bg-white/10 px-4 py-2 text-sm md:text-base font-medium text-white/90 backdrop-blur-sm transition-all hover:bg-white/20"
                  onClick={() => dismiss(id)}
                >
                  {value.cancelLabel ?? "Cancel"}
                </button>
                <button
                  className="rounded-md bg-ztg-green-600/80 px-4 py-2 text-sm md:text-base text-white shadow-sm backdrop-blur-sm transition-all hover:bg-ztg-green-600 hover:shadow-md"
                  onClick={() => confirm(id)}
                >
                  {value.confirmLabel ?? "Confirm"}
                </button>
              </div>
            </ModalBody>
          </ModalPanel>
        </Modal>
      ))}
    </>
  );
};
