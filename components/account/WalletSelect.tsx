import { BaseDotsamaWallet } from "@talismn/connect-wallets";
import { useAccountModals } from "lib/state/account";
import { usePrevious } from "lib/hooks/usePrevious";
import { supportedWallets, useWallet } from "lib/state/wallet";
import Web3wallet from "components/web3wallet";
import WalletIcon from "./WalletIcon";
import { userConfigAtom } from "lib/state/wallet";
import { useAtom } from "jotai";

import { useEffect } from "react";

const WalletSelect = () => {
  const { selectWallet, errors, accounts, connected, walletId } = useWallet();
  const [userConfig] = useAtom(userConfigAtom);

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

  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  return (
    <div className="flex flex-col p-4">
      <h3 className="mb-4 text-2xl font-bold">
        {userConfig?.selectedAddress && "Log back in to Zeitgeist"}
      </h3>
      <p className="mb-4">
        {userConfig?.selectedAddress &&
          "Use one of the following options to log in and start using Prediction Markets."}
      </p>
      <Web3wallet />
      <h3 className="my-4 text-lg font-bold">Crypto Wallet</h3>
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
                extensionName={wallet.extensionName}
                logoAlt={wallet.logo?.alt}
                logoSrc={wallet.logo?.src}
                hasError={hasError}
                error={error}
              />
            );
          })}
      </div>
    </div>
  );
};

export default WalletSelect;
