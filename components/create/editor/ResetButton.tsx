import { Dialog, Transition } from "@headlessui/react";
import Modal from "components/ui/Modal";
import { MarketDraftEditor } from "lib/state/market-creation/editor";
import { useState } from "react";
import { BsEraser } from "react-icons/bs";

export type EditorResetButtonProps = {
  editor: MarketDraftEditor;
};

export const EditorResetButton = ({ editor }: EditorResetButtonProps) => {
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  return (
    <>
      <Transition
        show={Boolean(editor.isTouched)}
        className={`center flex text-sm font-medium text-gray-400 `}
        enter="transition-opacity duration-100"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <button
          type="button"
          className="center gap-1 rounded-md border-1 px-2 py-1 text-xs md:absolute md:right-0 md:top-[50%] md:translate-x-[125%] md:translate-y-[-50%]"
          onClick={() => setShowResetConfirmation(true)}
        >
          Clear form
          <BsEraser />
        </button>
      </Transition>

      <Modal
        open={showResetConfirmation}
        onClose={() => setShowResetConfirmation(false)}
      >
        <Dialog.Panel className="w-full max-w-[462px] cursor-pointer rounded-[10px] bg-white p-8">
          <div className="mb-6 text-center">
            Are you sure you want to clear the form?
          </div>
          <div className="flex justify-center gap-4">
            <button
              type="button"
              className="rounded-full border-gray-300  px-6 py-3 text-sm transition-all duration-200 ease-in-out active:scale-95"
              onClick={() => {
                setShowResetConfirmation(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-full border-2 border-gray-300 px-6 py-3 text-sm transition-all duration-200 ease-in-out active:scale-95"
              onClick={() => {
                editor.reset();
                setShowResetConfirmation(false);
              }}
            >
              Clear
            </button>
          </div>
        </Dialog.Panel>
      </Modal>
    </>
  );
};
