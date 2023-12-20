import { Dialog } from "@headlessui/react";
import Modal from "components/ui/Modal";
import { useEffect, useRef } from "react";
import DisclaimerTerms from "./DisclaimerTerms";
import { useDisclaimer } from "lib/state/disclaimer";

export const DisclamerProvider = () => {
  const { modalOpen, hideDisclaimer, setDisclaimerAccepted } = useDisclaimer(
    () => {
      console.log("accepted here");
    },
  );

  const scrollableElementRef = useRef<HTMLDivElement | null>(null);

  // hack to scroll component to top when it renders (by default it scrolls to the bottom as it's overflowing)
  useEffect(() => {
    setTimeout(() => {
      if (scrollableElementRef.current) {
        scrollableElementRef.current.scrollTop = 0;
      }
    }, 10);
  }, [scrollableElementRef, modalOpen]);

  return (
    <Modal open={modalOpen} onClose={() => {}}>
      <Dialog.Panel className="flex w-full max-w-[526px] flex-col gap-5 rounded-ztg-10 bg-white p-[30px]">
        <h2 className="text-base">Terms of use</h2>
        <div
          ref={scrollableElementRef}
          className="max-h-[300px] overflow-auto pr-2 text-sm"
        >
          <DisclaimerTerms />
        </div>
        <div className="flex items-center justify-end gap-3">
          <button
            className="rounded-md px-4 py-2 text-gray-400"
            onClick={() => hideDisclaimer()}
          >
            Decline
          </button>
          <button
            className="rounded-md bg-ztg-blue px-4 py-2 text-white"
            onClick={() => {
              hideDisclaimer();
              setDisclaimerAccepted();
            }}
          >
            Accept
          </button>
        </div>
      </Dialog.Panel>
    </Modal>
  );
};
