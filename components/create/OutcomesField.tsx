import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { runInAction } from "mobx";
import Form from "mobx-react-form";
import { observer } from "mobx-react";
import { Minus, Plus, ArrowDownCircle, ArrowUpCircle } from "react-feather";
import { Color, HuePicker as ColorPicker } from "react-color";

import LabeledToggle from "components/ui/LabeledToggle";
import { Input } from "components/ui/inputs";
import { randomHexColor } from "lib/util";
import { useEvent } from "lib/hooks";
import {
  isMultipleOutcomeEntries,
  isRangeOutcomeEntry,
  MultipleOutcomeEntry,
  Outcomes,
  OutcomeType,
  RangeOutcomeEntry,
} from "lib/types/create-market";
import { useStore } from "lib/stores/Store";
import { AnimatePresence, motion } from "framer-motion";

const FormContext = createContext(null);

const outcomeSettings = {
  maxOutcomes: 8,
  tickerMaxLength: 7,
  outcomeNameMaxLength: 98,
};

export const createInitialMultipleOutcomeEntries =
  (): MultipleOutcomeEntry[] => {
    return [
      { name: "", ticker: "", color: randomHexColor() },
      { name: "", ticker: "", color: randomHexColor() },
    ];
  };

export const addMultipleOutcomeEntry = (entries: MultipleOutcomeEntry[]) => {
  return [...entries, { name: "", ticker: "", color: randomHexColor() }];
};

export const createInitialRangeOutcomeEntry = (): RangeOutcomeEntry => {
  return { minimum: NaN, maximum: NaN, ticker: "" };
};

export const OutcomeColor: FC<{
  color: Color;
  onChange: (color: Color) => void;
  name: string;
}> = observer(({ color, onChange, name }) => {
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
});

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
}> = observer(
  ({
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
        <div className="flex-ztg-basis-520 pr-ztg-16 flex-grow flex-shrink" data-test="outComeInput">
          <Input
            type="text"

            ref={nameRef}
            form={form}
            placeholder="Outcome"
            className="w-full"
            value={outcomeName}
            maxLength={outcomeSettings.outcomeNameMaxLength}
            name={`outcomes.${name}-name`}
            autoComplete="off"
            onChange={(e) => {
              onNameChange(e.target.value);
            }}
          />
        </div>
        <div className="flex-ztg-basis-85 pr-ztg-15 flex-grow" data-test="outComeTicker">
          <Input
            type="text"
            ref={tickerRef}
            form={form}
            value={ticker}
            maxLength={outcomeSettings.tickerMaxLength}
            placeholder="ABC"
            className="w-full"
            name={`outcomes.${name}-ticker`}
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
  }
);

export const MultipleOutcomesField: FC<{
  entries: MultipleOutcomeEntry[];
  onEntryChange: (index: number, entry: MultipleOutcomeEntry) => void;
  onEntriesChange: (entries: MultipleOutcomeEntry[]) => void;
  namePrefix: string;
}> = observer(({ entries, onEntriesChange, onEntryChange, namePrefix }) => {
  const { config } = useStore();
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
      <div className="flex text-ztg-10-150 font-bold mb-ztg-8 h-ztg-15 text-sky-600 uppercase font-lato">
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
              key={`multipleOutcomes${idx}`}
              onRemove={() => removeOutcome(idx)}
              onNameChange={(v) => changeName(idx, v)}
              onTickerChange={(v) => changeTicker(idx, v)}
              onColorChange={(v) => changeColor(idx, v)}
              canRemove={entries.length > config?.markets.minCategories}
              name={`${namePrefix}-${idx}`}
            />
          );
        })}
      </AnimatePresence>
      {entries.length < config?.markets.maxCategories && (
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
});

export const RangeOutcomeField: FC<{
  namePrefix: string;
  outcome: RangeOutcomeEntry;
  onOutcomeChange: (outcome: RangeOutcomeEntry) => void;
  step?: number;
}> = observer(({ outcome, onOutcomeChange, step = 0.1, namePrefix }) => {
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

  const minStr = useMemo(() => {
    if (isNaN(outcome.minimum)) {
      return "";
    }
    return outcome.minimum.toString();
  }, [outcome.minimum]);

  const maxStr = useMemo(() => {
    if (isNaN(outcome.maximum)) {
      return "";
    }
    return outcome.maximum.toString();
  }, [outcome.maximum]);

  const changeMinimum = (v: string) => {
    const minimum = v === "" ? NaN : parseFloat(v);
    onOutcomeChange({ ...outcome, minimum });
  };

  const changeMaximum = (v: string) => {
    const maximum = v === "" ? NaN : parseFloat(v);
    onOutcomeChange({ ...outcome, maximum });
  };

  const changeTicker = (v: string) => {
    onOutcomeChange({ ...outcome, ticker: v });
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
      <div className="flex">
        <div className="flex-ztg-basis-248 flex-grow flex-shrink pr-ztg-16">
          <Input
            data-test="minRangeValueInput"
            name={`outcomes.${namePrefix}-short`}
            ref={shortRef}
            form={form}
            type="number"
            placeholder="Minimum Range Value"
            value={minStr}
            min={0}
            max={1}
            step={step}
            onChange={(e) => {
              changeMinimum(e.target.value);
            }}
          />
        </div>
        <div className="flex-ztg-basis-248 flex-grow flex-shrink pr-ztg-16" >
          <Input
            data-test="maxRangeValueInput"
            name={`outcomes.${namePrefix}-long`}
            ref={longRef}
            form={form}
            type="number"
            placeholder="Maximum Range Value"
            value={maxStr}
            min={0}
            max={1}
            step={step}
            onChange={(e) => {
              changeMaximum(e.target.value);
            }}
          />
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
    </>
  );
});

export interface OutcomesFieldProps {
  type: OutcomeType;
  value?: Outcomes;
  onChange: (type: OutcomeType, value: Outcomes) => void;
  namePrefix?: string;
  form: Form;
}

const OutcomesField: FC<OutcomesFieldProps> = observer(
  ({ type, value, onChange, namePrefix, form }) => {
    const initOutcomesForType = (t: OutcomeType) => {
      if (t === "multiple") {
        onChange(t, createInitialMultipleOutcomeEntries());
      } else {
        onChange(t, createInitialRangeOutcomeEntry());
      }
    };

    useEffect(() => {
      initOutcomesForType(type);
    }, []);

    const changeMultipleOutcomeEntry = (
      idx: number,
      v: MultipleOutcomeEntry
    ) => {
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
        <LabeledToggle
          side={type === "multiple" ? "left" : "right"}
          onChange={(side) => {
            initOutcomesForType(side === "left" ? "multiple" : "range");
          }}
          leftLabel="Multiple outcomes"
          rightLabel="Range of outcomes"
          className="mb-ztg-20"
        />

        <div className="flex flex-col">
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
  }
);

export default OutcomesField;
