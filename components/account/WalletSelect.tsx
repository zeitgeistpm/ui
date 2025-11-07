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
import { AlertCircle } from "react-feather";

import { useEffect } from "react";

const WalletSelect = () => {
  const { selectWallet, errors, accounts, connected, walletId } = useWallet();

  const accountModals = useAccountModals();

  const wasConnected = usePrevious(connected);

  const handleSelectWallet = async (wallet: BaseDotsamaWallet | Wallet) => {
    if (!wallet.installed && wallet.extensionName !== "web3auth") {
      window.open(wallet.installUrl);
    } else {
      try {
        selectWallet(wallet.extensionName);
        // Don't close immediately - wait for connection to succeed or fail
        // The useEffect below will handle closing/opening account select modal
      } catch (error) {
        console.error("Failed to select wallet:", error);
        // Keep modal open on error so user can try again
      }
    }
  };

  useEffect(() => {
    // Only close wallet select modal when connection succeeds with accounts
    if (
      !wasConnected &&
      connected &&
      accounts.length > 0 &&
      walletId !== "web3auth"
    ) {
      // Connection successful - close wallet select and open account select
      accountModals.closeWalletSelect();
      accountModals.openAccountSelect();
    } else if (
      !wasConnected &&
      connected &&
      accounts.length > 0 &&
      walletId === "web3auth"
    ) {
      // Web3Auth doesn't need account selection
      accountModals.closeWalletSelect();
    }
    // If there are errors but we're not connected, keep modal open
  }, [
    wasConnected,
    connected,
    accounts.length,
    walletId,
    errors,
    accountModals,
  ]);

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

  const hasInstalledWallets = supportedWallets.some(
    (w) => w.extensionName !== "web3auth" && w.installed,
  );

  return (
    <div className="flex flex-col">
      <h3 className="mb-5 text-lg font-bold text-white">Connect Wallet</h3>

      {/* Social Login Section */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-white/90">
          Quick Connect
        </h4>
        <Web3wallet />
      </div>

      {/* Divider */}
      <div className="relative mb-6 flex items-center">
        <div className="h-px flex-1 bg-white/10"></div>
        <span className="px-3 text-xs font-medium text-white/60">or</span>
        <div className="h-px flex-1 bg-white/10"></div>
      </div>

      {/* Crypto Wallets Section */}
      <div>
        <h4 className="mb-4 text-sm font-semibold text-white/90">
          {hasInstalledWallets ? "Browser Extension" : "Install Extension"}
        </h4>
        {isMobileDevice ? (
          <div className="w-full space-y-3">
            <Link
              href="https://novawallet.io/"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border-2 border-white/10 bg-white/10 px-4 py-3 shadow-sm backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/20 hover:shadow-md"
              target="_blank"
            >
              <Image
                src="/icons/nova.png"
                alt={"Nova Wallet"}
                width={32}
                height={32}
                quality={100}
              />
              <div className="flex flex-col items-start">
                <div className="text-sm font-semibold text-white/90">
                  Nova Wallet
                </div>
                <div className="text-xs text-white/60">Mobile wallet</div>
              </div>
            </Link>
            <div className="rounded-lg border-2 border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div className="mb-3">
                <span className="text-xs font-semibold text-white/90">
                  Quick Start
                </span>
              </div>
              <ol className="space-y-2 text-xs leading-relaxed text-white/80">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/70">
                    1
                  </span>
                  <span>Open Nova Wallet app on your mobile device</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/70">
                    2
                  </span>
                  <span>Navigate to "Browser" on the bottom menu</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/70">
                    3
                  </span>
                  <span>Search for and select "Zeitgeist"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/70">
                    4
                  </span>
                  <span>
                    Press "Connect Wallet" and allow access when prompted
                  </span>
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

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mt-4 space-y-2">
            {errors.map((error, index) => (
              <div
                key={index}
                className="flex items-start gap-2.5 rounded-lg border border-ztg-red-500/40 bg-ztg-red-900/20 p-3 backdrop-blur-sm"
              >
                <AlertCircle
                  className="mt-0.5 shrink-0 text-ztg-red-400"
                  size={16}
                  strokeWidth={2}
                />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-ztg-red-300">
                    {error.extensionName}
                  </div>
                  <div className="mt-1 text-xs text-ztg-red-400/80">
                    {error.type === "NoAccounts" &&
                      "No accounts found. Please add an account in your wallet extension."}
                    {error.type === "InteractionDenied" &&
                      "Permission denied. Please update your wallet extension settings."}
                    {error.type !== "NoAccounts" &&
                      error.type !== "InteractionDenied" &&
                      "Connection error. Please try again."}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletSelect;
