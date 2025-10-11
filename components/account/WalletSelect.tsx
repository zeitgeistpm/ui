import { BaseDotsamaWallet, Wallet } from "@talismn/connect-wallets";
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

const WalletSelect = () => {
  const { selectWallet, errors, accounts, connected, walletId } = useWallet();

  const accountModals = useAccountModals();

  const wasConnected = usePrevious(connected);

  const handleSelectWallet = async (wallet: BaseDotsamaWallet | Wallet) => {
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
      <h3 className="mb-4 text-lg font-bold text-sky-900">Wallet Select</h3>
      <Web3wallet />
      <div className="mt-5">
        <h3 className="mb-3 text-base font-semibold text-sky-900">
          Crypto Wallets
        </h3>
        {isMobileDevice ? (
          <div className="w-full">
            <Link
              href="https://novawallet.io/"
              className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-sky-200/30 bg-white/80 px-3 py-2 shadow-sm backdrop-blur-sm transition-all hover:border-sky-300/50 hover:bg-sky-50/80 hover:shadow-md"
              target="_blank"
            >
              <Image
                src="/icons/nova.png"
                alt={"Nova Wallet"}
                width={28}
                height={28}
                quality={100}
              />
              <div className="text-sm font-semibold text-sky-900">
                Nova Wallet
              </div>
            </Link>
            <div className="mt-3 rounded-lg border border-sky-200/30 bg-sky-50/50 p-3 backdrop-blur-sm">
              <span className="mb-2 block text-sm font-semibold text-sky-900">
                Nova Wallet instructions:
              </span>
              <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-sky-700">
                <li>Open Nova Wallet app on your mobile device.</li>
                <li>Navigate to "Browser" on the bottom menu.</li>
                <li>Search for and select "Zeitgeist".</li>
                <li>
                  Once inside Zeitgeist: press "Connect Wallet" in the top menu
                  and allow access when prompted.
                </li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {supportedWallets
              .filter((w) => w.extensionName !== "web3auth")
              .map((wallet) => {
                const error = errors.find(
                  (e) => e.extensionName === wallet.extensionName,
                );
                const hasError = error != null;
                return (
                  <WalletIcon
                    key={wallet.extensionName}
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
        )}
      </div>
    </div>
  );
};

export default WalletSelect;
