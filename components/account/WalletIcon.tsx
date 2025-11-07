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
    <div className="flex flex-col gap-2">
      <button
        key={extensionName}
        className={`flex w-full cursor-pointer items-center justify-center rounded-lg border-2 px-3 shadow-sm backdrop-blur-sm transition-all ${
          hasError
            ? "border-ztg-red-500/40 bg-ztg-red-900/30 hover:border-ztg-red-500/60 hover:bg-ztg-red-900/50"
            : "border-white/10 bg-white/10 hover:border-white/20 hover:bg-white/20 hover:shadow-md"
        }`}
        style={{
          height: "44px",
          minHeight: "44px",
          maxHeight: "44px",
          lineHeight: "44px",
          padding: "0 12px",
          boxSizing: "border-box",
        }}
        onClick={onClick}
      >
        <div
          style={{
            height: "28px",
            width: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            className={className || ""}
            width={28}
            height={28}
            alt={logoAlt}
            src={logoSrc}
            style={{ height: "28px", width: "28px" }}
          />
        </div>
      </button>
      {hasError && (
        <div className="rounded-lg border-2 border-ztg-red-500/40 bg-ztg-red-900/30 p-2 text-xs leading-tight text-ztg-red-300">
          {error.type === "NoAccounts" &&
            "No accounts on this wallet. Please add account in wallet extension."}
          {error.type === "InteractionDenied" &&
            "Not allowed to interact with extension. Please change permission settings."}
        </div>
      )}
    </div>
  );
};

export default WalletIcon;
