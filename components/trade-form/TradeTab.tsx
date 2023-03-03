import React, { FC, PropsWithChildren } from "react";

const TradeTab: FC<
  PropsWithChildren<{ selected: boolean; className: string }>
> = React.forwardRef(
  (
    { children, selected, className, ...rest },
    ref: React.ForwardedRef<HTMLDivElement>,
  ) => {
    const classes = `block font-medium cursor-pointer h-full center w-1/2 outline-0 text-ztg-18-150 ${
      className ?? ""
    } ${selected ? "bg-white font-bold" : "bg-anti-flash-white"}`;
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
