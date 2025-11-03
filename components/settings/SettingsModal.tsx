import { Tab } from "@headlessui/react";
import Modal from "components/ui/Modal";
import { ModalPanel } from "components/ui/ModalPanel";
import { useIdentity } from "lib/hooks/queries/useIdentity";
import { useWallet } from "lib/state/wallet";
import React from "react";
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
      <ModalPanel maxWidth="2xl" className="p-6">
        <h3 className="mb-6 text-center text-2xl font-bold text-white">
          Settings
        </h3>
        <Tab.Group
          onChange={(index) => setTabSelection(index)}
          defaultIndex={tabSelection}
        >
          <Tab.List className="mb-6 flex gap-2 rounded-lg bg-white/10 p-1 backdrop-blur-sm">
            <Tab
              className={({ selected }) =>
                `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all focus:outline-none ${
                  selected
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white/90"
                }`
              }
            >
              Account
            </Tab>
            <Tab
              className={({ selected }) =>
                `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all focus:outline-none ${
                  selected
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white/90"
                }`
              }
            >
              Proxy
            </Tab>
            <Tab
              className={({ selected }) =>
                `flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all focus:outline-none ${
                  selected
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white/90"
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
      </ModalPanel>
    </Modal>
  );
};

export default SettingsModal;
