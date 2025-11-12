import { Transition } from "@headlessui/react";
import DiscordIcon from "components/icons/DiscordIcon";
import TwitterIcon from "components/icons/TwitterIcon";
import SettingsModal from "components/settings/SettingsModal";
import Avatar from "components/ui/Avatar";
import Skeleton from "components/ui/Skeleton";
import { useIdentity } from "lib/hooks/queries/useIdentity";
import { useWallet } from "lib/state/wallet";
import { shortenAddress, formatNumberLocalized } from "lib/util";
import { useState, useMemo } from "react";
import { FaNetworkWired, FaUserCheck } from "react-icons/fa";
import { ExternalLink } from "react-feather";
import Link from "next/link";
import { ZTG } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { PorfolioBreakdown } from "lib/hooks/queries/usePortfolioPositions";
import { useAccountAmm2Pool } from "lib/hooks/queries/useAccountAmm2Pools";

export type PortfolioHeaderProps =
  | {
      loading: true;
      address: string;
    }
  | (PorfolioBreakdown & { address: string });

const PortfolioHeader = (props: PortfolioHeaderProps) => {
  const { address } = props;
  const wallet = useWallet();
  const { data: identity } = useIdentity(address);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { data: pools, isLoading: poolIsLoading } = useAccountAmm2Pool(address);

  const proxy = wallet.getProxyFor(wallet.activeAccount?.address);
  const isProxying = Boolean(
    proxy && proxy.enabled && proxy.address === address,
  );

  let hasIdentity = Boolean(identity?.displayName);
  let isOwned = false;
  let name = identity?.displayName;

  if (!name) {
    const ownedAccount = wallet.accounts.find((a) => a.address === address);
    if (ownedAccount) {
      isOwned = true;
      name = ownedAccount.name;
    } else {
      name = shortenAddress(address);
    }
  }

  const poolZtgTotal = pools?.reduce<Decimal>((total, pool) => {
    // Filter out NaN values
    if (pool.addressZtgValue && !pool.addressZtgValue.isNaN()) {
      return total.plus(pool.addressZtgValue);
    }
    return total;
  }, new Decimal(0));

  const isLoading = "loading" in props;

  return (
    <>
      <div className="mb-6 rounded-lg border border-ztg-primary-200/30 bg-white/10 p-3 shadow-lg backdrop-blur-md transition-all md:p-4">
        {/* Identity Section */}
        <div className="mb-4 flex flex-col gap-3 border-b-2 border-ztg-green-500/40 pb-4 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <Avatar address={address} size={56} />
          </div>

          <div className="flex flex-1 flex-col gap-1.5">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                {isOwned && !hasIdentity && (
                  <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-ztg-green-500">
                    Wallet Name
                  </div>
                )}
                {isOwned && hasIdentity && (
                  <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-ztg-green-500">
                    On-Chain Identity
                  </div>
                )}
                <h1 className="text-xl font-bold text-white sm:text-2xl">
                  {name}
                </h1>
              </div>

              {isOwned && !hasIdentity && (
                <button
                  className="flex items-center gap-1.5 rounded-md bg-ztg-primary-300 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm transition-all hover:bg-ztg-green-600 hover:shadow-md"
                  onClick={() => setShowSettingsModal(true)}
                >
                  <FaUserCheck size={14} />
                  <span>Set Identity</span>
                </button>
              )}
            </div>

            {/* Address */}
            <Link
              className="flex items-center gap-1 text-xs text-white/70 transition-all hover:text-white/90"
              href={`https://zeitgeist.subscan.io/account/${address}`}
              target="_blank"
            >
              <span className="hidden sm:inline">{address}</span>
              <span className="sm:hidden">
                {shortenAddress(address, 12, 26)}
              </span>
              <ExternalLink className="flex-none" size={12} />
            </Link>

            {/* Social & Status Badges */}
            <div className="flex flex-wrap gap-1.5">
              {identity?.twitter && (
                <a
                  className="flex items-center gap-1 rounded-md bg-twitter px-2 py-1 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md"
                  href={`https://twitter.com/${identity.twitter}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <TwitterIcon fill="white" />
                  <span>{identity.twitter}</span>
                </a>
              )}
              {identity?.discord && (
                <div className="flex items-center gap-1 rounded-md bg-discord px-2 py-1 text-xs font-semibold text-white shadow-sm">
                  <DiscordIcon fill="white" />
                  <span>{identity.discord}</span>
                </div>
              )}
              <Transition
                enter="transition-opacity duration-250"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition-opacity duration-250"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                show={isProxying}
              >
                <div className="flex items-center gap-1 rounded-md bg-purple-600 px-2 py-1 text-xs font-semibold text-white shadow-sm">
                  <FaNetworkWired size={14} />
                  <span>Proxy</span>
                </div>
              </Transition>
            </div>
          </div>
        </div>

        {/* Portfolio Breakdown Section */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {/* Total Value */}
          {isLoading ? (
            <StatSkeleton />
          ) : (
            <StatCard
              title="Total Value"
              value={props.total.value}
              usdZtgPrice={props.usdZtgPrice}
              changePercentage={props.total.changePercentage}
            />
          )}

          {/* Trading Positions */}
          {isLoading ? (
            <StatSkeleton />
          ) : (
            <StatCard
              title="Trading Positions"
              value={props.tradingPositions.value}
              usdZtgPrice={props.usdZtgPrice}
              changePercentage={props.tradingPositions.changePercentage}
            />
          )}

          {/* Liquidity */}
          {isLoading || poolIsLoading ? (
            <StatSkeleton />
          ) : (
            <StatCard
              title="Liquidity"
              value={poolZtgTotal?.mul(ZTG) ?? new Decimal(0)}
              usdZtgPrice={props.usdZtgPrice}
              changePercentage={0}
            />
          )}

          {/* Bonded */}
          {isLoading ? (
            <StatSkeleton />
          ) : (
            <StatCard
              title="Bonded"
              value={props.bonded.value}
              usdZtgPrice={props.usdZtgPrice}
              changePercentage={props.bonded.changePercentage}
            />
          )}
        </div>
      </div>

      <SettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
};

type StatCardProps = {
  title: string;
  value: Decimal;
  usdZtgPrice?: Decimal;
  changePercentage: number;
};

const StatCard = ({
  title,
  value,
  usdZtgPrice,
  changePercentage,
}: StatCardProps) => {
  // Handle NaN values - display 0 instead
  const displayValue = value.isNaN() ? 0 : value.div(ZTG).toNumber();

  return (
    <div className="rounded-lg border border-ztg-primary-200/20 bg-ztg-primary-900/50 p-3 backdrop-blur-sm transition-all hover:border-ztg-green-500/40 hover:bg-ztg-primary-900/70 hover:shadow-md">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/80">
        {title}
      </h3>
      <div className="mb-0.5 flex items-baseline gap-1.5">
        <div className="text-base font-bold text-white sm:text-lg">
          {formatNumberLocalized(displayValue)}
        </div>
        <div className="text-xs font-semibold text-white/90">ZTG</div>
      </div>
      <div className="flex items-center justify-between gap-1">
        {/* USD price display commented out - showing only base currency */}
        {/* <div className="text-xs text-white/90">
          $
          {formatNumberLocalized(
            usdZtgPrice?.mul(value.div(ZTG)).toNumber() ?? 0,
          )}
        </div> */}
        {/* 24hr change percentage display disabled */}
        {/* {changePercentage !== 0 && (
          <div
            className={`text-xs font-semibold ${
              changePercentage < 0 ? "text-ztg-red-400" : "text-ztg-green-500"
            }`}
          >
            {changePercentage > 0 ? "+" : ""}
            {changePercentage.toFixed(1)}%
          </div>
        )} */}
      </div>
    </div>
  );
};

const StatSkeleton = () => {
  const dimensions = useMemo(
    () => ({
      title: 90,
      value: 100,
      usd: 70,
    }),
    [],
  );

  return (
    <div className="rounded-md bg-ztg-primary-600/20 p-4">
      <div className="mb-1">
        <Skeleton width={dimensions.title} height={14} />
      </div>
      <div className="mb-0.5">
        <Skeleton width={dimensions.value} height={20} />
      </div>
      <div>
        <Skeleton width={dimensions.usd} height={14} />
      </div>
    </div>
  );
};

export default PortfolioHeader;
