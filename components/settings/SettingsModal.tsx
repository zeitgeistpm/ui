import { Dialog, Tab } from "@headlessui/react";
import Modal from "components/ui/Modal";
import { useIdentity } from "lib/hooks/queries/useIdentity";
import { useWallet } from "lib/state/wallet";
import React, { Fragment } from "react";
import AcccountSettingsForm from "./AccountSettingsForm";
import FeePayingAssetSelect from "./FeePayingAssetSelect";
import OtherSettingsForm from "./OtherSettingsForm";

export type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

enum TabSelection {
  Account,
  Proxy,
  Fees,
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const [tabSelection, setTabSelection] = React.useState(TabSelection.Account);

  const wallet = useWallet();
  const address = wallet.activeAccount?.address;

  const { data: identity } = useIdentity(address);

  return (
    <Modal open={open} onClose={onClose}>
      <Dialog.Panel className="w-full max-w-[600px] rounded-lg border border-sky-200/30 bg-white/95 p-6 shadow-xl backdrop-blur-md">
        <h3 className="mb-6 text-center text-2xl font-bold text-sky-900">
          Settings
        </h3>
        <Tab.Group
          onChange={(index) => setTabSelection(index)}
          defaultIndex={tabSelection}
        >
          <Tab.List className="mb-6 flex gap-2 rounded-lg bg-sky-50/50 p-1 backdrop-blur-sm">
            <Tab
              className={({ selected }) =>
                `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all focus:outline-none ${
                  selected
                    ? "bg-white text-sky-900 shadow-sm"
                    : "text-sky-700 hover:bg-white/60 hover:text-sky-900"
                }`
              }
            >
              Account
            </Tab>
            <Tab
              className={({ selected }) =>
                `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all focus:outline-none ${
                  selected
                    ? "bg-white text-sky-900 shadow-sm"
                    : "text-sky-700 hover:bg-white/60 hover:text-sky-900"
                }`
              }
            >
              Proxy
            </Tab>
            <Tab
              className={({ selected }) =>
                `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all focus:outline-none ${
                  selected
                    ? "bg-white text-sky-900 shadow-sm"
                    : "text-sky-700 hover:bg-white/60 hover:text-sky-900"
                }`
              }
            >
              Fee Asset
            </Tab>
          </Tab.List>
        </Tab.Group>
        {
          {
            [TabSelection.Account]: identity ? (
              <AcccountSettingsForm identity={identity} />
            ) : (
              <></>
            ),
            [TabSelection.Proxy]: <OtherSettingsForm />,
            [TabSelection.Fees]: <FeePayingAssetSelect />,
          }[tabSelection]
        }
      </Dialog.Panel>
    </Modal>
  );
};

export default SettingsModal;
