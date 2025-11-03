import moment from "moment-timezone";
import React from "react";
import { FormEvent } from "../types";

type TimezoneSelectProps = {
  name: string;
  value?: string;
  onChange: (event: FormEvent<string>) => void;
  onBlur: (event: FormEvent<string>) => void;
  hasValue?: boolean;
};

const defaultTimezone = moment.tz.guess();
const allTimezones = moment.tz.names();

const TimezoneSelect: React.FC<TimezoneSelectProps> = (props) => {
  return (
    <div
      className="flex w-full items-center rounded-lg border-2 border-white/20 backdrop-blur-sm transition-all h-12 bg-white/10 hover:border-white/30"
    >
      <select
        defaultValue={defaultTimezone}
        value={props.value}
        className="w-full h-full bg-transparent px-4 py-3 text-left text-sm text-white outline-none placeholder:text-white/50"
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
          <option key={index} value={timezone} className="bg-ztg-primary-600">
            {timezone}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TimezoneSelect;
