import momentTz from "moment-timezone";
import moment from "moment";
import partialRight from "lodash/partialRight";
import { ChangeEventHandler, FocusEventHandler, useRef } from "react";
import { FormEvent } from "../types";
import Input from "components/ui/Input";

export type DateTimePickerProps = {
  name: string;
  value?: string;
  timezone?: string;
  onChange: (event: FormEvent<string>) => void;
  onBlur: (event: FormEvent<string>) => void;
  placeholder?: string;
  isValid?: boolean;
  className?: string;
};

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  name,
  value,
  timezone,
  onChange,
  onBlur,
  placeholder,
  isValid,
  className,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const momentFn = timezone ? partialRight(momentTz.tz, timezone) : moment;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    onChange?.({
      type: "change",
      target: {
        name,
        value: momentFn(event.target.value).utc().toISOString(),
      },
    });
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (event) => {
    onBlur?.({
      type: "blur",
      target: {
        name,
        value: momentFn(event.target.value).utc().toISOString(),
      },
    });
  };

  const isFirefox =
    typeof window !== "undefined" &&
    navigator.userAgent.toLowerCase().indexOf("firefox") > -1;

  return (
    <>
      {isFirefox ? (
        <div
          className={`center flex overflow-hidden rounded-full bg-gray-100 transition-all ${
            isValid && "!bg-nyanza-base"
          } ${className}`}
        >
          <Input
            className="rounded-full bg-transparent px-8 py-3"
            ref={inputRef}
            name={name}
            type="datetime-local"
            value={
              value
                ? momentFn(value).format("YYYY-MM-DDTHH:mm")
                : momentFn().hours(0).minutes(0).format("YYYY-MM-DDTHH:mm")
            }
            onChange={handleChange}
            onBlurCapture={handleBlur}
          />
        </div>
      ) : (
        <button
          type="button"
          className={`center flex rounded-full  bg-gray-100 transition-all active:scale-95  ${
            isValid && "!bg-nyanza-base"
          } ${className}`}
          onClick={() => {
            inputRef.current?.focus();
            inputRef.current?.showPicker();
          }}
        >
          <div className="relative px-8 py-3">
            <div>
              {!value
                ? (placeholder ?? "Set Date")
                : momentFn(value).format("MMM D, YYYY, h:mm:ss A")}
            </div>
            <Input
              className="absolute -bottom-2 left-0 h-0 w-0 opacity-0"
              ref={inputRef}
              name={name}
              type="datetime-local"
              value={
                value
                  ? momentFn(value).format("YYYY-MM-DDTHH:mm")
                  : momentFn().hours(0).minutes(0).format("YYYY-MM-DDTHH:mm")
              }
              onChange={handleChange}
              onBlurCapture={handleBlur}
            />
          </div>
        </button>
      )}
    </>
  );
};

export default DateTimePicker;
