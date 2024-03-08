import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { useNotifications } from "lib/state/notifications";
import { usePolkadotApi } from "lib/state/polkadot-api";
import { useWallet } from "lib/state/wallet";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { NextPage } from "next";
import { ChangeEvent, useState } from "react";

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
    <div className="relative mt-2">
      <div className="flex flex-col">
        {showEligibility === false ? (
          <>
            <div>Claim ZTG</div>
            <input
              placeholder="Enter Polkadot address"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setPolkadotAddress(event.target.value);
              }}
            />
            <button
              onClick={() => {
                setShowEligibility(true);
              }}
            >
              Check Eligibility
            </button>
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
    `zeitgeist.airdrop-1-${claimAddress}`,
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
          notifications?.pushNotification(
            `Successfully claimed to ${claimAddress}`,
            {
              autoRemove: true,
            },
          );
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
    <div>
      {claim ? (
        <div className="flex flex-col">
          <div>
            You are eligible for {claim.amount} ZTG, enter Zeitgeist address to
            claim
          </div>
          <input
            type="text"
            placeholder="Zeitgeist Address"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setClaimAddress(event.target.value);
            }}
          />
          <a
            href={`https://polkadot.js.org/apps/?rpc=wss%3A%2F%2Frococo-rpc.polkadot.io#/extrinsics/decode/${txHex}`}
            target="_blank"
            rel="noreferrer"
          >
            Wallet not supported? Sign on Polkadot.js/apps
          </a>
          <button
            disabled={claimAddress === null || isValid === false}
            onClick={() => submitClaim()}
          >
            Claim
          </button>
          {isValid === false && <div>Invalid address</div>}
        </div>
      ) : (
        <div>You are not eligible for this airdrop</div>
      )}
      <button onClick={() => onCheckAgain()}>Check another wallet</button>
    </div>
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
