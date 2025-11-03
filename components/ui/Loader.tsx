import { isString } from "lodash-es";
import { BeatLoader } from "react-spinners";

export type LoaderProps = {
  className?: string;
  loading?: boolean;
  variant?: LoaderVariant | [string, string];
  lineThrough?: boolean;
  type?: "circle" | "dots";
};

export type LoaderVariant = "Success" | "Info" | "Error" | "Dark";

export const Loader = ({
  className,
  loading = true,
  variant,
  lineThrough,
  type = "circle",
}: LoaderProps) => {
  const gradient = isString(variant) ? getGradient(variant) : variant;

  // Dotted line loader
  if (type === "dots") {
    const color = variant === "Success"
      ? "#2ccc30"
      : variant === "Error"
      ? "#C43131"
      : variant === "Info"
      ? "#2ccc30"
      : "#2ccc30"; // Default green

    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-white/10 p-3 shadow-sm backdrop-blur-md ${className}`}
      >
        <BeatLoader
          loading={loading}
          color={color}
          size={8}
          margin={4}
          speedMultiplier={0.8}
        />
      </div>
    );
  }

  // Original circle loader
  return (
    <div className={`relative rounded-full bg-inherit ${className}`}>
      <div
        className={`z-10 h-full w-full rounded-full ${
          loading && "animate-spin"
        }`}
        style={{
          background: `linear-gradient(218deg, ${
            gradient?.[0] ?? "rgba(44, 204, 48, 0.6)"
          } 35%, ${gradient?.[1] ?? "rgba(44, 204, 48, 0.8)"} 100%)`,
        }}
      ></div>
      <div className="center absolute left-0 top-0 z-20 h-full w-full scale-[0.84] rounded-full bg-inherit">
        {lineThrough && (
          <div
            className="absolute, left-0 top-0 h-[102%] w-[6%] rotate-45"
            style={{
              background: `linear-gradient(218deg, ${
                gradient?.[0] ?? "rgba(44, 204, 48, 0.6)"
              } 35%, ${gradient?.[1] ?? "rgba(44, 204, 48, 0.8)"} 100%)`,
            }}
          ></div>
        )}
      </div>
    </div>
  );
};

const getGradient = (type: LoaderVariant): [string, string] => {
  switch (type) {
    case "Success":
      return ["rgba(44, 204, 48, 0.6)", "rgba(44, 204, 48, 0.8)"]; // ztg-green-500/60 to ztg-green-500/80
    case "Info":
      return ["rgba(44, 204, 48, 0.6)", "rgba(44, 204, 48, 0.8)"]; // ztg-green-500/60 to ztg-green-500/80
    case "Error":
      return ["#C43131", "#FF6B00"];
    case "Dark":
      return ["rgba(26, 30, 59, 0.35)", "rgba(26, 30, 59, 0.85)"]; // ztg-primary-500 with opacity
  }
};
