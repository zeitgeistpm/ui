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
import Link from "next/link";
import { ExternalLink } from "react-feather";

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
      <div className="mb-4 rounded-lg bg-white/10 p-3 shadow-lg backdrop-blur-md">
        <div className="overflow-hidden rounded-lg p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="shrink-0">
              {address && <Avatar address={address} size={64} />}
            </div>
            <div className="flex flex-1 flex-col">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {isOwned && !hasIdentity && (
                    <div className="mb-0.5 text-xxs font-semibold uppercase tracking-wide text-ztg-green-500">
                      Wallet Name
                    </div>
                  )}
                  {isOwned && hasIdentity && (
                    <div className="mb-0.5 text-xxs font-semibold uppercase tracking-wide text-ztg-green-500">
                      On-Chain Identity
                    </div>
                  )}
                  <div className="text-xl font-bold text-white/90 sm:text-2xl">
                    {name}
                  </div>
                </div>

                {isOwned && !hasIdentity && (
                  <div className="flex items-center">
                    <button
                      className="flex items-center gap-1.5 rounded-md bg-ztg-green-600/80 px-3 py-1.5 text-xs font-semibold text-white/90 shadow-sm backdrop-blur-sm transition-all hover:bg-ztg-green-600"
                      onClick={() => setShowSettingsModal(true)}
                    >
                      <FaUserCheck size={14} />
                      <span>Set Identity</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Address - Desktop */}
              <div className="mb-2 hidden text-xs text-white/70 sm:block">
                <Link
                  className="flex items-center gap-1.5 transition-all hover:text-white/90"
                  href={`https://zeitgeist.subscan.io/account/${address}`}
                  target="_blank"
                >
                  <span className="font-mono">{address}</span>
                  <ExternalLink className="flex-none" size={14} />
                </Link>
              </div>

              {/* Address - Mobile */}
              <div className="mb-2 text-xs text-white/70 sm:hidden">
                <Link
                  className="flex items-center gap-1.5 transition-all hover:text-white/90"
                  href={`https://zeitgeist.subscan.io/account/${address}`}
                  target="_blank"
                >
                  <span className="font-mono">
                    {shortenAddress(address, 12, 26)}
                  </span>
                  <ExternalLink className="flex-none" size={14} />
                </Link>
              </div>

              {/* Social & Status Badges */}
              <div className="flex flex-wrap gap-1.5">
                {identity?.twitter && (
                  <a
                    className="flex items-center gap-1.5 rounded-md bg-twitter px-2.5 py-1.5 text-xs font-medium text-white/90 shadow-sm transition-all hover:shadow-md"
                    href={`https://twitter.com/${identity.twitter}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <TwitterIcon fill="white" />
                    <span>{identity.twitter}</span>
                  </a>
                )}
                {identity?.discord && (
                  <div className="flex items-center gap-1.5 rounded-md bg-discord px-2.5 py-1.5 text-xs font-medium text-white/90 shadow-sm">
                    <DiscordIcon fill="white" />
                    <span>{identity.discord}</span>
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
                  <div className="flex items-center gap-1.5 rounded-md bg-purple-600 px-2.5 py-1.5 text-xs font-medium text-white/90 shadow-sm">
                    <FaNetworkWired size={14} />
                    <span>Proxy</span>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
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
