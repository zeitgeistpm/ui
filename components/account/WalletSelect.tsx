import { useAccountModals } from "lib/hooks/account";
import { usePrevious } from "lib/hooks/usePrevious";
import { supportedWallets, useWallet } from "lib/state/wallet";
import { Wallet } from "lib/wallets/types";
import { observer } from "mobx-react";
import { useEffect } from "react";
import { Download } from "react-feather";

const WalletSelect = observer(() => {
  const { selectWallet, errors, accounts, connected } = useWallet();
  const accountModals = useAccountModals();

  const wasConnected = usePrevious(connected);

  const handleSelectWallet = async (wallet: Wallet) => {
    if (!wallet.installed) {
      window.open(wallet.installUrl);
    } else {
      selectWallet(wallet.extensionName);
    }
  };

  useEffect(() => {
    if (!wasConnected && connected && accounts.length) {
      accountModals.openAccontSelect();
    }
  }, [wasConnected, connected, accounts, errors]);

  return (
    <div className="flex flex-col">
      {supportedWallets.map((wallet, idx) => {
        const error = errors.find(
          (e) => e.extensionName === wallet.extensionName,
        );
        const hasError = error != null;
        return (
          <div key={wallet.extensionName}>
            <div
              className={
                "flex flex-row h-ztg-64 items-center rounded-ztg-12 bg-sky-100 dark:bg-sky-700 px-ztg-12 cursor-pointer " +
                (idx < 2 ? "mb-ztg-12 " : "")
              }
              onClick={() => {
                handleSelectWallet(wallet);
              }}
            >
              <img
                className="w-ztg-32 h-ztg-32 text-ztg-12-120 center mr-ztg-10"
                alt={wallet.logo.alt}
                src={wallet.logo.src}
              />
              <div className="flex items-center  text-ztg-18-150">
                {wallet.title}
              </div>
              {!wallet.installed && (
                <div className="ml-auto">
                  <Download size={24} />
                </div>
              )}
              {hasError && (
                <div className="text-vermilion ml-auto  text-ztg-12-120 w-ztg-275">
                  {error.type === "NoAccounts"
                    ? "No accounts on this wallet. Please add account in wallet extension."
                    : "Not allowed to interact with extension. Please change permission settings."}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default WalletSelect;
