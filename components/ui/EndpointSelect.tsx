import { EndpointOption } from "lib/types";
import React from "react";
import ReactSelect from "react-select";

const EndpointSelect = React.forwardRef(
  (
    {
      options,
      value,
      onChange,
    }: {
      value: EndpointOption;
      options: EndpointOption[];
      onChange: (v: EndpointOption) => void;
    },
    ref: React.ForwardedRef<any>,
  ) => {
    return (
      <ReactSelect
        ref={ref}
        className="w-1/3 mr-ztg-3"
        onChange={onChange}
        value={value}
        options={options}
      />
    );
  },
);

export default EndpointSelect;
