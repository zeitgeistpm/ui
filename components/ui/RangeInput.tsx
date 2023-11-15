import React, { ChangeEventHandler, useRef } from "react";
import Input from "./Input";

export type RangeInputProps = {
  minLabel?: string;
  maxLabel?: string;
  valueSuffix?: string;
  onValueChange?: (val: string) => void;
} & React.HTMLProps<HTMLInputElement>;

const RangeInput = React.forwardRef(
  (
    {
      maxLabel,
      minLabel,
      valueSuffix = "",
      onValueChange,
      ...rest
    }: RangeInputProps,
    ref: React.ForwardedRef<HTMLInputElement | null>,
  ) => {
    const componentRef = useRef<HTMLDivElement | null>(null);
    const { value = 0, onChange, min = 0, max = 0 } = rest;

    const className = rest.className ?? "";

    const change: ChangeEventHandler<HTMLInputElement> = (e) => {
      onValueChange && onValueChange(e.target.value);
      onChange && onChange(e);
    };

    const percentage = (+value - +min) / (+max - +min);

    const width = componentRef?.current?.clientWidth ?? 0;

    const minVisible = percentage > 0.1;
    const maxVisible = percentage < 0.9;

    return (
      <div className={`relative overflow-hidden`} ref={componentRef}>
        <Input
          type="range"
          {...rest}
          ref={(instance) => {
            if (typeof ref === "function") {
              ref(instance);
            } else if (ref) {
              ref.current = instance;
            }
          }}
          onChange={change}
          className={`w-full !px-0 !py-0`}
        />
        <div className="w-full justify-between">
          <div
            className="text-ztg-14-150 text-black"
            style={{
              left: `${percentage * (width - 40)}px`,
              width: "100px",
              position: "absolute",
              overflow: "hidden",
            }}
          >
            {value} {valueSuffix}
          </div>
          <div className="mt-[8px] flex w-full justify-between">
            <div className="text-ztg-14-150 text-black">
              {minVisible ? minLabel : ""}
            </div>
            <div className="text-ztg-14-150 text-black">
              {maxVisible ? maxLabel : ""}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default RangeInput;
