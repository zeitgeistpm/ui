import { observer } from "mobx-react";
import React, { FC, ReactFragment } from "react";
import { X } from "react-feather";
import { useModalStore } from "lib/stores/ModalStore";

export type ModalProps = {
  heading: ReactFragment;
  centerHeadingText?: boolean;
  showCloseButton?: boolean;
};

const Modal: FC<ModalProps> = observer(
  ({
    children,
    heading,
    centerHeadingText = false,
    showCloseButton = true,
  }) => {
    const modalStore = useModalStore();
    return (
      <div>
        <div className="flex justify-between items-center mb-ztg-16">
          <div
            className={
              "font-bold text-ztg-16-150  dark:text-white text-black w-full" +
              (centerHeadingText ? " text-center" : "")
            }
          >
            {heading}
          </div>
          {showCloseButton === true ? (
            <div>
              <X
                size={24}
                role="button"
                className="cursor-pointer dark:text-sky-200 text-sky-600"
                data-test="closeInspect"
                onClick={() => modalStore.closeModal()}
              />
            </div>
          ) : undefined}
        </div>
        {children}
      </div>
    );
  },
);

export default Modal;
