import { Transition } from "@headlessui/react";
import DiscordIcon from "components/icons/DiscordIcon";
import TwitterIcon from "components/icons/TwitterIcon";
import SettingsModal from "components/settings/SettingsModal";
import Avatar from "components/ui/Avatar";
import { useIdentity } from "lib/hooks/queries/useIdentity";
import { useWallet } from "lib/state/wallet";
import { shortenAddress } from "lib/util";
import { useState } from "react";
import { FaNetworkWired, FaUserCheck } from "react-icons/fa";

const PortfolioIdentity = ({ address }: { address: string }) => {
  const wallet = useWallet();
  const { data: identity } = useIdentity(address);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const proxy = wallet.getProxyFor(wallet.activeAccount?.address);

  const isProxying = Boolean(
    proxy && proxy.enabled && proxy.address === address,
  );

  let hasIdentity = Boolean(identity?.displayName);
  let isOwned = false;
  let name = identity?.displayName;

  if (!name) {
    const ownedAccount = wallet.accounts.find((a) => a.address === address);
    if (ownedAccount) {
      isOwned = true;
      name = ownedAccount.name;
    } else {
      name = shortenAddress(address);
    }
  }

  return (
    <>
      <div className="flex flex-col justify-center w-full gap-y-2 sm:gap-y-5 mb-5">
        <div className="flex gap-5 flex-col sm:flex-row">
          <div>{address && <Avatar address={address} size={100} />}</div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 sm:mb-3">
              <div>
                {isOwned && !hasIdentity && (
                  <div className="-mb-3 font-extrabold text-xs text-gray-500">
                    wallet name
                  </div>
                )}
                {isOwned && hasIdentity && (
                  <div className="-mb-3 font-extrabold text-xs text-gray-500">
                    on chain name
                  </div>
                )}
                <div className="font-extrabold text-xl sm:text-4xl">
                  {name}{" "}
                </div>
              </div>

              {isOwned && !hasIdentity && (
                <div className="flex flex-1 items-center justify-end">
                  <button
                    className="py-2 px-3 bg-ztg-blue text-white rounded-lg text-sm center gap-2"
                    onClick={() => setShowSettingsModal(true)}
                  >
                    Set On-Chain Identity <FaUserCheck />
                  </button>
                </div>
              )}
            </div>
            <div className="hidden sm:block">{address}</div>
            <div className="sm:hidden text-sm">
              {shortenAddress(address, 12, 26)}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-ztg-14-110 text-white">
          {identity?.twitter && (
            <a
              className="flex items-center bg-twitter p-[8px] rounded-md"
              href={`https://twitter.com/${identity.twitter}`}
              target="_blank"
              rel="noreferrer"
            >
              <TwitterIcon fill="white" />
              <span className="ml-ztg-10 ">{identity.twitter}</span>
            </a>
          )}
          {identity?.discord && (
            <div className="flex items-center bg-discord p-[8px] rounded-md">
              <DiscordIcon fill="white" />
              <span className="ml-ztg-10">{identity.discord}</span>
            </div>
          )}
          <Transition
            enter="transition-opacity duration-250"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-250"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            show={isProxying}
          >
            <div className="flex items-center gap-2  p-[8px] rounded-md bg-purple-600 text-white">
              <FaNetworkWired size={16} />
              Your are acting proxy for this account.
            </div>
          </Transition>
        </div>
      </div>
      <SettingsModal
        open={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
        }}
      />
    </>
  );
};

export default PortfolioIdentity;
