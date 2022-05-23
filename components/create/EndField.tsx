import { useStore } from "lib/stores/Store";
import React, { FC, useRef } from "react";
import { observer } from "mobx-react";
import Form from "mobx-react-form";

import { EndType } from "lib/types/create-market";
import { Input, DateTimeInput } from "components/ui/inputs";

interface EndTypeSwitchProps {
  selected: EndType;
  onChange: (type: EndType) => void;
}

const EndTypeSwitch: FC<EndTypeSwitchProps> = ({ selected, onChange }) => {
  const optionBaseCls =
    "w-ztg-123 rounded-full h-ztg-24 flex items-center cursor-pointer font-medium";
  const optionNonActiveCls = "text-sky-600";
  const optionActiveCls = "bg-white dark:bg-black text-black dark:text-white";

  return (
    <div
      className={`flex h-ztg-40 items-center w-ztg-275 px-ztg-10
        rounded-full justify-between mr-ztg-27 bg-mid-content-lt dark:bg-sky-1000`}
    >
      {["timestamp", "block"].map((type: EndType, idx) => {
        const active = type === selected;
        return (
          <div
            key={`marketEndType${idx}`}
            className={`${optionBaseCls} ${
              active ? optionActiveCls : optionNonActiveCls
            }`}
            onClick={() => onChange(type)}
            data-test={`${type}Button`}
          >
            <div className="center w-full">
              <span className="text-ztg-14-150">
                {type === "timestamp" ? "End Date" : "Endblock"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export interface EndFieldProps {
  className?: string;
  onEndTypeChange: (endType: EndType) => void;
  onEndChange: (end: number) => void;
  endType: EndType;
  form?: Form;
  value: string;
  timestampFieldName?: string;
  blockNumberFieldName?: string;
}

const EndField: FC<EndFieldProps> = observer(
  ({
    className = "",
    onEndTypeChange,
    onEndChange,
    endType = "timestamp",
    value = "",
    form,
    timestampFieldName = "timestamp",
    blockNumberFieldName = "blockNumber",
  }) => {
    const store = useStore();
    const blockNumber = store.blockNumber ? store.blockNumber.toNumber() : 0;

    const inputRef = useRef();

    return (
      <div
        className={`flex flex-wrap gap-y-ztg-10	${className}`}
        data-test="marketEndField"
      >
        <EndTypeSwitch selected={endType} onChange={onEndTypeChange} />
        <div className="flex">
          {endType === "block" ? (
            <Input
              value={value}
              ref={inputRef}
              form={form}
              type="number"
              name={blockNumberFieldName}
              className="w-ztg-275"
              min={blockNumber}
              step={1}
              onChange={(e) => {
                onEndChange(parseInt(e.target.value));
              }}
            />
          ) : (
            <DateTimeInput
              onChange={onEndChange}
              name={timestampFieldName}
              form={form}
              timestamp={+value}
            />
          )}
        </div>
      </div>
    );
  }
);

export default EndField;
