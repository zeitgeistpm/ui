import { Dialog, Tab } from "@headlessui/react";
import Modal from "components/ui/Modal";
import React, { Fragment } from "react";
import AcccountSettingsForm from "./AccountSettingsForm";
import OtherSettingsForm from "./OtherSettingsForm";

export type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

enum TabSelection {
  Account,
  Other,
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const [tabSelection, setTabSelection] = React.useState(TabSelection.Account);

  return (
    <Modal open={open} onClose={onClose}>
      <Dialog.Panel className="w-full max-w-[462px] bg-white rounded-md p-8">
        <h3 className="text-2xl text-center mb-5">Settings</h3>
        <Tab.Group
          onChange={(index) => setTabSelection(index)}
          defaultIndex={tabSelection}
        >
          <Tab.List as={Fragment}>
            <div className="flex justify-center mb-5 pb-3 border-b-1 border-b-sky-200 text-sky-600">
              <div className="flex-grow center">
                <Tab as={Fragment}>
                  {({ selected }) => (
                    <span
                      className={
                        "cursor-pointer text-sm " +
                        (selected ? "font-bold text-black" : "")
                      }
                    >
                      Account
                    </span>
                  )}
                </Tab>
              </div>
              <div className="flex-grow center">
                <Tab as={Fragment}>
                  {({ selected }) => (
                    <span
                      className={
                        "cursor-pointer text-sm " +
                        (selected ? "font-bold text-black" : "")
                      }
                    >
                      Other Settings
                    </span>
                  )}
                </Tab>
              </div>
            </div>
          </Tab.List>
        </Tab.Group>
        {
          {
            [TabSelection.Account]: <AcccountSettingsForm />,
            [TabSelection.Other]: <OtherSettingsForm />,
          }[tabSelection]
        }
      </Dialog.Panel>
    </Modal>
  );
};

export default SettingsModal;
