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

  const polkadotAddress = encodeAddress(decodeAddress(realAddress), 0);
  console.log(polkadotAddress.toString());

  return (
    <div className="relative mt-2">
      <div className="flex flex-col">
        <div>Claim ZTG</div>
        <div>Polkadot Address: {polkadotAddress}</div>
        {connected === true && polkadotAddress ? (
          <Eligibility address={polkadotAddress} />
        ) : (
          <div>Connect wallet</div>
        )}
      </div>
    </div>
  );
};

const Eligibility = ({ address }: { address: string }) => {
  const wallet = useWallet();
  const notifications = useNotifications();

  const [claimAddress, setClaimAddress] = useState<string | null>(null);
  const { api } = usePolkadotApi();
  const claim = claimListMock.find((c) => c.address === address);

  const isValid =
    claimAddress === null || validateZeigeistAddress(claimAddress);

  const submitClaim = () => {
    if (!claimAddress || !api) return;
    const tx = api.tx.system.remarkWithEvent(
      `zeitgeist.airdrop-1-${claimAddress}`,
    );

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
          <button
            disabled={claimAddress === null || isValid === false}
            onSubmit={() => submitClaim()}
          >
            Claim
          </button>
          {isValid === false && <div>Invalid address</div>}
        </div>
      ) : (
        <div>You are not eligible for this airdrop</div>
      )}
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
