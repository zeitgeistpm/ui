import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { runInAction } from "mobx";
import Form from "mobx-react-form";

import { Minus, Plus, ArrowDownCircle, ArrowUpCircle } from "react-feather";
import { Color, HuePicker as ColorPicker } from "react-color";
import LabeledToggle from "components/ui/LabeledToggle";
import { DateTimeInput, Input } from "components/ui/inputs";

import { randomHexColor } from "lib/util";
import { useEvent } from "lib/hooks";
import {
  isDateRangeOutcomeEntry,
  isMultipleOutcomeEntries,
  isRangeOutcomeEntry,
  MultipleOutcomeEntry,
  Outcomes,
  OutcomeType,
  RangeOutcomeEntry,
  RangeType,
  YesNoOutcome,
} from "lib/types/create-market";
import { AnimatePresence, motion } from "framer-motion";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";

const FormContext = createContext(null);

const outcomeSettings = {
  maxOutcomes: 8,
  tickerMaxLength: 7,
  outcomeNameMaxLength: 98,
};

const oneWeekInMs = 1000 * 60 * 60 * 24 * 7;

export const createInitialMultipleOutcomeEntries =
  (): MultipleOutcomeEntry[] => {
    return [
      { name: "", ticker: "", color: randomHexColor() },
      { name: "", ticker: "", color: randomHexColor() },
    ];
  };

export const createYesNoOutcomeEntries = (): YesNoOutcome => {
  return [
    { name: "Yes", ticker: "YES", color: "#0E992D" },
    { name: "No", ticker: "NO", color: "#00A3FF" },
  ];
};

export const addMultipleOutcomeEntry = (entries: MultipleOutcomeEntry[]) => {
  return [...entries, { name: "", ticker: "", color: randomHexColor() }];
};

export const createInitialRangeOutcomeEntry = (): RangeOutcomeEntry => {
  return { minimum: "", maximum: "", ticker: "", type: "number" };
};

export const OutcomeColor: FC<{
  color: Color;
  onChange: (color: Color) => void;
  name: string;
}> = ({ color, onChange, name }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const targetId = `colorPicker-${name}`;
  const targetIdSelector = `[data-target-id=${targetId}]`;

  const documentClickEvent = useEvent(document, "mousedown");

  useEffect(() => {
    if (documentClickEvent == null) {
      return;
    }
    if ((documentClickEvent.target as HTMLElement).closest(targetIdSelector)) {
      documentClickEvent.preventDefault();
      return;
    }
    pickerOpen === true && setPickerOpen(false);
  }, [documentClickEvent]);

  return (
    <div className="relative" data-target-id={targetId}>
      <div
        className="w-ztg-40 h-ztg-40 rounded-full cursor-pointer flex-grow-0 flex-shrink-0 border-2 border-sky-600"
        style={{ background: color === "" ? "#c4c4c4" : color.toString() }}
        onClick={() => setPickerOpen(!pickerOpen)}
      ></div>
      {pickerOpen && (
        <div className="absolute right-0 z-ztg-1">
          <ColorPicker
            color={color}
            onChange={(color) => onChange(color.hex)}
          />
        </div>
      )}
    </div>
  );
};

export const YesNoOutcomesField: FC<{ entries: YesNoOutcome }> = ({
  entries,
}) => {
  return (
    <div className="text-ztg-10-150 font-bold mb-ztg-8 text-sky-600 uppercase ">
      <div className="flex-ztg-basis-520 flex-grow flex-shrink mb-2">
        OUTCOMES/TICKER
      </div>
      <div className="flex">
        <div className="flex items-center mr-4">
          <div
            className="w-ztg-40 mr-2 h-ztg-40 flex-shrink-0 rounded-full center"
            style={{ background: entries[0].color }}
          ></div>
          <div className="text-base">{entries[0].ticker}</div>
        </div>
        <div className="flex items-center">
          <div
            className="w-ztg-40 mr-2 h-ztg-40 flex-shrink-0 rounded-full center ml-ztg-13"
            style={{ background: entries[1].color }}
          ></div>
          <div className="text-base">{entries[1].ticker}</div>
        </div>
      </div>
    </div>
  );
};

