import { makeAutoObservable } from "mobx";
import React, { ReactElement, ReactFragment, useContext } from "react";

import { ModalStoreContext } from "components/context/ModalStoreContext";
import ConfirmModal from "components/modal/ConfirmModal";
import Modal from "components/modal/Modal";

export type ModalOptions = {
  styles?: React.CSSProperties;
};

class ModalStore {
  modal: JSX.Element;
  onEnterKeyPress: () => void | null = null;
  options: ModalOptions = {};

  constructor() {
    makeAutoObservable(this, {}, { deep: false });
  }

  closeModal() {
    this.modal = null;
    this.onEnterKeyPress = null;
    this.options = {};
  }

  openConfirmModal(
    el: JSX.Element,
    heading: ReactElement,
    action?: () => void,
    options?: ModalOptions,
  ) {
    if (options) {
      this.setOptions(options);
    }
    this.modal = (
      <ConfirmModal onYes={action} heading={heading}>
        {el}
      </ConfirmModal>
    );
  }

  openModal(el: ReactElement, heading: ReactElement, options?: ModalOptions) {
    if (options) {
      this.setOptions(options);
    }
    this.modal = <Modal heading={heading}>{el}</Modal>;
  }

  setOptions(options: ModalOptions) {
    this.options = options;
  }

  setOnEnterKeyPress(callback: () => void) {
    this.onEnterKeyPress = callback;
  }
}

export default ModalStore;

export const useModalStore = () => useContext(ModalStoreContext);
