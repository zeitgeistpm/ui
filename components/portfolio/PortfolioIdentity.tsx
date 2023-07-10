import { Transition } from "@headlessui/react";
import DiscordIcon from "components/icons/DiscordIcon";
import TwitterIcon from "components/icons/TwitterIcon";
import Avatar from "components/ui/Avatar";
import { useIdentity } from "lib/hooks/queries/useIdentity";
import { useWallet } from "lib/state/wallet";
import { FaNetworkWired } from "react-icons/fa";

const PortfolioIdentity = ({ address }: { address: string }) => {
  const wallet = useWallet();
  const { data: identity } = useIdentity(address);

  const proxy = wallet.proxyFor?.[wallet.activeAccount.address];

  const isProxying = Boolean(
    proxy && proxy.enabled && proxy.address === address,
  );

  return (
    <div className="flex flex-col items-center justify-center w-full gap-y-3 min-h-[200px]">
      {address && <Avatar address={address} size={120} />}
      {identity?.twitter && (
        <div className=" font-extrabold text-[28px] sm:text-[38px]">
          {identity.displayName}
        </div>
      )}
      <div className="text-ztg-12-150 sm:text-ztg-16-150">{address}</div>
      <div className="flex gap-3 text-ztg-14-110 text-white">
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
          <div className="flex items-center gap-2 bg-ztg-100 p-[8px] rounded-md bg-purple-600 text-white text-sm">
            <FaNetworkWired size={18} />
            Your are acting proxy for this portfolio.
          </div>
        </Transition>
      </div>
    </div>
  );
};

export default PortfolioIdentity;
