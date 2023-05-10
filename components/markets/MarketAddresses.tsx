import DiscordIcon from "components/icons/DiscordIcon";
import SubIdIcon from "components/icons/SubIdIcon";
import SubScanIcon from "components/icons/SubScanIcon";
import TwitterIcon from "components/icons/TwitterIcon";
import ZeitgeistIconDark from "components/icons/ZeitgeistIconDark";
import Avatar from "components/ui/Avatar";
import CopyIcon from "components/ui/CopyIcon";
import Link from "next/link";
import { useIdentity } from "lib/hooks/queries/useIdentity";
import { shortenAddress } from "lib/util";

import dynamic from "next/dynamic";
import { Judgement, UserIdentity } from "lib/types/user-identity";
import { useState } from "react";
import { Dialog } from "@headlessui/react";
import Modal from "components/ui/Modal";

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
        <Link
          className="flex"
          href={`/portfolio/${address}`}
          target="_blank"
          rel="noreferrer"
        >
          <ZeitgeistIconDark width={25} height={25} />
          <span className="ml-ztg-10">Portfolio</span>
        </Link>
      </div>
    </div>
  );
};

const AddressDetails = ({
  title,
  address,
}: {
  title: string;
  address: string;
}) => {
  const [inspected, setInspected] = useState(false);
  const { data: identity } = useIdentity(address);

  const displayName =
    identity?.displayName?.length > 0
      ? identity?.displayName
      : shortenAddress(address, 8, 8);

  return (
    <>
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center mb-ztg-18 cursor-pointer hover:bg-sky-100 ztg-transition rounded-lg p-[5px]"
        onClick={() => setInspected(true)}
        data-test="inspectButton"
      >
        <div className="flex items-center">
          <div className="flex justify-center items-center pl-ztg-6 pr-ztg-10">
            <div className="w-ztg-40 h-ztg-40 rounded-full bg-white overflow-hidden text-ztg-14-150 mr-[15px]">
              <Avatar address={address} size={40} />
            </div>
            <div className="flex flex-col font-medium text-ztg-16-150">
              <div className=" text-sky-600">{title}</div>
              <div className="">{displayName}</div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={inspected} onClose={() => setInspected(false)}>
        <Dialog.Panel className="bg-white rounded-ztg-10 p-[15px]">
          <div>
            Address Details
            <AddressModalHeader
              name={identity?.displayName ?? ""}
              judgement={identity?.judgement}
            />
            <AddressInspectContent address={address} identity={identity} />
          </div>
        </Dialog.Panel>
      </Modal>
    </>
  );
};
const getJudgementColorClass = (judgement: Judgement) => {
  if (judgement === "KnownGood" || judgement === "Reasonable") {
    return "text-sheen-green";
  } else if (
    judgement === "LowQuality" ||
    judgement === "OutOfDate" ||
    judgement === "Erroneous"
  ) {
    return "text-vermilion";
  }
};
const AddressModalHeader = ({
  name,
  judgement,
}: {
  name: string;
  judgement: Judgement;
}) => {
  return (
    <span className="w-full mx-ztg-10">
      <span className="text-sunglow-2 font-medium ml-ztg-30">{name}</span>
      <span
        className={`text-ztg-10-150 mx-ztg-30 ${getJudgementColorClass(
          judgement,
        )}`}
      >
        {judgement?.split(/(?=[A-Z])/).join(" ")}
      </span>
    </span>
  );
};

interface MarketAddressesProps {
  creatorAddress: string;
  oracleAddress: string;
}

const MarketAddresses = ({
  creatorAddress,
  oracleAddress,
}: MarketAddressesProps) => {
  return (
    <div className="flex flex-wrap gap-[20px] justify-center my-ztg-20">
      <AddressDetails title="Creator" address={creatorAddress} />
      <AddressDetails title="Oracle" address={oracleAddress} />
    </div>
  );
};

export default dynamic(() => Promise.resolve(MarketAddresses), {
  ssr: false,
});