export const MultipleOutcomeRow: FC<{
  outcomeName: string;
  color: Color;
  ticker: string;
  onRemove: () => void;
  onNameChange: (value: string) => void;
  onTickerChange: (value: string) => void;
  onColorChange: (color: Color) => void;
  canRemove: boolean;
  name: string;
}> = ({
  outcomeName,
  color,
  ticker,
  onRemove,
  onNameChange,
  onTickerChange,
  onColorChange,
  canRemove,
  name,
}) => {
  const form = useContext(FormContext);
  const parentField = form.$("outcomes");
  const nameRef = useRef();
  const tickerRef = useRef();

  const nameFieldName = `${name}-name`;
  const tickerFieldName = `${name}-ticker`;

  const createFields = () =>
    runInAction(() => {
      parentField.add({ name: nameFieldName, rules: "required" });
      parentField.add({ name: tickerFieldName, rules: "required" });
    });

  const removeFields = () =>
    runInAction(() => {
      parentField.del(nameFieldName);
      parentField.del(tickerFieldName);
    });

  useEffect(() => {
    createFields();
    return () => removeFields();
  }, []);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 50, opacity: 0 }}
      transition={{ type: "spring", duration: 0.5 }}
      className="flex mb-ztg-10"
    >
      <div
        className="flex-ztg-basis-520 pr-ztg-16 flex-grow flex-shrink"
        data-test="outComeInput"
      >
        <Input
          type="text"
          ref={nameRef}
          form={form}
          placeholder="Outcome"
          className="w-full"
          value={outcomeName}
          maxLength={outcomeSettings.outcomeNameMaxLength}
          name={`outcomes.${nameFieldName}`}
          autoComplete="off"
          onChange={(e) => {
            onNameChange(e.target.value);
          }}
        />
      </div>
      <div
        className="flex-ztg-basis-85 pr-ztg-15 flex-grow"
        data-test="outComeTicker"
      >
        <Input
          type="text"
          ref={tickerRef}
          form={form}
          value={ticker}
          maxLength={outcomeSettings.tickerMaxLength}
          placeholder="ABC"
          className="w-full"
          name={`outcomes.${tickerFieldName}`}
          autoComplete="off"
          onChange={(e) => {
            onTickerChange(e.target.value);
          }}
        />
      </div>
      <OutcomeColor color={color} onChange={onColorChange} name={name} />
      {canRemove && (
        <div
          className="w-ztg-40 h-ztg-40 rounded-ztg-5 border-2 border-sky-600 center ml-ztg-15 flex-grow-0 flex-shrink-0 cursor-pointer"
          onClick={() => onRemove()}
        >
          <Minus size={20} className="text-sky-600" />
        </div>
      )}
    </motion.div>
  );
};

export const MultipleOutcomesField: FC<{
  entries: MultipleOutcomeEntry[];
  onEntryChange: (index: number, entry: MultipleOutcomeEntry) => void;
  onEntriesChange: (entries: MultipleOutcomeEntry[]) => void;
  namePrefix: string;
}> = ({ entries, onEntriesChange, onEntryChange, namePrefix }) => {
  const { data: constants } = useChainConstants();
  const addOutcome = () => {
    onEntriesChange(addMultipleOutcomeEntry(entries));
  };

  const removeOutcome = (idx: number) => {
    onEntriesChange([...entries.slice(0, idx), ...entries.slice(idx + 1)]);
  };

  const changeName = (idx: number, value: string) => {
    onEntryChange(idx, { ...entries[idx], name: value });
  };

  const changeTicker = (idx: number, value: string) => {
    onEntryChange(idx, { ...entries[idx], ticker: value });
  };

  const changeColor = (idx: number, color: Color) => {
    onEntryChange(idx, { ...entries[idx], color: color.toString() });
  };

  return (
    <div data-test="multipleOutcomesField">
      <div className="flex text-ztg-10-150 font-bold mb-ztg-8 h-ztg-15 text-sky-600 uppercase ">
        <div className="flex-ztg-basis-520 flex-grow flex-shrink">Outcomes</div>
        <div className="flex-ztg-basis-85 flex-grow">Ticker</div>
        <div className="w-ztg-40 flex-shrink-0 text-center">Color</div>
        {entries.length > 2 && (
          <div className="w-ztg-40 ml-ztg-15 flex-shrink-0"></div>
        )}
      </div>
      <AnimatePresence>
        {entries.map((entry, idx) => {
          return (
            <MultipleOutcomeRow
              outcomeName={entry.name}
              color={entry.color}
              ticker={entry.ticker}
              key={`multipleOutcomes-${idx}`}
              onRemove={() => removeOutcome(idx)}
              onNameChange={(v) => changeName(idx, v)}
              onTickerChange={(v) => changeTicker(idx, v)}
              onColorChange={(v) => changeColor(idx, v)}
              canRemove={entries.length > constants?.markets.minCategories}
              name={`${namePrefix}-${idx}`}
            />
          );
        })}
      </AnimatePresence>
      {entries.length < constants?.markets.maxCategories && (
        <div
          className="w-ztg-40 h-ztg-40 rounded-ztg-5 border-2 border-sky-600 center flex-grow-0 flex-shrink-0 cursor-pointer"
          onClick={addOutcome}
          role="button"
        >
          <Plus size={20} className="text-sky-600" />
        </div>
      )}
    </div>
  );
};

