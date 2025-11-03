import Avatar from "components/ui/Avatar";
import { useIdentity } from "lib/hooks/queries/useIdentity";
import { shortenAddress } from "lib/util";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

export const UserIdentity: FC<
  PropsWithChildren<{
    user: string;
    shorten?: { start?: number; end?: number };
    className?: string;
  }>
> = ({ user, shorten, className }) => {
  const { data: identity } = useIdentity(user ?? "");
  const displayName =
    identity && identity.displayName?.length !== 0
      ? identity.displayName
      : shortenAddress(user, shorten?.start ?? 10, shorten?.end ?? 10);
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <Avatar address={user} copy={false} size={18} />
      <div className="flex-1 break-all">{displayName}</div>
    </div>
  );
};

export const HeaderStat: FC<
  PropsWithChildren<{ label: string; border?: boolean }>
> = ({ label, border = true, children }) => {
  return (
    <div className={border ? "pr-2 sm:border-r-2 sm:border-ztg-blue" : ""}>
      <span>{label}: </span>
      <span className="font-medium">{children}</span>
    </div>
  );
};

export const Tag: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return (
    <span className={`rounded bg-gray-300 px-2.5 py-1 ${className}`}>
      {children}
    </span>
  );
};

export const CompactCreatorBadge: FC<{ address: string }> = ({ address }) => {
  return (
    <div className="group relative">
      <Link href={`/portfolio/${address}`}>
        <div className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-ztg-primary-100/80 backdrop-blur-sm transition-all hover:scale-110 hover:bg-ztg-primary-200/80 hover:shadow-md">
          <Avatar address={address} copy={false} size={14} />
        </div>
      </Link>
      <div className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
        <div className="rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg">
          <div className="mb-0.5 font-medium">Creator</div>
          <div className="font-mono text-xxs">{address}</div>
        </div>
      </div>
    </div>
  );
};

export const CompactAddress: FC<{ address: string }> = ({ address }) => {
  const { data: identity } = useIdentity(address);
  const displayName =
    identity?.displayName?.length !== 0
      ? identity?.displayName
      : shortenAddress(address, 8, 6);

  return (
    <Link href={`/portfolio/${address}`}>
      <div className="group relative inline-flex items-center gap-1.5 rounded-md bg-white/60 px-2 py-1 backdrop-blur-sm transition-colors hover:bg-white/80">
        <Avatar address={address} copy={false} size={18} />
        <span className="text-xs font-medium text-gray-800">{displayName}</span>
        <div className="absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
          <div className="rounded-md bg-gray-900 px-2 py-1 font-mono text-xs text-white shadow-lg">
            {address}
          </div>
        </div>
      </div>
    </Link>
  );
};
