import { useUserStore } from "lib/stores/UserStore";
import { observer } from "mobx-react";
import { forwardRef, useMemo } from "react";
import ReactSelect from "react-select";

interface SelectProps {
  options: any[];
  className?: string;
  onChange: (value: any) => void;
  value: any;
}

const Select = observer(
  forwardRef<any, SelectProps>(
    ({ options, className = "", onChange, value, ...rest }, ref) => {
      const userStore = useUserStore();

      const customStyles = useMemo(
        () => ({
          option: (provided, state) => ({
            ...provided,
            fontWeight: 400,
            fontSize: "14px",
            "&:hover": {
              backgroundColor: userStore.theme === "dark" ? "black" : "white",
              color: "#748296",
            },
            backgroundColor: state.isSelected
              ? "#0001FE"
              : userStore.theme === "dark"
              ? "#11161F"
              : "#D9E3EE",
            color: state.isSelected ? "white" : "#748296",
          }),
          control: (provided, state) => ({
            ...provided,
            fontWeight: 400,
            fontSize: "14px",
            color: "#748296",
            backgroundColor: userStore.theme === "dark" ? "#11161F" : "#D9E3EE",
            height: 40,
            border: 0,
          }),
          menu: (provided, state) => ({
            ...provided,
            fontWeight: 400,
            fontSize: "14px",
            color: "#748296",
            backgroundColor: userStore.theme === "dark" ? "#11161F" : "#D9E3EE",
          }),
          singleValue: (provided, state) => ({
            ...provided,
            fontWeight: 400,
            fontSize: "14px",
            color: "#748296",
            backgroundColor: userStore.theme === "dark" ? "#11161F" : "#D9E3EE",
          }),
          dropdownIndicator: () => ({
            color: "#748296",
            margin: "0 10px 0 0",
          }),
        }),
        [userStore.theme]
      );

      return (
        <ReactSelect
          options={options}
          className={className}
          onChange={onChange}
          value={value}
          styles={customStyles}
          components={{
            IndicatorSeparator: () => null,
          }}
          ref={ref}
          {...rest}
        />
      );
    }
  )
);

export default Select;
