import { useAccountModals } from "lib/hooks/account";
import { useStore } from "lib/stores/Store";
import {
  supportedWallets,
  useWallet,
  WalletErrorMessage,
} from "lib/state/wallet";
import { Wallet } from "lib/wallets/types";
import { flowResult } from "mobx";
import { observer } from "mobx-react";
import { useEffect } from "react";
import { Download } from "react-feather";

const WalletSelect = observer(() => {
  const store = useStore();
  const { selectWallet: connectWallet, errorMessages } = useWallet();
  const accountModals = useAccountModals();

  const selectWallet = async (wallet: Wallet) => {
    if (!wallet.installed) {
      window.open(wallet.installUrl);
    } else {
      try {
        await connectWallet(wallet.extensionName);

        if (errorMessages.length > 0) {
          accountModals.openAccontSelect();
        }
      } catch (err) {
        console.log(err);
      }
    }
  };

  return (
    <div className="flex flex-col">
      {supportedWallets.map((wallet, idx) => {
        const error = errorMessages.find(
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
                selectWallet(wallet);
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
                  {error.message}
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
