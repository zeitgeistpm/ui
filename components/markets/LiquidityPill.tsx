import Pill from "components/ui/Pill";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { useState } from "react";

export const LiquidityPill = observer(
  ({ liquidity }: { liquidity: number }) => {
    const { config } = useStore();
    const [hoveringInfo, setHoveringInfo] = useState<boolean>(false);

    const handleMouseEnter = () => {
      setHoveringInfo(true);
    };

    const handleMouseLeave = () => {
      setHoveringInfo(false);
    };
    return (
      <div className="relative w-full">
        <Pill
          title="Liquidity"
          value={`${Math.round(liquidity)} ${config.tokenSymbol}`}
        >
          {liquidity < 100 ? (
            <span
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="bg-vermilion text-white rounded-ztg-5 px-ztg-5 ml-ztg-10"
            >
              LOW
            </span>
          ) : (
            <></>
          )}
        </Pill>
        {hoveringInfo === true ? (
          <div className="bg-sky-100 dark:bg-border-dark absolute left-ztg-100 rounded-ztg-10 text-black dark:text-white px-ztg-8 py-ztg-14 font-lato text-ztg-12-150 w-ztg-240">
            This market has low liquidity. Price slippage will be high for small
            trades and larger trades may be impossible
          </div>
        ) : (
          <></>
        )}
      </div>
    );
  },
);

export default LiquidityPill;
