import { isMoment, Moment } from "moment";
import React, {
  ChangeEventHandler,
  FC,
  InputHTMLAttributes,
  useMemo,
  useRef,
} from "react";
import DateTime from "react-datetime";
import { Calendar } from "react-feather";

interface InputProps {
  placeholder?: string;
  type: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  min?: number;
  max?: number;
  step?: number;
  value?: string;
  ref?: React.Ref<HTMLInputElement>;
}

const inputClasses =
  "bg-gray-100 dark:bg-black text-ztg-14-150 w-full rounded-lg h-ztg-40 p-ztg-8  focus:outline-none dark:border-black text-black dark:text-white";
const invalidClasses = "!border-vermilion !text-vermilion";

const Input: FC<InputProps & InputHTMLAttributes<HTMLInputElement>> =
  React.forwardRef<
    HTMLInputElement,
    InputProps & InputHTMLAttributes<HTMLInputElement>
  >(
    (
      {
        placeholder = "",
        type,
        onChange,
        min,
        max,
        step,
        value,
        className = "",
        ...restProps
      },
      ref,
    ) => {
      const { name, ...rest } = restProps;

      return (
        <input
          {...rest}
          ref={ref}
          name={name}
          className={`${inputClasses} ${className}`}
          placeholder={placeholder}
          type={type}
          onChange={onChange}
          onBlur={(e) => {
            rest.onBlur && rest.onBlur(e);
          }}
          min={min}
          max={max}
          step={step}
          value={value}
          onWheel={(event) => {
            if (type === "number") event.currentTarget.blur();
          }}
        />
      );
    },
  );

const rdtpInput = (
  props: InputProps & InputHTMLAttributes<HTMLInputElement>,
  openCalendar: () => void,
) => {
  const { className, ...restProps } = props;
  return (
    <div
      className={"flex rounded-ztg-5 border-1 border-transparent " + className}
    >
      <Input
        {...restProps}
        type="text"
        onClick={openCalendar}
        className="mb-0 cursor-pointer rounded-r-none pl-ztg-23 pr-ztg-8"
        readOnly
      />
      <div
        className="center h-ztg-40 w-ztg-40 flex-shrink-0 cursor-pointer rounded-r-ztg-5 border-l-1 bg-gray-100 dark:bg-black"
        data-test="calendarIcon"
        onClick={openCalendar}
      >
        <Calendar size={16} className="text-sky-600" />
      </div>
    </div>
  );
};

const getDateFromTimestamp = (timestamp?: string) => {
  const ts = Number(timestamp) || new Date().valueOf();
  return new Date(ts);
};

const getLocalDateFormat = () => {
  const formatObj = new Intl.DateTimeFormat().formatToParts(new Date());

  return formatObj
    .map((obj) => {
      switch (obj.type) {
        case "day":
          return "DD";
        case "month":
          return "MM";
        case "year":
          return "YYYY";
        default:
          return obj.value;
      }
    })
    .join("");
};

export const DateTimeInput: FC<{
  timestamp?: string;
  className?: string;
  onChange: (timestamp: string) => void;
  isValidDate?: (currentDate: Moment) => boolean;
}> = ({ className = "", onChange, timestamp, isValidDate }) => {
  const ref = useRef(null);
  const date = useMemo<Date>(() => {
    return getDateFromTimestamp(timestamp);
  }, [timestamp]);

  const dateChange = (v: Moment | string) => {
    if (isMoment(v)) {
      onChange(`${v.valueOf()}`);
    }
  };
  const localDateFormat = getLocalDateFormat();

  return (
    <DateTime
      value={date}
      renderInput={rdtpInput}
      inputProps={{ ref }}
      onChange={dateChange}
      dateFormat={localDateFormat}
      className={className}
      isValidDate={isValidDate}
    />
  );
};
