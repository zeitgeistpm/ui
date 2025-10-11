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
          className={`center flex overflow-hidden rounded-md border backdrop-blur-md transition-all ${
            isValid
              ? "border-sky-200/30 bg-white/80"
              : "border-vermilion/50 bg-sky-50/50"
          } ${className}`}
        >
          <Input
            className="rounded-md bg-transparent px-3 py-1.5 text-xs"
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
          className={`center flex rounded-md border backdrop-blur-md transition-all active:scale-95 ${
            isValid
              ? "border-sky-200/30 bg-white/80 hover:bg-sky-100/80"
              : "border-vermilion/50 bg-sky-50/50"
          } ${className}`}
          onClick={() => {
            inputRef.current?.focus();
            inputRef.current?.showPicker();
          }}
        >
          <div className="relative px-3 py-1.5">
            <div className="text-xs text-sky-900">
              {!value
                ? (placeholder ?? "Set Date")
                : momentFn(value).format("MMM D, YYYY, h:mm A")}
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
