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
        className={`flex w-full cursor-pointer items-center justify-center rounded-lg border px-3 shadow-sm backdrop-blur-sm transition-all ${
          hasError
            ? "border-red-200/50 bg-red-50/80 hover:border-red-300/70 hover:bg-red-100/80"
            : "border-sky-200/30 bg-white/80 hover:border-sky-300/50 hover:bg-sky-50/80 hover:shadow-md"
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
        <div className="rounded-lg border border-red-200/50 bg-red-50/80 p-2 text-xs leading-tight text-red-700">
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
