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
    <div>
      <select
        defaultValue={defaultTimezone}
        value={props.value}
        className="outline-none"
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
