import React, { FC, PropsWithChildren } from "react";

const TradeTab: FC<
  PropsWithChildren<{ selected: boolean; className: string }>
> = React.forwardRef(
  (
    { children, selected, className, ...rest },
    ref: React.ForwardedRef<HTMLDivElement>,
  ) => {
    const classes = `block font-medium cursor-pointer h-full center w-1/2 outline-0 text-ztg-18-150 transition-all ${
      className ?? ""
    } ${
      selected
        ? "bg-ztg-blue font-bold text-white"
        : "text-pastel-blue bg-[#CCE0F4]"
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
