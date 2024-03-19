import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { useNotifications } from "lib/state/notifications";
import { usePolkadotApi } from "lib/state/polkadot-api";
import { useWallet } from "lib/state/wallet";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { NextPage } from "next";
import { ChangeEvent, useState } from "react";
import Image from "next/image";

const claimListMock: { address: string; amount: string }[] = [
  { address: "1vcwFJXqgzJPAmt81v4oFAdeKnSfSEzTauMNbGvRcT1F26J", amount: "100" },
];

const ClaimPage: NextPage = () => {
  const { connected, realAddress } = useWallet();
  const [showEligibility, setShowEligibility] = useState(false);
  const [polkadotAddress, setPolkadotAddress] = useState("");

  // const polkadotAddress =
  // realAddress && encodeAddress(decodeAddress(realAddress), 0);

  return (
    <div className="relative mt-10 flex items-center justify-center">
      <div
        className="absolute z-[-1] h-full w-full overflow-hidden"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(254, 207, 255, 0.3) 20.83%, rgba(205, 222, 255, 0.3) 54.17%, rgba(201, 232, 255, 0.3) 57.29%, rgba(245, 245, 245, 0) 100%)",
        }}
      ></div>
      <div className="flex max-w-[850px] flex-col items-center justify-center gap-y-5">
        <div className="flex w-full gap-x-10">
          <div
            className="w-full text-6xl font-bold"
            style={{ lineHeight: "77px" }}
          >
            Find out if you are eligible for the Airdrop
          </div>
          <img
            className=" relative mr-auto w-2/5 scale-110"
            // width={500}
            // height={100}
            // fill={true}
            // style={{ objectFit: "contain", position: "relative" }}
            src="/airdrop.svg"
            alt="Airdrop"
          />
        </div>
        <div className="w-full text-lg">
          This airdrop is dedicated to the successful passing of the Zeitgeist
          proposal blah-blah-blah. If you're a supporter and a voter, you might
          find yourself eligible for this airdrop.
        </div>
        {showEligibility === false ? (
          <>
            <div className="w-full text-xl font-bold">
              Enter Your Polkadot address below to check your eligibility:
            </div>
            <div className="flex w-full gap-4 rounded-md bg-[#DFE5ED] p-7">
              <input
                className="w-full rounded-md bg-white p-2"
                placeholder="Enter Polkadot address"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setPolkadotAddress(event.target.value);
                }}
              />
              <button
                className="w-[200px] rounded-md bg-[#2468E2] text-white"
                onClick={() => {
                  setShowEligibility(true);
                }}
              >
                Check Eligibility
              </button>
            </div>
          </>
        ) : (
          <Eligibility
            address={polkadotAddress}
            onCheckAgain={() => {
              setShowEligibility(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

const Eligibility = ({
  address,
  onCheckAgain,
}: {
  address: string;
  onCheckAgain: () => void;
}) => {
  const wallet = useWallet();
  const notifications = useNotifications();

  const [claimAddress, setClaimAddress] = useState<string | null>(null);
  const { api } = usePolkadotApi();
  const claim = claimListMock.find((c) => c.address === address);

  const isValid =
    claimAddress === null || validateZeigeistAddress(claimAddress);
  const tx = api?.tx.system.remarkWithEvent(
    `zeitgeistairdrop-1-${claimAddress}`,
  );

  const txHex = tx?.toHex();

  const submitClaim = () => {
    if (!tx || !api) return;

    const signer = wallet.getSigner();

    if (!signer) return;

    signAndSend(
      tx,
      signer,
      extrinsicCallback({
        api: api,
        notifications,
        broadcastCallback: () => {
          notifications?.pushNotification("Broadcasting transaction...", {
            autoRemove: true,
          });
        },
        successCallback: (data) => {
          notifications?.pushNotification(`Successfully claimed`, {
            autoRemove: true,
            type: "Success",
          });
        },
        failCallback: (error) => {
          notifications.pushNotification(error, { type: "Error" });
        },
      }),
    ).catch((error) => {
      notifications.pushNotification(error?.toString() ?? "Unknown Error", {
        type: "Error",
      });
    });
  };

  return (
    <>
      {claim ? (
        <>
          <div className="w-full text-xl font-bold">
            You are eligible for {claim.amount} ZTG, enter Zeitgeist address to
            claim
          </div>
          <div className="flex w-full flex-col">
            <div className="flex w-full gap-4 rounded-md bg-[#DFE5ED] p-7">
              <div className="relative flex w-full flex-col">
                <input
                  className="w-full rounded-md bg-white p-2"
                  placeholder="Zeitgeist Address"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setClaimAddress(event.target.value);
                  }}
                />
                {isValid === false && (
                  <div className="absolute top-10 text-xs text-red-600">
                    Invalid address
                  </div>
                )}
              </div>
              <button
                className="w-[200px] rounded-md bg-[#2468E2] text-white"
                disabled={claimAddress === null || isValid === false}
                onClick={() => submitClaim()}
              >
                Claim Airdrop
              </button>
            </div>
            <a
              href={`https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frococo-rpc.polkadot.io#/extrinsics/decode/${txHex}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 text-sm text-blue-700"
            >
              Wallet not supported? Sign on Polkadot.js/apps
            </a>
          </div>
        </>
      ) : (
        <div className="w-full text-xl font-bold">
          You are not eligible for this airdrop
        </div>
      )}
      <div className="flex w-full">
        <button
          className="h-[40px] w-[200px] rounded-md bg-[#2468E2] text-white"
          onClick={() => onCheckAgain()}
        >
          Check another address
        </button>
      </div>
    </>
  );
};

const validateZeigeistAddress = (address: string) => {
  try {
    const encodedAddress = encodeAddress(decodeAddress(address), 73).toString();

    return encodedAddress === address;
  } catch {
    return false;
  }
};

export default ClaimPage;
