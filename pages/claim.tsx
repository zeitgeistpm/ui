import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { useNotifications } from "lib/state/notifications";
import { usePolkadotApi } from "lib/state/polkadot-api";
import { useWallet } from "lib/state/wallet";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { NextPage } from "next";
import { ChangeEvent, useState } from "react";
import airdrop from "../public/airdrop-mock.json";

const TOTAL_AIRDROP_ZTG = 1_000_000;
const ZTG_PER_ADDRESS = TOTAL_AIRDROP_ZTG / airdrop.length;

const ClaimPage: NextPage = () => {
  const [showEligibility, setShowEligibility] = useState(false);
  const [polkadotAddress, setPolkadotAddress] = useState("");

  const isValidPolkadotAddress =
    polkadotAddress == "" || validateAddress(polkadotAddress, 0);

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
          <div className="w-full  text-4xl font-bold sm:text-5xl sm:!leading-[77px] md:text-6xl">
            Find out if you are eligible for the Airdrop
          </div>
          <img
            className="relative mr-auto hidden w-2/5 scale-110 sm:block"
            // width={500}
            // height={100}
            // fill={true}
            // style={{ objectFit: "contain", position: "relative" }}
            src="/airdrop.svg"
            alt="Airdrop"
          />
        </div>
        <div className="w-full whitespace-pre-wrap text-lg">
          This airdrop is designed for those who have actively participated in
          Polkadot's OpenGov by voting before the start of Referendum 502.
          OpenGov users will be able to connect their Polkadot wallet that has
          been used to vote on referenda in Polkadot’s OpenGov before the
          snapshot on February 14th, 2024 (22:14:54 UTC) After connecting their
          wallet, users will then submit a Zeitgeist address and sign a
          transaction that designates that Zeitgeist address, on-chain, as the
          address they would like to receive their share of the 1,000,000 ZTG
          airdrop on.
        </div>
        {showEligibility === false ? (
          <>
            <div className="w-full text-xl font-bold">
              Enter Your Polkadot address below to check your eligibility:
            </div>
            <div className="flex w-full flex-col gap-4 rounded-md bg-[#DFE5ED] p-7 sm:flex-row">
              <div className="relative flex w-full flex-col">
                <input
                  className="w-full rounded-md bg-white p-2"
                  placeholder="Enter Polkadot address"
                  spellCheck={false}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setPolkadotAddress(event.target.value);
                  }}
                />
                {isValidPolkadotAddress === false && (
                  <div className="absolute top-10 text-xs text-red-600">
                    Invalid Polkadot address
                  </div>
                )}
              </div>

              <button
                className="h-[40px] w-full rounded-md bg-[#2468E2] text-white disabled:opacity-50 sm:w-[200px]"
                onClick={() => {
                  setShowEligibility(true);
                }}
                disabled={
                  polkadotAddress === "" ||
                  polkadotAddress == null ||
                  isValidPolkadotAddress === false
                }
              >
                Check Eligibility
              </button>
            </div>
          </>
        ) : (
          <Eligibility
            polkadotAddress={polkadotAddress}
            onCheckAgain={() => {
              setShowEligibility(false);
              setPolkadotAddress("");
            }}
          />
        )}
      </div>
    </div>
  );
};

const Eligibility = ({
  polkadotAddress,
  onCheckAgain,
}: {
  polkadotAddress: string;
  onCheckAgain: () => void;
}) => {
  const wallet = useWallet();
  const notifications = useNotifications();

  const [claimAddress, setClaimAddress] = useState<string | null>(null);
  const { api } = usePolkadotApi();

  //todo: formatting
  const claim = airdrop.some(
    (airdropAddress) => airdropAddress === polkadotAddress,
  );

  const isValid = claimAddress === null || validateAddress(claimAddress, 73);
  const tx = api?.tx.system.remark(`zeitgeistairdrop-1-${claimAddress}`);

  const connectedWalletMatchesPolkadotAddress = addressesMatch(
    polkadotAddress,
    wallet.realAddress ?? "",
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
          {connectedWalletMatchesPolkadotAddress ? (
            <div className="w-full text-xl font-bold">
              You are eligible for at least {Math.floor(ZTG_PER_ADDRESS)} ZTG,
              enter Zeitgeist address to claim
            </div>
          ) : (
            <div className="w-full text-xl font-bold">
              This address is eligible for at least{" "}
              {Math.floor(ZTG_PER_ADDRESS)} ZTG, enter Zeitgeist address to
              claim
            </div>
          )}
          <div className="flex w-full flex-col">
            <div className="flex w-full flex-col gap-4 rounded-md bg-[#DFE5ED] p-7 sm:flex-row">
              <div className="relative flex w-full flex-col">
                <input
                  className="w-full rounded-md bg-white p-2"
                  placeholder="Zeitgeist Address"
                  spellCheck={false}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setClaimAddress(event.target.value);
                  }}
                />
                {isValid === false && (
                  <div className="absolute top-10 text-xs text-red-600">
                    Invalid Zeitgeist address
                  </div>
                )}
              </div>
              <button
                className="h-[40px] w-full rounded-md bg-[#2468E2] text-white disabled:opacity-50 sm:w-[200px]"
                disabled={
                  claimAddress === null ||
                  isValid === false ||
                  wallet.connected === false ||
                  connectedWalletMatchesPolkadotAddress === false
                }
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
              Wallet not supported? Enter Zeitgeist address and sign with
              Polkadot.js/apps
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

const validateAddress = (address: string, ss58Format: number) => {
  try {
    const encodedAddress = encodeAddress(
      decodeAddress(address),
      ss58Format,
    ).toString();

    return encodedAddress === address;
  } catch {
    return false;
  }
};

const addressesMatch = (address1: string, address2: string) => {
  try {
    const encodedAddress1 = encodeAddress(
      decodeAddress(address1),
      0,
    ).toString();
    const encodedAddress2 = encodeAddress(
      decodeAddress(address2),
      0,
    ).toString();

    return encodedAddress1 === encodedAddress2;
  } catch {
    return false;
  }
};

export default ClaimPage;
