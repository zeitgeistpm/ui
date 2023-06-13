export type LoaderProps = {
  className?: string;
  loading?: boolean;
  gradient?: [string, string];
  lineThrough?: boolean;
};

export const Loader = ({
  className,
  loading,
  gradient,
  lineThrough,
}: LoaderProps) => {
  return (
    <div className={`relative bg-inherit rounded-full ${className}`}>
      <div
        className={`h-full w-full rounded-full  z-10 ${
          loading && "animate-spin"
        }`}
        style={{
          background: `linear-gradient(218deg, ${
            gradient?.[0] ?? "rgba(0,0,0,0.2)"
          } 35%, ${gradient?.[1] ?? "rgba(0,0,0,0.1)"} 100%)`,
        }}
      ></div>
      <div
        className="absolute center top-[6%] left-[6%] h-[88%] w-88% bg-inherit rounded-full z-20 "
        style={{
          maskOrigin: "content-box",
        }}
      >
        {lineThrough && (
          <div
            className="absolute, top-0 left-0 w-[8%] h-[102%] rotate-45 bg-red"
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
