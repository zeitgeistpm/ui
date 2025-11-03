import Modal from "components/ui/Modal";
import { ModalPanel } from "components/ui/ModalPanel";
import { useEffect, useRef } from "react";
import DisclaimerTerms from "./DisclaimerTerms";
import { useDisclaimer } from "lib/state/disclaimer";

export const DisclaimerModal = () => {
  const { modalOpen, hideDisclaimer, setDisclaimerAccepted } = useDisclaimer();

  const scrollableElementRef = useRef<HTMLDivElement | null>(null);

  // Scroll component to top when it renders
  useEffect(() => {
    if (modalOpen && scrollableElementRef.current) {
      setTimeout(() => {
        if (scrollableElementRef.current) {
          scrollableElementRef.current.scrollTop = 0;
        }
      }, 10);
    }
  }, [modalOpen]);

  return (
    <Modal open={modalOpen} onClose={() => {}} closeOnBackdropClick={false}>
      <ModalPanel maxWidth="xl" className="flex flex-col gap-5 p-[30px]">
        <h2 className="text-base text-white">Terms of use</h2>
        <div
          ref={scrollableElementRef}
          className="max-h-[300px] overflow-auto pr-2 text-sm text-white/90"
        >
          <DisclaimerTerms />
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            className="rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-sm transition-all hover:bg-white/20"
            onClick={() => hideDisclaimer()}
          >
            Decline
          </button>
          <button
            className="rounded-md bg-ztg-green-600/80 px-4 py-2 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-ztg-green-600 hover:shadow-md"
            onClick={() => {
              hideDisclaimer();
              setDisclaimerAccepted();
            }}
          >
            Accept
          </button>
        </div>
      </ModalPanel>
    </Modal>
  );
};
