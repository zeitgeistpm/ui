import { BaseDotsamaWallet } from "@talismn/connect-wallets";
import { useAccountModals } from "lib/state/account";
import { usePrevious } from "lib/hooks/usePrevious";
import { supportedWallets, useWallet } from "lib/state/wallet";
import Web3wallet from "components/web3wallet";
import WalletIcon from "./WalletIcon";
import Image from "next/image";
import { isWSX } from "lib/constants";
import { useEffect } from "react";

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

  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  return (
    <div className="flex w-full flex-col p-4">
      <h3 className="mb-4 text-center text-lg font-bold">
        Log in to {isWSX ? "WSX" : "Zeitgeist"}
      </h3>
      <p className="mx-auto mb-4 max-w-[250px] text-center text-sm">
        connect using a social account
      </p>
      <Web3wallet />
      <div className="text-s py-4 text-center text-sm">
        <p>or using your own wallet</p>
      </div>
      <div className="flex justify-between gap-6">
        {isMobileDevice ? (
          <a
            href="https://novawallet.io/"
            className="flex h-[56px] w-full items-center justify-center rounded-md border text-center"
          >
            <Image
              src="/icons/nova.png"
              alt={"wallet.logo.alt"}
              width={30}
              height={30}
              quality={100}
            />
            <div className="relative ml-4 font-medium">
              <span>Nova Wallet</span>
            </div>
          </a>
        ) : (
          supportedWallets
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
            })
        )}
      </div>
    </div>
  );
};

export default WalletSelect;
