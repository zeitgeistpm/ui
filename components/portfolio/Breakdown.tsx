import Skeleton from "components/ui/Skeleton";
import { ZTG } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { PorfolioBreakdown } from "lib/hooks/queries/usePortfolioPositions";
import { formatNumberLocalized } from "lib/util";
import { useMemo } from "react";
import { useAccountAmm2Pool } from "lib/hooks/queries/useAccountAmm2Pools";

export type PortfolioBreakdownProps =
  | {
      /**
       * The breakdown is loading and should render a skeleton.
       */
      loading: true;
      address: string;
    }
  | (PorfolioBreakdown & { address: string });

/**
 * Show a breakdown of an accounts portofolio.
 *
 * @param props PortfolioBreakdownProps
 * @returns JSX.Element
 */
export const PortfolioBreakdown = (props: PortfolioBreakdownProps) => {
  const { data: pools, isLoading: poolIsLoading } = useAccountAmm2Pool(
    props.address,
  );
  const poolZtgTotal = pools?.reduce<Decimal>((total, pool) => {
    return total.plus(pool.addressZtgValue);
  }, new Decimal(0));

  return (
    <div className="rounded-lg bg-white/10 p-3 shadow-lg backdrop-blur-md">
      <div className="overflow-hidden rounded-lg p-3">
        <div className="flex flex-col gap-y-4 md:flex-row">
          <div className="flex w-full md:flex-1 md:border-r-2 md:border-white/10">
            <div className="flex-1 border-r-2 border-white/10 pr-3">
              {"loading" in props ? (
                <BreakdownSlotSkeleton />
              ) : (
                <BreakdownSlot
                  title="Total Value"
                  value={props.total.value}
                  usdZtgPrice={props.usdZtgPrice}
                  changePercentage={props.total.changePercentage}
                />
              )}
            </div>
            <div className="flex-1 pl-3">
              {"loading" in props ? (
                <BreakdownSlotSkeleton />
              ) : (
                <BreakdownSlot
                  title="Trading Positions"
                  value={props.tradingPositions.value}
                  usdZtgPrice={props.usdZtgPrice}
                  changePercentage={props.tradingPositions.changePercentage}
                />
              )}
            </div>
          </div>

          <div className="flex w-full md:flex-1 md:pl-3">
            <div className="flex-1 border-r-2 border-white/10 pr-3">
              {"loading" in props || poolIsLoading ? (
                <BreakdownSlotSkeleton />
              ) : (
                <BreakdownSlot
                  title="Liquidity"
                  value={poolZtgTotal?.mul(ZTG) ?? new Decimal(0)}
                  usdZtgPrice={props.usdZtgPrice}
                  changePercentage={0}
                />
              )}
            </div>
            <div className="flex-1 pl-3">
              {"loading" in props ? (
                <BreakdownSlotSkeleton />
              ) : (
                <BreakdownSlot
                  title="Bonded"
                  value={props.bonded.value}
                  usdZtgPrice={props.usdZtgPrice}
                  changePercentage={props.bonded.changePercentage}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export type BreakdownSlotProps = {
  /**
   * The title of the slot indicating the type of value.
   */
  title: string;
  /**
   * The value of the slot in ztg(planck)
   */
  value: Decimal;
  /**
   * The price of ztg in usd
   */
  usdZtgPrice?: Decimal;
  /**
   * The change in percentage of the value represented.
   */
  changePercentage: number;
};

/**
 * A slot for a portofolio breakdown value.
 *
 * @param props BreakdownSlotProps
 * @returns JSX.Element
 */
export const BreakdownSlot = ({
  title,
  value,
  usdZtgPrice,
  changePercentage,
}: BreakdownSlotProps) => {
  return (
    <>
      <h4 className="mb-0.5 text-xxs font-medium uppercase tracking-wide text-white/80">
        {title}
      </h4>
      <div className="mb-0.5 flex items-center font-mono">
        <div className="text-sm font-bold text-white sm:w-2/3">
          {formatNumberLocalized(value.div(ZTG).toNumber())} ZTG
        </div>
        <div
          className={`hidden w-1/3 flex-1 text-xs sm:block ${
            changePercentage < 0.01
              ? "text-white"
              : changePercentage < 0
                ? "text-red-400"
                : "text-ztg-green-500"
          }`}
        >
          {Math.abs(changePercentage).toFixed(1)}%
        </div>
      </div>
      {/* USD price display commented out - showing only base currency */}
      {/* <div className="font-mono text-xs text-white/90">
        $
        {formatNumberLocalized(
          usdZtgPrice?.mul(value.div(ZTG)).toNumber() ?? 0,
        )}
      </div> */}
    </>
  );
};

/**
 * A skeleton for a breakdown slot that renders closely to how it will look when loaded.
 *
 * @returns JSX.Element
 */
const BreakdownSlotSkeleton = () => {
  const { title, value, conversion } = useMemo(() => {
    return {
      title: 150,
      value: 160,
      conversion: 125,
    };
  }, []);

  return (
    <>
      <h4 className="mb-2">
        <Skeleton width={title} height={20} />{" "}
      </h4>
      <div className="mb-2 flex text-lg">
        <div className="w-2/3 font-bold">
          <Skeleton width={value} height={20} />
        </div>
      </div>
      <div className="mb-1">
        <Skeleton width={conversion} height={20} />
      </div>
    </>
  );
};
