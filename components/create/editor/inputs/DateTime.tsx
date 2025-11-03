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
  hasValue?: boolean;
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
  hasValue,
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
          className={`flex h-12 w-full items-center overflow-hidden rounded-lg border-2 border-white/20 bg-white/10 backdrop-blur-sm transition-all hover:border-white/30 ${className}`}
        >
          <Input
            className="h-full w-full rounded-lg bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/50"
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
          className={`flex h-12 w-full items-center rounded-lg border-2 border-white/20 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/15 active:scale-95 ${className}`}
          onClick={() => {
            inputRef.current?.focus();
            inputRef.current?.showPicker();
          }}
        >
          <div className="relative w-full text-left">
            <div className="text-sm text-white placeholder:text-white/50">
              {!value
                ? (placeholder ?? "Select end date and time")
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
