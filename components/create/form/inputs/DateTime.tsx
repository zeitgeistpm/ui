import {
  SupportedCurrencyTag,
  supportedCurrencies,
} from "lib/state/market-creation/types/currency";
import Image from "next/image";
import { FormEvent } from "../types";
import { ChangeEventHandler, FocusEventHandler, useRef } from "react";
import moment from "moment";

export type DateTimePickerProps = {
  name: string;
  value?: string;
  onChange: (event: FormEvent<string>) => void;
  onBlur: (event: FormEvent<string>) => void;
  placeholder?: string;
  isValid?: boolean;
  className?: string;
};

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  isValid,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    console.log("handleChange", name);
    onChange?.({
      type: "change",
      target: {
        name,
        value: moment(event.target.value).toISOString(),
      },
    });
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (event) => {
    console.log("handleBlur", name);
    onBlur?.({
      type: "blur",
      target: {
        name,
        value: moment(event.target.value).toISOString(),
      },
    });
  };

  return (
    <button
      type="button"
      className={`flex center rounded-full  bg-gray-200 py-3 px-6 ${
        isValid && "!bg-nyanza-base"
      } ${className}`}
      onClick={() => inputRef.current?.showPicker()}
    >
      <div>
        {!value
          ? placeholder ?? "Set Date"
          : moment(value).format("MMM Do, YYYY hh:mm a")}
      </div>
      <input
        className="opacity-0 h-0 w-0"
        ref={inputRef}
        name={name}
        type="datetime-local"
        value={moment(value).format("YYYY-MM-DDTHH:mm")}
        onChange={handleChange}
        onBlurCapture={handleBlur}
      />
    </button>
  );
};

export default DateTimePicker;
