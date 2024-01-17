import { BaseDotsamaWallet } from "@talismn/connect-wallets";
import Image from "next/image";

interface WalletIconProps {
  wallet?: BaseDotsamaWallet;
  extensionName: string;
  logoAlt: string;
  logoSrc: string;
  onClick?: () => void;
  hasError?: boolean;
  error?: any;
  className?: string;
}

const WalletIcon = ({
  wallet,
  logoAlt,
  logoSrc,
  extensionName,
  onClick,
  hasError,
  error,
  className,
}: WalletIconProps) => {
  return (
    <button
      key={extensionName}
      className="flex flex-1 cursor-pointer flex-row items-center justify-center rounded-md border py-1 hover:bg-gray-200"
      onClick={onClick}
    >
      <Image
        className={`center ${className}`}
        width={32}
        height={32}
        alt={logoAlt}
        src={logoSrc}
      />
      {hasError && (
        <div className="ml-auto w-ztg-275  text-ztg-12-120 text-vermilion">
          {error.type === "NoAccounts" &&
            "No accounts on this wallet. Please add account in wallet extension."}
          {error.type === "InteractionDenied" &&
            "Not allowed to interact with extension. Please change permission settings."}
        </div>
      )}
    </button>
  );
};

export default WalletIcon;
