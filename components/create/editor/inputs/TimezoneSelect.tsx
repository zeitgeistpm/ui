import moment from "moment-timezone";
import React from "react";
import { FormEvent } from "../types";

type TimezoneSelectProps = {
  name: string;
  value?: string;
  onChange: (event: FormEvent<string>) => void;
  onBlur: (event: FormEvent<string>) => void;
};

const defaultTimezone = moment.tz.guess();
const allTimezones = moment.tz.names();

const TimezoneSelect: React.FC<TimezoneSelectProps> = (props) => {
  return (
    <div className="ml-4 rounded-full bg-gray-100 px-8 py-3">
      <select
        defaultValue={defaultTimezone}
        value={props.value}
        className="bg-transparent text-center outline-none"
        onChange={(e) => {
          const value = e.target.value;
          props.onChange({
            target: { name: props.name, value: value },
            type: "change",
          });
          props.onBlur({
            target: { name: props.name, value },
            type: "blur",
          });
        }}
      >
        {allTimezones.map((timezone, index) => (
          <option key={index} value={timezone}>
            {timezone}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TimezoneSelect;
