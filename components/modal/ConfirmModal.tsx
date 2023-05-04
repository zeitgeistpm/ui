import { useModalStore } from "lib/stores/ModalStore";
import { observer } from "mobx-react";
import React, { FC, PropsWithChildren } from "react";
import Modal, { ModalProps } from "./Modal";

export type ConfirmModalProps = ModalProps & {
  onYes?: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
};

const ConfirmModal: FC<PropsWithChildren<ConfirmModalProps>> = ({
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  children,
  onYes = () => {},
  heading,
}) => {
  const modalStore = useModalStore();
  const confirm = () => {
    onYes();
    modalStore.closeModal();
  };
  return (
    <Modal heading={heading} showCloseButton={false} centerHeadingText={true}>
      {children}
      <div className="flex">
        <button
          className="rounded-ztg-10 h-ztg-50 center bg-ztg-blue text-white w-full h-ztg-40 mr-ztg-15  font-medium text-ztg-16-150 focus:outline-none"
          onClick={() => confirm()}
        >
          {confirmButtonText}
        </button>
        <button
          className="rounded-ztg-10 h-ztg-50 center bg-border-light dark:bg-sky-700 text-white w-full h-ztg-40  font-medium text-ztg-16-150 focus:outline-none"
          onClick={() => modalStore.closeModal()}
        >
          {cancelButtonText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