export const RangeOutcomeField: FC<{
  namePrefix: string;
  outcome: RangeOutcomeEntry;
  onOutcomeChange: (outcome: RangeOutcomeEntry) => void;
}> = ({ outcome, onOutcomeChange, namePrefix }) => {
  const form = useContext(FormContext);
  const parentField = form.$("outcomes");
  const shortFieldName = `${namePrefix}-short`;
  const longFieldName = `${namePrefix}-long`;
  const tickerFieldName = `${namePrefix}-ticker`;

  const createFields = () =>
    runInAction(() => {
      parentField.add({ name: shortFieldName, rules: "required" });
      parentField.add({ name: longFieldName, rules: "required" });
      parentField.add({ name: tickerFieldName, rules: "required" });
    });

  const removeFields = () =>
    runInAction(() => {
      parentField.del(shortFieldName);
      parentField.del(longFieldName);
      parentField.del(tickerFieldName);
    });

  useEffect(() => {
    createFields();

    return () => removeFields();
  }, []);

  const longRef = useRef();
  const shortRef = useRef();
  const tickerRef = useRef();

  const changeMinimum = (v: string) => {
    onOutcomeChange({ ...outcome, minimum: v });
  };

  const changeMaximum = (v: string) => {
    onOutcomeChange({ ...outcome, maximum: v });
  };

  const changeTicker = (v: string) => {
    onOutcomeChange({ ...outcome, ticker: v });
  };

  const changeType = (type: RangeType) => {
    onOutcomeChange({
      ...outcome,
      type,
      minimum: type === "number" ? "" : `${Date.now()}`,
      maximum: type === "number" ? "" : `${Date.now() + oneWeekInMs}`,
    });
  };

  return (
    <>
      <div className="flex text-ztg-10-150 uppercase text-sky-600 font-medium mb-ztg-8 h-ztg-15">
        <div className="flex-ztg-basis-248 flex-grow flex-shrink">
          Minimum (Ticker-S)
        </div>
        <div className="flex-ztg-basis-248 flex-grow flex-shrink">
          Maximum (Ticker-L)
        </div>
        <div className="flex-ztg-basis-85">Ticker</div>
        <div className="w-ztg-40 flex-shrink-0">Short</div>
        <div className="w-ztg-40 flex-shrink-0 ml-ztg-13">Long</div>
      </div>
      <div className="flex mb-2">
        <div className="flex-ztg-basis-248 h-12 flex-grow flex-shrink pr-ztg-16">
          {outcome.type === "number" ? (
            <Input
              data-test="minRangeValueInput"
              name={`outcomes.${namePrefix}-short`}
              ref={shortRef}
              form={form}
              type="number"
              placeholder="Minimum Range Value"
              value={outcome.minimum}
              min={0}
              onChange={(e) => {
                changeMinimum(e.target.value);
              }}
            />
          ) : (
            <DateTimeInput
              data-test="minRangeValueInput"
              name={`outcomes.${namePrefix}-short`}
              onChange={(timestamp) => {
                changeMinimum(timestamp.toString());
              }}
              form={form}
              timestamp={outcome.minimum}
            />
          )}
        </div>
        <div className="flex-ztg-basis-248 h-12 flex-grow flex-shrink pr-ztg-16">
          {outcome.type === "number" ? (
            <Input
              data-test="maxRangeValueInput"
              name={`outcomes.${namePrefix}-long`}
              ref={longRef}
              form={form}
              type="number"
              placeholder="Maximum Range Value"
              value={outcome.maximum}
              min={0}
              onChange={(e) => {
                changeMaximum(e.target.value);
              }}
            />
          ) : (
            <DateTimeInput
              className="w-full"
              onChange={(timestamp) => {
                changeMaximum(timestamp);
              }}
              data-test="maxRangeValueInput"
              name={`outcomes.${namePrefix}-long`}
              form={form}
              timestamp={outcome.maximum}
            />
          )}
        </div>
        <div className="flex-ztg-basis-85 pr-ztg-15">
          <Input
            data-test="rangeTickerInput"
            type="text"
            name={`outcomes.${namePrefix}-ticker`}
            ref={tickerRef}
            form={form}
            placeholder="ABC"
            value={outcome.ticker}
            maxLength={outcomeSettings.tickerMaxLength}
            onChange={(e) => {
              changeTicker(e.target.value);
            }}
          />
        </div>
        <div
          className="w-ztg-40 h-ztg-40 flex-shrink-0 rounded-full center"
          style={{ background: "#FF0000" }}
        >
          <ArrowDownCircle size={20} className="text-black" />
        </div>
        <div
          className="w-ztg-40 h-ztg-40 flex-shrink-0 rounded-full center ml-ztg-13"
          style={{ background: "#24FF00" }}
        >
          <ArrowUpCircle size={20} className="text-black" />
        </div>
      </div>
      <div>
        <LabeledToggle
          leftLabel="Number"
          rightLabel="Date"
          side={outcome.type == "number" ? "left" : "right"}
          onChange={(side) => changeType(side === "left" ? "number" : "date")}
        />
      </div>
    </>
  );
};

