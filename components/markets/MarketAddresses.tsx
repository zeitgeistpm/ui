import DiscordIcon from "components/icons/DiscordIcon";
import SubIdIcon from "components/icons/SubIdIcon";
import SubScanIcon from "components/icons/SubScanIcon";
import TwitterIcon from "components/icons/TwitterIcon";
import ZeitgeistIcon from "components/icons/ZeitgeistIcon";
import Avatar from "components/ui/Avatar";
import CopyIcon from "components/ui/CopyIcon";
import MarketStore from "lib/stores/MarketStore";
import { useModalStore } from "lib/stores/ModalStore";
import { UserIdentity, useUserStore } from "lib/stores/UserStore";
import { shortenAddress } from "lib/util";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";

const AddressInspectContent = ({
  address,
  identity,
}: {
  address: string;
  identity: UserIdentity;
}) => {
  const showSocialMediaRow: boolean =
    identity.twitter?.length > 0 || identity.discord?.length > 0;

  return (
    <div>
      <div className="flex w-full border-sky-600 border-t-1 border-b-1 py-ztg-15">
        <div className="flex items-center text-white pr-ztg-10 mr-auto w-[90%]">
          <div className="w-ztg-30 h-ztg-30 rounded-full bg-white mr-ztg-10">
            <Avatar address={address} />
          </div>
          <div
            className="text-black dark:text-white font-mono text-ztg-12-150 ml-ztg-10 overflow-hidden"
            data-test="addressDetails"
          >
            {address}
          </div>
        </div>
        <div className="w-ztg-40 flex items-center">
          <CopyIcon copyText={address} className="flex-grow" />
        </div>
      </div>
      {showSocialMediaRow ? (
        <div className="flex flex-row  border-sky-600 border-b-1 py-ztg-15">
          {identity.twitter?.length > 0 ? (
            <a
              className="flex items-center mr-ztg-40"
              href={`https://twitter.com/${identity.twitter}`}
              target="_blank"
              rel="noreferrer"
            >
              <TwitterIcon />
              <span className="ml-ztg-10 ">{identity.twitter}</span>
            </a>
          ) : (
            <></>
          )}
          {identity.discord?.length > 0 ? (
            <div className="flex items-center">
              <DiscordIcon />
              <span className="ml-ztg-10">{identity.discord}</span>
            </div>
          ) : (
            <></>
          )}
        </div>
      ) : (
        <></>
      )}

      <div className="flex flex-col items-center sm:flex-row mb-ztg-5 mt-ztg-20 gap-7">
        <a
          className="flex"
          href={`https://sub.id/#/${address}`}
          target="_blank"
          rel="noreferrer"
        >
          <SubIdIcon />
          <span className="ml-ztg-10">Sub ID</span>
        </a>
        <a
          className="flex"
          href={`https://zeitgeist.subscan.io/account/${address}`}
          target="_blank"
          rel="noreferrer"
        >
          <SubScanIcon />
          <span className="ml-ztg-10">SubScan</span>
        </a>
        <a
          className="flex"
          href={`https://beta.zeitgeist.pm/portfolio/${address}`}
          target="_blank"
          rel="noreferrer"
        >
          <ZeitgeistIcon width={25} height={25} />
          <span className="ml-ztg-10">Portfolio</span>
        </a>
      </div>
    </div>
  );
};

const AddressDetails = ({
  title,
  address,
  displayName,
  onInspect,
}: {
  title: string;
  address: string;
  displayName?: string;
  onInspect: () => void;
}) => {
  const handleInspectClick = () => {
    onInspect();
  };
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center mb-ztg-18 ">
      <div className="font-kanit font-bold text-ztg-18-150 w-[90px] mb-ztg-15 sm:mb-0">
        {title}
      </div>
      <div className="flex">
        <div
          className="flex justify-center items-center bg-sky-500 dark:bg-black 
        rounded-full text-white pl-ztg-6 pr-ztg-10 h-ztg-40 mr-ztg-17"
        >
          <div className="w-ztg-30 h-ztg-30 rounded-full bg-white mr-ztg-10 overflow-hidden">
            <Avatar address={address} />
          </div>
          <div className="text-black dark:text-white font-mono">
            {displayName ?? shortenAddress(address, 4, 4)}
          </div>
        </div>
        <button
          onClick={handleInspectClick}
          className="border-2 border-sky-600 rounded-ztg-50 h-ztg-40 text-ztg-14-120 w-full min-w-[100px] max-w-[160px]"
          data-test="inspectButton"
        >
          Inspect
        </button>
      </div>
    </div>
  );
};

const AddressModalHeader = ({ name }: { name: string }) => {
  return (
    <span className="w-full mx-ztg-10 font-mono text-sunglow-2 font-medium ml-ztg-30">
      {name}
    </span>
  );
};

const MarketAddresses = observer(
  ({ marketStore }: { marketStore: MarketStore }) => {
    const [oracleIdentity, setOracleIdentity] = useState<UserIdentity>();
    const [creatorIdentity, setCreatorIdentity] = useState<UserIdentity>();
    const [authorityIdentity, setAuthorityIdentity] = useState<UserIdentity>();
    const modalStore = useModalStore();
    const { getIdentity } = useUserStore();

    useEffect(() => {
      if (!marketStore || !marketStore.creator || !marketStore.oracle) return;
      (async () => {
        const identities = [
          getIdentity(marketStore.creator),
          getIdentity(marketStore.oracle),
          marketStore.authority ? getIdentity(marketStore.authority) : null,
        ];

        const [creator, oracle, authority] = await Promise.all(identities);

        setCreatorIdentity(creator);
        setOracleIdentity(oracle);
        setAuthorityIdentity(authority);
      })();
    }, [marketStore?.creator, marketStore?.oracle]);

    const handleInspect = (address: string, identity: UserIdentity) => {
      modalStore.openModal(
        <AddressInspectContent address={address} identity={identity} />,
        <>
          Address Details
          <AddressModalHeader name={identity.displayName ?? ""} />
        </>,
        { styles: { width: "70%", maxWidth: "473px" } }
      );
    };

    return (
      <div className="flex flex-col my-ztg-20">
        <AddressDetails
          title="Creator"
          address={marketStore?.creator}
          displayName={
            creatorIdentity?.displayName?.length > 0
              ? creatorIdentity.displayName
              : null
          }
          onInspect={() => handleInspect(marketStore?.creator, creatorIdentity)}
        />
        <AddressDetails
          title="Oracle"
          address={marketStore?.oracle}
          displayName={
            oracleIdentity?.displayName?.length > 0
              ? oracleIdentity.displayName
              : null
          }
          onInspect={() => handleInspect(marketStore?.oracle, oracleIdentity)}
        />
        {authorityIdentity && (
          <AddressDetails
            title="Authority"
            address={marketStore?.authority}
            displayName={
              authorityIdentity?.displayName?.length > 0
                ? authorityIdentity.displayName
                : null
            }
            onInspect={() =>
              handleInspect(marketStore?.oracle, authorityIdentity)
            }
          />
        )}
      </div>
    );
  }
);

export default MarketAddresses;
