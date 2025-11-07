import { Tab } from "@headlessui/react";
import Modal from "components/ui/Modal";
import { ModalPanel, ModalHeader, ModalBody, ModalTabs } from "components/ui/ModalPanel";
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

const tabClass = ({ selected }: { selected: boolean }) =>
  `flex-1 px-3 py-2 text-sm font-medium transition-all border-r border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ztg-primary-500 ${
    selected
      ? "bg-white/10 text-white font-semibold"
      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
  }`;

const tabClassLast = ({ selected }: { selected: boolean }) =>
  `flex-1 px-3 py-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ztg-primary-500 ${
    selected
      ? "bg-white/10 text-white font-semibold"
      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
  }`;

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const [tabSelection, setTabSelection] = React.useState(TabSelection.Account);

  const wallet = useWallet();
  const address = wallet.activeAccount?.address;

  const { data: identity } = useIdentity(address);

  const getModalSize = () => {
    return "2xl";
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalPanel size="lg" className="flex flex-col">
        {/* Standardized header */}
        <ModalHeader title="Settings" />

        {/* Added min-w-0 to Tab.Group to ensure width constraints propagate */}
        <Tab.Group
          selectedIndex={tabSelection}
          onChange={(index) => setTabSelection(index)}
          as="div"
          className="flex flex-col h-full min-w-0 w-full"
        >
          {/* Standardized tabs */}
          <ModalTabs
            tabs={
              <Tab.List className="flex h-full">
                <Tab className={tabClass}>Account</Tab>
                <Tab className={tabClass}>Proxy</Tab>
                <Tab className={tabClassLast}>Fee Asset</Tab>
              </Tab.List>
            }
          />

          {/* Standardized content area */}
          {/* Added min-w-0 and w-full to prevent tab switching from resizing modal */}
          <Tab.Panels className="flex-1 min-w-0 w-full overflow-hidden">
            <Tab.Panel className="h-full min-w-0 w-full">
              <ModalBody>
                {identity ? (
                  <AcccountSettingsForm identity={identity} />
                ) : (
                  <></>
                )}
              </ModalBody>
            </Tab.Panel>
            <Tab.Panel className="h-full min-w-0 w-full">
              <ModalBody>
                <OtherSettingsForm />
              </ModalBody>
            </Tab.Panel>
            <Tab.Panel className="h-full min-w-0 w-full">
              <ModalBody>
                <FeePayingAssetSelect />
              </ModalBody>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </ModalPanel>
    </Modal>
  );
};

export default SettingsModal;