const OutcomeTypeSelection: FC<{
  value: OutcomeType;
  onChange: (type: OutcomeType) => void;
}> = ({ onChange, value }) => {
  return (
    <div className="flex text-white mb-4">
      <div
        className={`cursor-pointer border-1 ${
          value === "yesno"
            ? "border-gray-600 dark:border-white"
            : "border-sky-200 dark:border-sky-800"
        } py-2 px-4 mr-3 rounded-3xl ztg-transition
        bg-sky-200 dark:bg-sky-800 text-sky-600`}
        onClick={() => onChange("yesno")}
      >
        Yes/No
      </div>
      <div
        className={`cursor-pointer border-1 ${
          value === "multiple"
            ? "border-gray-600 dark:border-white"
            : "border-sky-200 dark:border-sky-800"
        } py-2 px-4 mr-3 rounded-3xl ztg-transition
        bg-sky-200 dark:bg-sky-800 text-sky-600`}
        onClick={() => onChange("multiple")}
      >
        Options
      </div>
      <div
        className={`cursor-pointer border-1 ${
          value === "range"
            ? "border-gray-600 dark:border-white"
            : "border-sky-200 dark:border-sky-800"
        } py-2 px-4 mr-3 rounded-3xl ztg-transition
        bg-sky-200 dark:bg-sky-800 text-sky-600`}
        onClick={() => onChange("range")}
      >
        Range
      </div>
    </div>
  );
};

export interface OutcomesFieldProps {
  type: OutcomeType;
  value?: Outcomes;
  onChange: (type: OutcomeType, value: Outcomes) => void;
  namePrefix?: string;
  form: Form;
}

const OutcomesField: FC<OutcomesFieldProps> = ({
  type,
  value,
  onChange,
  namePrefix,
  form,
}) => {
  const initOutcomesForType = (t: OutcomeType) => {
    if (t === "multiple") {
      onChange(t, createInitialMultipleOutcomeEntries());
    } else if (t === "yesno") {
      onChange(t, createYesNoOutcomeEntries());
    } else {
      onChange(t, createInitialRangeOutcomeEntry());
    }
  };

  useEffect(() => {
    initOutcomesForType(type);
  }, []);

  /// need this because the form wouldn't revalidate when outcome type changes
  const [prevType, setPrevType] = useState(type);
  useEffect(() => {
    if (type === prevType) {
      return;
    }
    form.$("outcomes").set("value", {});
    form.validate();
    setPrevType(type);
  }, [type]);

  const changeMultipleOutcomeEntry = (idx: number, v: MultipleOutcomeEntry) => {
    if (isMultipleOutcomeEntries(value)) {
      onChange(type, [...value.slice(0, idx), v, ...value.slice(idx + 1)]);
    }
  };

  const changeMultipleOutcomes = (v: MultipleOutcomeEntry[]) => {
    if (isMultipleOutcomeEntries(value)) {
      onChange(type, v);
    }
  };

  const changeRangeOutcome = (v: RangeOutcomeEntry) => {
    if (isRangeOutcomeEntry(value)) {
      onChange(type, v);
    }
  };

  return (
    <FormContext.Provider value={form}>
      <div>
        <OutcomeTypeSelection value={type} onChange={initOutcomesForType} />
      </div>

      <div className="flex flex-col">
        {type === "yesno" && value && (
          <YesNoOutcomesField entries={value as YesNoOutcome} />
        )}
        {type === "multiple" && value && (
          <MultipleOutcomesField
            entries={isMultipleOutcomeEntries(value) && value}
            onEntryChange={changeMultipleOutcomeEntry}
            onEntriesChange={changeMultipleOutcomes}
            namePrefix={namePrefix || "multiple"}
          />
        )}
        {type === "range" && value && (
          <RangeOutcomeField
            outcome={isRangeOutcomeEntry(value) && value}
            onOutcomeChange={changeRangeOutcome}
            namePrefix={namePrefix || "range"}
          />
        )}
      </div>
    </FormContext.Provider>
  );
};

export default OutcomesField;
