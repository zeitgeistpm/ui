import { useAccountModals } from "lib/hooks/account";
import { useStore } from "lib/stores/Store";
import Wallets, { WalletErrorMessage } from "lib/wallets";
import { Wallet } from "lib/wallets/types";
import { flowResult } from "mobx";
import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import { Download } from "react-feather";

const WalletSelect = observer(() => {
  const store = useStore();
  const { wallets } = store;
  const { errorMessages } = wallets;
  const accountModals = useAccountModals();
  const [selectedWallet, setSelectedWallet] = useState<Wallet | undefined>();

  const onWalletClick = (wallet: Wallet, hasError: boolean) => {
    if (!wallet.installed) {
      window.open(wallet.installUrl);
    } else if (!hasError) {
      setSelectedWallet(wallet);
    }
  };

  useEffect(() => {
    if (!selectedWallet) {
      return;
    }

    wallets.disconnectWallet();

    const walletConnect = flowResult(
      wallets.connectWallet(selectedWallet.extensionName)
    );

    walletConnect.then((errors?: WalletErrorMessage[]) => {
      if (errors == null) {
        accountModals.openAccontSelect();
      } else {
        setSelectedWallet(undefined);
      }
    });

    return () => walletConnect.cancel();
  }, [selectedWallet]);

  return (
    <div className="flex flex-col">
      {Wallets.supportedWallets.map((wallet, idx) => {
        const error = errorMessages.find(
          (e) => e.extensionName === wallet.extensionName
        );
        const hasError = error != null;
        return (
          <div key={wallet.extensionName}>
            <div
              className={
                "flex flex-row h-ztg-64 items-center rounded-ztg-12 bg-sky-100 dark:bg-sky-700 px-ztg-12 " +
                (idx < 2 ? "mb-ztg-12 " : "") +
                (!hasError ? "cursor-pointer" : "")
              }
              onClick={() => {
                onWalletClick(wallet, hasError);
              }}
            >
              <img
                className="w-ztg-32 h-ztg-32 text-ztg-12-120 center mr-ztg-10"
                alt={wallet.logo.alt}
                src={wallet.logo.src}
              />
              <div className="flex items-center font-lato text-ztg-18-150">
                {wallet.title}
              </div>
              {!wallet.installed && (
                <div className="ml-auto">
                  <Download size={24} />
                </div>
              )}
              {hasError && (
                <div className="text-vermilion ml-auto font-lato text-ztg-12-120 w-ztg-275">
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
