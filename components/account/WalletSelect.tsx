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
      <div className="mb-3 text-ztg-16-150 font-bold text-black">
        Connect Wallet
      </div>
      <Web3wallet />
      {supportedWallets.map((wallet, idx) => {
        const error = errors.find(
          (e) => e.extensionName === wallet.extensionName,
        );
        const hasError = error != null;
        return (
          <div key={wallet.extensionName}>
            <div
              className={
                "flex h-ztg-64 cursor-pointer flex-row items-center rounded-ztg-12 bg-sky-100 px-ztg-12 dark:bg-sky-700 " +
                (idx < 3 ? "mb-ztg-12 " : "")
              }
              onClick={() => {
                handleSelectWallet(wallet);
              }}
            >
              <img
                className="center mr-ztg-10 h-ztg-32 w-ztg-32 text-ztg-12-120"
                alt={wallet.logo?.alt}
                src={wallet.logo?.src}
              />
              <div className="flex items-center  text-ztg-18-150">
                {wallet.title}
              </div>
              {!wallet.installed && wallet.extensionName !== "web3auth" && (
                <div className="ml-auto">
                  <Download size={24} />
                </div>
              )}
              {hasError && (
                <div className="ml-auto w-ztg-275  text-ztg-12-120 text-vermilion">
                  {error.type === "NoAccounts" &&
                    "No accounts on this wallet. Please add account in wallet extension."}
                  {error.type === "InteractionDenied" &&
                    "Not allowed to interact with extension. Please change permission settings."}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WalletSelect;
