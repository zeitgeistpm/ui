import { BaseDotsamaWallet } from "@talismn/connect-wallets";
import { useAccountModals } from "lib/state/account";
import { usePrevious } from "lib/hooks/usePrevious";
import { supportedWallets, useWallet } from "lib/state/wallet";
import Web3wallet from "components/web3wallet";
import WalletIcon from "./WalletIcon";
import { getWallets } from "@talismn/connect-wallets";
import { SUPPORTED_WALLET_NAMES } from "lib/constants";
import Image from "next/image";
import Link from "next/link";

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

  const isMobileDevice =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  const hasWallet =
    typeof window !== "undefined" &&
    getWallets().some(
      (wallet) =>
        wallet?.installed &&
        SUPPORTED_WALLET_NAMES.some(
          (walletName) => walletName === wallet.extensionName,
        ),
    );

  return (
    <div className="flex flex-col">
      {hasWallet === true && (
        <>
          <h3 className="mb-4 text-2xl font-bold">Log back in to WSX</h3>
          <p className="mb-4">
            Use one of the following options to log in and start using
            Prediction Markets.
          </p>
        </>
      )}
      <Web3wallet />
      <h3 className="my-4 text-lg font-bold">Crypto Wallet</h3>
      <div className="flex justify-between gap-6">
        {isMobileDevice && !isWSX ? (
          <Link
            href="https://novawallet.io/"
            className="flex h-[56px] w-full items-center justify-center rounded-md border text-center"
            target="_blank"
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
          </Link>
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
