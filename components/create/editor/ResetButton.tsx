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
        className={`flex center text-sm text-gray-400 font-medium `}
        enter="transition-opacity duration-100"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <button
          type="button"
          className="text-xs center gap-1 rounded-md border-1 py-1 px-2 md:absolute md:right-0 md:translate-x-[125%] md:translate-y-[-50%] md:top-[50%]"
          onClick={() => setShowResetConfirmation(true)}
        >
          clear form
          <BsEraser />
        </button>
      </Transition>

      <Modal
        open={showResetConfirmation}
        onClose={() => setShowResetConfirmation(false)}
      >
        <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-8 cursor-pointer">
          <div className="text-center mb-6">
            Are you sure you want to clear the form?
          </div>
          <div className="flex justify-center gap-4">
            <button
              type="button"
              className="border-gray-300 text-sm  rounded-full py-3 px-6 transition-all ease-in-out duration-200 active:scale-95"
              onClick={() => {
                setShowResetConfirmation(false);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="border-gray-300 text-sm border-2 rounded-full py-3 px-6 transition-all ease-in-out duration-200 active:scale-95"
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
