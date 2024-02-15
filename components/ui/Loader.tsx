import { isString } from "lodash-es";

export type LoaderProps = {
  className?: string;
  loading?: boolean;
  variant?: LoaderVariant | [string, string];
  lineThrough?: boolean;
};

export type LoaderVariant = "Success" | "Info" | "Error" | "Dark" | "Loading";

export const Loader = ({
  className,
  loading,
  variant,
  lineThrough,
}: LoaderProps) => {
  const gradient = isString(variant) ? getGradient(variant) : variant;

  return (
    <div className={`relative rounded-full bg-inherit ${className}`}>
      <div
        className={`z-10 h-full w-full rounded-full ${
          loading && "animate-spin"
        }`}
        style={{
          background: `linear-gradient(218deg, ${
            gradient?.[0] ?? "rgba(0,0,0,0.2)"
          } 35%, ${gradient?.[1] ?? "rgba(0,0,0,0.1)"} 100%)`,
        }}
      ></div>
      <div className="center absolute left-0 top-0 z-20 h-full w-full scale-[0.84] rounded-full bg-inherit">
        {lineThrough && (
          <div
            className="absolute, left-0 top-0 h-[102%] w-[6%] rotate-45 bg-red"
            style={{
              background: `linear-gradient(218deg, ${
                gradient?.[0] ?? "rgba(0,0,0,0.2)"
              } 35%, ${gradient?.[1] ?? "rgba(0,0,0,0.1)"} 100%)`,
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
      return ["#31C48D", "#ADFF00"];
    case "Info":
      return ["#31A1C4", "#00F0FF"];
    case "Error":
      return ["#C43131", "#FF6B00"];
    case "Dark":
      return ["rgb(10,10,10, 0.35)", "rgba(10,10,10, 0.85)"];
    case "Loading":
      return ["#0071bc", "white"];
  }
};
