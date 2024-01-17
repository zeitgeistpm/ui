import { BaseDotsamaWallet } from "@talismn/connect-wallets";
import { useAccountModals } from "lib/state/account";
import { usePrevious } from "lib/hooks/usePrevious";
import { supportedWallets, useWallet } from "lib/state/wallet";
import Web3wallet from "components/web3wallet";

import { useEffect } from "react";
import { Download } from "react-feather";

const WalletSelect = () => {
  const { selectWallet, errors, accounts, connected } = useWallet();
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
    if (!wasConnected && connected && accounts.length) {
      accountModals.openAccountSelect();
    }
  }, [wasConnected, connected, accounts, errors]);

  return (
    <div className="flex flex-col">
      <div className="mb-3 text-center font-bold">Connect to Zeitgeist</div>
      <Web3wallet />
      <div className="flex justify-between gap-4">
        {supportedWallets
          .filter((w) => w.extensionName !== "web3auth")
          .map((wallet, idx) => {
            const error = errors.find(
              (e) => e.extensionName === wallet.extensionName,
            );
            const hasError = error != null;
            return (
              <div
                key={wallet.extensionName}
                className="flex flex-1 cursor-pointer flex-row items-center justify-center rounded border py-1 hover:bg-gray-200"
                onClick={() => {
                  handleSelectWallet(wallet);
                }}
              >
                <img
                  className="center h-8 w-8"
                  alt={wallet.logo?.alt}
                  src={wallet.logo?.src}
                />
                {hasError && (
                  <div className="ml-auto w-ztg-275  text-ztg-12-120 text-vermilion">
                    {error.type === "NoAccounts" &&
                      "No accounts on this wallet. Please add account in wallet extension."}
                    {error.type === "InteractionDenied" &&
                      "Not allowed to interact with extension. Please change permission settings."}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default WalletSelect;
