import React, { FC, PropsWithChildren } from "react";

const TradeTab: FC<
  PropsWithChildren<{ selected: boolean; className: string; isSell?: boolean }>
> = React.forwardRef(
  (
    { children, selected, className, isSell, ...rest },
    ref: React.ForwardedRef<HTMLDivElement>,
  ) => {
    const isSellTab =
      isSell ||
      (typeof children === "string" && children.toLowerCase() === "sell");

    const classes = `block font-semibold cursor-pointer h-full center w-1/2 outline-0 text-base md:text-lg transition-all duration-200 ${
      className ?? ""
    } ${
      selected
        ? isSellTab
          ? "bg-ztg-red-600/90 font-bold text-white shadow-lg shadow-black/20 backdrop-blur-sm"
          : "bg-ztg-green-600/90 font-bold text-white shadow-lg shadow-black/20 backdrop-blur-sm"
        : isSellTab
          ? "text-white/80 bg-white/5 hover:bg-white/10"
          : "text-white/80 bg-white/5 hover:bg-white/10"
    }`;
    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);

export enum TradeTabType {
  Buy = 0,
  Sell = 1,
}

export default TradeTab;
