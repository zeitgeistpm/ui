import Image from "next/image";

interface WalletIconProps {
  extensionName: string;
  logoAlt: string;
  logoSrc: string;
  onClick?: () => void;
  hasError?: boolean;
  error?: any;
  className?: string;
}

const WalletIcon = ({
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
      className="flex h-[56px] flex-1 cursor-pointer flex-row items-center justify-center rounded-md border bg-mystic hover:bg-gray-100"
      onClick={onClick}
    >
      <Image
        className={`center ${className}`}
        width={40}
        height={40}
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
