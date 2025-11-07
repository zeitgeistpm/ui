import Modal from "components/ui/Modal";
import { ModalPanel, ModalHeader, ModalBody } from "components/ui/ModalPanel";
import { useEffect, useRef } from "react";
import DisclaimerTerms from "./DisclaimerTerms";
import { useDisclaimer } from "lib/state/disclaimer";

export const DisclaimerModal = () => {
  const { modalOpen, hideDisclaimer, setDisclaimerAccepted } = useDisclaimer();

  const scrollableElementRef = useRef<HTMLDivElement | null>(null);

  // Scroll component to top when it renders
  useEffect(() => {
    if (modalOpen && scrollableElementRef.current) {
      const timeoutId = setTimeout(() => {
        if (scrollableElementRef.current) {
          scrollableElementRef.current.scrollTop = 0;
        }
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [modalOpen]);

  return (
    <Modal open={modalOpen} onClose={() => {}} closeOnBackdropClick={false}>
      <ModalPanel size="lg" className="flex flex-col">
        <ModalHeader title="Terms of Use" />
        <ModalBody>
          <div
            ref={scrollableElementRef}
            className="max-h-[400px] overflow-y-auto modal-scrollable text-sm md:text-base text-white/80 mb-6"
          >
            <DisclaimerTerms />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              className="rounded-md bg-white/10 px-4 py-2 text-sm md:text-base font-medium text-white/90 backdrop-blur-sm transition-all hover:bg-white/20"
              onClick={() => hideDisclaimer()}
            >
              Decline
            </button>
            <button
              className="rounded-md bg-ztg-green-600/80 px-4 py-2 text-sm md:text-base text-white shadow-sm backdrop-blur-sm transition-all hover:bg-ztg-green-600 hover:shadow-md"
              onClick={() => {
                hideDisclaimer();
                setDisclaimerAccepted();
              }}
            >
              Accept
            </button>
          </div>
        </ModalBody>
      </ModalPanel>
    </Modal>
  );
};
