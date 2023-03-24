import { Skeleton } from "@material-ui/lab";
import { formatNumberCompact } from "lib/util/format-compact";
import { hasDatePassed } from "lib/util/hasDatePassed";
import { FC, PropsWithChildren } from "react";

const HeaderStat: FC<PropsWithChildren<{ label: string; border?: boolean }>> =
  ({ label, border = true, children }) => {
    return (
      <div className={border ? "sm:border-r sm:border-ztg-blue pr-2" : ""}>
        <span>{label}: </span>
        <span className="font-medium">{children}</span>
      </div>
    );
  };

const Tag: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return (
    <span className={`px-2.5 py-1 rounded bg-gray-300 ${className}`}>
      {children}
    </span>
  );
};

const MarketHeader: FC<{
  question: string;
  status: string;
  tags: string[];
  starts: number;
  ends: number;
  prizePool: number;
  subsidy: number;
  volume: number;
  token: string;
}> = ({
  question,
  status,
  tags,
  starts,
  ends,
  prizePool,
  subsidy,
  volume,
  token,
}) => {
  return (
    <header className="text-center">
      <h1 className="text-4xl my-5">{question}</h1>
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-2 mb-5">
        <HeaderStat label={hasDatePassed(starts) ? "Started" : "Starts"}>
          {new Intl.DateTimeFormat("default", {
            dateStyle: "medium",
          }).format(starts)}
        </HeaderStat>
        <HeaderStat label={hasDatePassed(ends) ? "Ended" : "Ends"}>
          {new Intl.DateTimeFormat("default", {
            dateStyle: "medium",
          }).format(ends)}
        </HeaderStat>
        {token ? (
          <HeaderStat label="Volume">
            {formatNumberCompact(volume)}
            &nbsp;
            {token}
          </HeaderStat>
        ) : (
          <Skeleton width="150px" height="24px" />
        )}
        {prizePool >= 0 && token ? (
          <HeaderStat label="Prize Pool">
            {formatNumberCompact(prizePool)}
            &nbsp;
            {token}
          </HeaderStat>
        ) : (
          <Skeleton width="150px" height="24px" />
        )}
        {subsidy >= 0 && token ? (
          <HeaderStat label="Subsidy" border={false}>
            {formatNumberCompact(subsidy)}
            &nbsp;
            {token}
          </HeaderStat>
        ) : (
          <Skeleton width="150px" height="24px" />
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-2.5">
        <Tag className={`${status === "Active" && "!bg-green-lighter"}`}>
          {status === "Active" && <span className="text-green">&#x2713; </span>}
          {status}
        </Tag>
        {tags?.map((tag, index) => {
          return <Tag key={index}>{tag}</Tag>;
        })}
      </div>
    </header>
  );
};

export default MarketHeader;
