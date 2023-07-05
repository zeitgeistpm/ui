import { Dialog } from "@headlessui/react";
import Modal from "components/ui/Modal";
import React from "react";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Dialog.Panel className="w-full max-w-[462px] bg-white rounded-md p-8"></Dialog.Panel>
    </Modal>
  );
};

export default SettingsModal;
