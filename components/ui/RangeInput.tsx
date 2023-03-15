import React, { ChangeEventHandler, useRef } from "react";

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
    ref: React.Ref<HTMLInputElement>,
  ) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const { value, onChange, min, max } = rest;

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
      <div
        className={`relative overflow-hidden ${className}`}
        ref={componentRef}
      >
        <input
          ref={ref}
          type="range"
          {...rest}
          onChange={change}
          className={`w-full`}
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
          <div className="flex w-full justify-between mt-[8px]">
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
