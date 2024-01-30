import { BaseDotsamaWallet } from "@talismn/connect-wallets";
import { useAccountModals } from "lib/state/account";
import { usePrevious } from "lib/hooks/usePrevious";
import { supportedWallets, useWallet } from "lib/state/wallet";
import Web3wallet from "components/web3wallet";
import WalletIcon from "./WalletIcon";

import { useEffect } from "react";
import { isWSX } from "lib/constants";

const WalletSelect = () => {
  const { selectWallet, errors, accounts, connected, walletId } = useWallet();
  const accountModals = useAccountModals();

  const wasConnected = usePrevious(connected);

  const handleSelectWallet = async (wallet: BaseDotsamaWallet) => {
    if (!wallet.installed && wallet.extensionName !== "web3auth") {
      window.open(wallet.installUrl);
    } else {
      selectWallet(wallet.extensionName);
      accountModals.closeWalletSelect();
    }
  };

  useEffect(() => {
    if (
      !wasConnected &&
      connected &&
      accounts.length &&
      walletId !== "web3auth"
    ) {
      accountModals.openAccountSelect();
    } else if (
      !wasConnected &&
      connected &&
      accounts.length &&
      walletId === "web3auth"
    ) {
      accountModals.closeWalletSelect();
    }
  }, [wasConnected, connected, accounts, errors]);

  return (
    <div className="flex flex-col p-4">
      <h3 className="mb-4 text-center text-lg font-bold">
        Log in to {isWSX ? "The Washington Stock Exchange" : "Zeitgeist"}
      </h3>
      {isWSX && (
        <p className="mx-auto mb-6 max-w-[250px] text-center text-sm">
          To get started or to log back in, select one of the login options
          below.
        </p>
      )}
      <Web3wallet />
      {!isWSX && (
        <>
          <div className="py-6 text-center text-sm text-gray-400">
            <p>or connect using your own wallet</p>
          </div>
          <div className="flex justify-between gap-6">
            {supportedWallets
              .filter((w) => w.extensionName !== "web3auth")
              .map((wallet) => {
                const error = errors.find(
                  (e) => e.extensionName === wallet.extensionName,
                );
                const hasError = error != null;
                return (
                  <WalletIcon
                    onClick={() => {
                      handleSelectWallet(wallet);
                    }}
                    wallet={wallet}
                    extensionName={wallet.extensionName}
                    logoAlt={wallet.logo?.alt}
                    logoSrc={wallet.logo?.src}
                    hasError={hasError}
                    error={error}
                  />
                );
              })}
          </div>
        </>
      )}
    </div>
  );
};

export default WalletSelect;
