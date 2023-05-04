import { useFormField } from "lib/hooks";
import Form from "mobx-react-form";
import { isMoment, Moment } from "moment";
import React, {
  ChangeEventHandler,
  FC,
  FocusEventHandler,
  InputHTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import DateTime from "react-datetime";
import { Calendar } from "react-feather";

interface InputProps {
  form?: Form;
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
  "bg-sky-200 dark:bg-black text-ztg-14-150 w-full rounded-ztg-5 h-ztg-40 p-ztg-8  focus:outline-none border-1 dark:border-black text-black dark:text-white";
const disabledInputClasses =
  "disabled:bg-transparent dark:disabled:bg-transparent disabled:border-sky-200 dark:disabled:border-border-dark ";
const invalidClasses = "!border-vermilion !text-vermilion";

export const Input: FC<InputProps & InputHTMLAttributes<HTMLInputElement>> =
  React.forwardRef<
    HTMLInputElement,
    InputProps & InputHTMLAttributes<HTMLInputElement>
  >(
    (
      {
        form,
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

      const { invalid, formField } = useFormField(form, name, value);

      return (
        <input
          {...rest}
          ref={ref}
          name={name}
          className={`${inputClasses} ${
            invalid ? invalidClasses : ""
          } ${className}`}
          placeholder={placeholder}
          type={type}
          onChange={onChange}
          onBlur={(e) => {
            formField?.onBlur != null && formField?.onBlur(e);
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
      className={"flex border-1 rounded-ztg-5 border-transparent " + className}
    >
      <Input
        {...restProps}
        type="text"
        onClick={openCalendar}
        className="mb-0 pl-ztg-23 pr-ztg-8 rounded-r-none cursor-pointer"
        readOnly
      />
      <div
        className="w-ztg-40 h-ztg-40 border-l-1 border-sky-600 bg-sky-200 dark:bg-black flex-shrink-0 rounded-r-ztg-5 center cursor-pointer"
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
  name?: string;
  isValidDate?: (currentDate: Moment) => boolean;
  form?: Form;
}> = ({ className = "", onChange, timestamp, name, form, isValidDate }) => {
  const ref = useRef();
  const date = useMemo<Date>(() => {
    return getDateFromTimestamp(timestamp);
  }, [timestamp]);
  const { invalid } = useFormField(form, name, timestamp);

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
      inputProps={{ ref, className: `${invalid ? invalidClasses : ""}` }}
      onChange={dateChange}
      dateFormat={localDateFormat}
      className={className}
      isValidDate={isValidDate}
    />
  );
};

export interface AmountInputProps {
  value?: string;
  max?: string;
  min?: string;
  name?: string;
  placeholder?: string;
  onChange?: (val: string) => void;
  className?: string;
  containerClass?: string;
  leftComponent?: JSX.Element;
  rightComponent?: JSX.Element;
  disabled?: boolean;
  form?: any;
  regex?: RegExp;
  isFocused?: boolean;
  onFocusChange?: (focused: boolean) => void;
  ref?: React.Ref<HTMLInputElement>;
  showErrorMessage?: boolean;
}

const prepareVal = (s: string) => {
  if (s === "" || s === "0") {
    return s;
  }
  if (s[0] !== "0" && s[s.length - 1] !== "0") {
    return s;
  }
  if (s === "0.") {
    return s;
  }
  const split = s.split(".");
  const arr1 = split[0].split("");
  let c: string;
  let idx1 = 0;
  for (c of arr1.slice(0, -1)) {
    if (idx1 === arr1.length - 1) {
      break;
    }
    if (c === "0") {
      idx1++;
    } else {
      break;
    }
  }
  if (split.length === 1) {
    return `${arr1.slice(idx1).join("")}`;
  }
  return `${arr1.slice(idx1).join("")}.${split[1]}`;
};
const checkVal = (v: string, amountRegex: RegExp): string => {
  if (v != null) {
    const m = amountRegex.exec(v);
    if (m) {
      const val = prepareVal(m[0]);
      return val;
    }
  }
  return "0";
};

export const AmountInput: FC<AmountInputProps> = React.forwardRef<
  HTMLInputElement,
  AmountInputProps
>(
  (
    {
      onChange,
      value,
      max,
      min,
      name,
      placeholder,
      className = "",
      containerClass = "",
      leftComponent,
      rightComponent,
      disabled,
      regex,
      form,
      isFocused = false,
      onFocusChange = () => {},
      showErrorMessage = true,
    },
    ref,
  ) => {
    const amountRegex: RegExp = regex || new RegExp(`^[0-9]+(\\.[0-9]{0,10})?`);

    const [val, setVal] = useState<string>(() => {
      if (["", "0"].includes(value)) {
        return value;
      }

      const v = checkVal(value, amountRegex);

      return v;
    });
    const [focused, setFocused] = useState<boolean>(false);
    const [initialBlur, setInitialBlur] = useState<boolean>(false);

    const _inputRef = useRef<HTMLInputElement>(null);
    const { invalid, formField, message } = useFormField(form, name, value);

    const strip = (v: string) => {
      if (v.endsWith(".")) {
        return v.slice(0, -1);
      }
      return v;
    };

    useEffect(() => {
      if (["", "0"].includes(value)) {
        return setVal(value);
      }

      const v = checkVal(value, amountRegex);

      setVal(v);
    }, [value]);

    useEffect(() => {
      if (initialBlur === false) {
        return;
      }
      if (focused === false) {
        formField?.onBlur != null && formField?.onBlur();
      }
      onFocusChange(focused);
    }, [focused]);

    useEffect(() => {
      if (isFocused) {
        _inputRef.current?.focus();
      }
    }, [isFocused]);

    useEffect(() => {
      if (val == null || val === value) {
        return;
      }
      if (val === "0" || val === "") {
        onChange && onChange(val);
        return;
      }
      const v = strip(val);

      onChange && onChange(v);
    }, [val]);

    const onChanged: ChangeEventHandler<HTMLInputElement> = (e) => {
      setVal(checkVal(e.currentTarget.value, amountRegex));
    };

    const onBlured: FocusEventHandler = (_) => {
      if (val != null) {
        // remove insiginificant trailing zeros
        let calcVal = val.replace(/(\.[0-9]*[1-9])0+$|\.0*$/, "$1");
        const checked = checkVal(calcVal, amountRegex);
        if (+checked > +max) {
          setVal(max);
        } else if (+checked < +min) {
          setVal(min);
        } else {
          setVal(checkVal(calcVal, amountRegex));
        }
      }
      setFocused(false);
      !initialBlur && setInitialBlur(true);
    };

    return (
      <div className={`relative ${containerClass}`}>
        {leftComponent && leftComponent}
        <input
          name={name}
          value={val == null ? "" : val}
          disabled={disabled}
          ref={ref}
          type="number"
          max={Number(max)}
          autoComplete="off"
          placeholder={placeholder}
          onChange={onChanged}
          onBlur={onBlured}
          onFocus={() => setFocused(true)}
          className={`${inputClasses} !font-mono text-right ${disabledInputClasses} ${
            invalid ? invalidClasses : ""
          } ${className}`}
        />
        {showErrorMessage && message != null ? (
          <div className=" text-vermilion h-ztg-15 items-center flex text-ztg-10-150">
            {message}
          </div>
        ) : null}
        {rightComponent && rightComponent}
      </div>
    );
  },
);
