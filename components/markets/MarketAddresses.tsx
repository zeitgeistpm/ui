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
import Skeleton from "components/ui/Skeleton";

const AddressInspectContent = ({
  address,
  identity,
}: {
  address: string;
  identity?: UserIdentity;
}) => {
  const showSocialMediaRow: boolean =
    !!identity?.twitter || !!identity?.discord;

  return (
    <div>
      <div className="flex w-full border-b-1 border-t-1 border-sky-600 py-ztg-15">
        <div className="mr-auto flex w-[90%] items-center pr-ztg-10 text-white">
          <div className="mr-ztg-10 h-ztg-30 w-ztg-30 rounded-full bg-white">
            <Avatar address={address} />
          </div>
          <div
            className="ml-ztg-10 overflow-hidden font-mono text-ztg-12-150 text-black dark:text-white"
            data-test="addressDetails"
          >
            {address}
          </div>
        </div>
        <div className="flex w-ztg-40 items-center">
          <CopyIcon copyText={address} className="flex-grow" />
        </div>
      </div>
      {showSocialMediaRow ? (
        <div className="flex flex-row  border-b-1 border-sky-600 py-ztg-15">
          {identity?.twitter && identity.twitter.length > 0 ? (
            <a
              className="mr-ztg-40 flex items-center"
              href={`https://twitter.com/${identity.twitter}`}
              target="_blank"
              rel="noreferrer"
            >
              <TwitterIcon />
              <span className="ml-ztg-10 ">{identity?.twitter}</span>
            </a>
          ) : (
            <></>
          )}
          {identity?.discord && identity.discord.length > 0 ? (
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

      <div className="mb-ztg-5 mt-ztg-20 flex flex-col items-center gap-7 sm:flex-row">
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

export const AddressDetails = ({
  title,
  address,
}: {
  title: string;
  address: string;
}) => {
  const [inspected, setInspected] = useState(false);
  const { data: identity, isLoading } = useIdentity(address);

  const displayName =
    identity?.displayName?.length !== 0
      ? identity?.displayName
      : shortenAddress(address, 8, 8);

  return (
    <>
      <div
        className="ztg-transition flex w-fit cursor-pointer flex-col items-start rounded-lg sm:flex-row sm:items-center"
        onClick={() => setInspected(true)}
        data-test="inspectButton"
      >
        <div className="flex items-center">
          <div className="flex items-center justify-center gap-2 pr-ztg-10">
            <Avatar address={address} size={30} />
            <div className="flex flex-col font-medium">
              <div className="text-[10px] text-sky-600">{title}</div>
              {isLoading ? (
                <Skeleton width={130} height={16} />
              ) : (
                <div className="text-xs">{displayName}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal open={inspected} onClose={() => setInspected(false)}>
        <Dialog.Panel className="max-w-[95%] rounded-ztg-10 bg-white p-[15px]">
          <div>
            Address Details
            {identity?.judgement && (
              <AddressModalHeader
                name={identity.displayName}
                judgement={identity.judgement}
              />
            )}
            <AddressInspectContent
              address={address}
              identity={identity ?? undefined}
            />
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
    <span className="mx-ztg-10 w-full">
      <span className="ml-ztg-30 font-medium text-sunglow-2">{name}</span>
      <span
        className={`mx-ztg-30 text-ztg-10-150 ${getJudgementColorClass(
          judgement,
        )}`}
      >
        {judgement?.split(/(?=[A-Z])/).join(" ")}
      </span>
    </span>
  );
};
