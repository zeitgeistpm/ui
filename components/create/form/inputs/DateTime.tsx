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
};

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  name,
  value,
  onChange,
  onBlur,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    onChange?.({
      type: "change",
      target: {
        name,
        value: moment(event.target.value).toISOString(),
      },
    });
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (event) => {
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
      className={`flex center rounded-full bg-gray-200 py-3 px-6 ${
        !value && "bg-green-200"
      }`}
      onClick={() => {
        console.log(inputRef.current?.showPicker());
      }}
    >
      <div>
        {!value ? "Set end date" : moment(value).format("MMM Do, YYYY hh:mm a")}
      </div>
      <input
        className="opacity-0 h-0 w-0"
        ref={inputRef}
        name={name}
        type="datetime-local"
        value={moment(value).format("YYYY-MM-DDThh:mm")}
        onChange={handleChange}
        onBlurCapture={handleBlur}
      />
    </button>
  );
};

export default DateTimePicker;
