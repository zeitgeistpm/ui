import moment from "moment-timezone";
import React, { forwardRef, SelectHTMLAttributes, FC, useRef } from "react";

const defaultTimezone = moment.tz.guess();
const allTimezones = moment.tz.names();

const TimezoneSelect = forwardRef<
  HTMLSelectElement | null,
  SelectHTMLAttributes<HTMLSelectElement>
>((props, ref) => {
  const selectRef = useRef<HTMLSelectElement | null>(null);
  return (
    <select
      {...props}
      defaultValue={defaultTimezone}
      ref={(instance) => {
        selectRef.current = instance;
        if (typeof ref === "function") {
          ref(instance);
        } else if (ref) {
          ref.current = instance;
        }
      }}
    >
      {allTimezones.map((timezone, index) => (
        <option key={index} value={timezone}>
          {timezone}
        </option>
      ))}
    </select>
  );
});

export default TimezoneSelect;
