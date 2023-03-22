import { Skeleton } from "@material-ui/lab";
import { ZTG } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { PorfolioBreakdown } from "lib/hooks/queries/usePortfolioPositions";
import { formatNumberLocalized } from "lib/util";
import { useMemo } from "react";

export type PortfolioBreakdownProps =
  | {
      /**
       * The breakdown is loading and should render a skeleton.
       */
      loading: true;
    }
  | PorfolioBreakdown;

/**
 * Show a breakdown of an accounts portofolio.
 *
 * @param props PortfolioBreakdownProps
 * @returns JSX.Element
 */
export const PortfolioBreakdown = (props: PortfolioBreakdownProps) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-y-[30px]">
      <div className="flex w-full max-w-[600px] md:border-r-2 md:border-gray-200">
        <div className="flex-1 border-r-2 border-gray-200">
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
        <div className="flex-1 pl-4">
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

      <div className="flex w-full max-w-[600px] md:pl-4">
        <div className="flex-1 border-r-2 border-gray-200">
          {"loading" in props ? (
            <BreakdownSlotSkeleton />
          ) : (
            <BreakdownSlot
              title="Subsidy"
              value={props.subsidy.value}
              usdZtgPrice={props.usdZtgPrice}
              changePercentage={props.subsidy.changePercentage}
            />
          )}
        </div>
        <div className="flex-1 pl-4">
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
  usdZtgPrice: Decimal;
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
      <h4 className="font-medium text-sky-600 text-ztg-12-150 mb-1">{title}</h4>
      <div className="flex text-lg mb-1">
        <div className="w-2/3 font-semibold text-ztg-16-150">
          {formatNumberLocalized(value.div(ZTG).toNumber())} ZTG
        </div>
        <div
          className={`flex-1 w-1/3 text-ztg-14-120 ${
            changePercentage < 0.01
              ? "text-gray-800"
              : changePercentage < 0
              ? "text-red-600"
              : "text-green-500"
          }`}
        >
          {changePercentage.toFixed(1)}%
        </div>
      </div>
      <div className="text-sky-600 mb-1 text-ztg-14-150">
        ${formatNumberLocalized(usdZtgPrice.mul(value.div(ZTG)).toNumber())}
      </div>
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
      <h4 className="text-gray-500 mb-2">
        <Skeleton width={title} height={20} />{" "}
      </h4>
      <div className="flex text-lg mb-2">
        <div className="font-bold w-2/3">
          <Skeleton width={value} height={20} />
        </div>
      </div>
      <div className="text-gray-500 mb-1">
        <Skeleton width={conversion} height={20} />
      </div>
    </>
  );
};
