import moment from "moment";
import { ChangeEventHandler, FocusEventHandler, useRef } from "react";
import { FormEvent } from "../types";

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
      className={`flex center rounded-full  bg-gray-100  ${
        isValid && "!bg-nyanza-base"
      } ${className}`}
      onClick={() => {
        inputRef.current?.focus();
        inputRef.current?.showPicker();
      }}
    >
      <div className="relative py-3 px-8">
        <div>
          {!value
            ? placeholder ?? "Set Date"
            : moment(value).format("MMM Do, YYYY hh:mm a")}
        </div>
        <input
          className="opacity-0 h-0 w-0 absolute -bottom-2 left-0"
          ref={inputRef}
          name={name}
          type="datetime-local"
          value={moment(value).format("YYYY-MM-DDTHH:mm")}
          onChange={handleChange}
          onBlurCapture={handleBlur}
        />
      </div>
    </button>
  );
};

export default DateTimePicker;
