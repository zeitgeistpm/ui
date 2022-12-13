import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import React, { FC, HTMLProps, useEffect, useState } from "react";
import { ChevronDown } from "react-feather";
import SubMenuItem from "./SubMenuItem";

export interface LocalizationOption {
  label: string;
  short: string;
}

export const localizationOptions: LocalizationOption[] = [
  { label: "English", short: "En" },
  { label: "Русский", short: "Py" },
  { label: "Español", short: "Es" },
  { label: "中国", short: "中国" },
];

export type LocalizationSelectProps = HTMLProps<HTMLInputElement> & {
  hideLabel: boolean;
  options: LocalizationOption[];
  selectedLanguage: LocalizationOption;
  onLanguageChange: (option: LocalizationOption) => void;
};

const LocalizationSelect: FC<LocalizationSelectProps> = observer(
  ({ hideLabel, options, selectedLanguage, onLanguageChange, ...props }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [subContainerClass, setSubContainerClass] = useState("");
    const store = useStore();
    const { className, ...restProps } = props;

    useEffect(() => {
      if (store.leftDrawerClosed) {
        setMenuOpen(false);
      }

      const base = "flex flex-col absolute z-ztg-2";
      if (store.leftDrawerClosed) {
        setSubContainerClass(
          `${base} w-ztg-256 left-full bottom-0 w-ztg-200 left-28 bg-white dark:bg-black rounded-ztg-10 mb-ztg-10`,
        );
      } else {
        setSubContainerClass(
          `${base} w-full bottom-ztg-34 mb-ztg-10 ml-ztg-50`,
        );
      }
    }, [store.leftDrawerClosed]);

    return (
      <div className={`${store.leftDrawerClosed ? "" : "relative"}`}>
        {menuOpen && (
          <div className={subContainerClass}>
            {options.map((opt, idx) => {
              return (
                <SubMenuItem
                  label={opt.label}
                  key={`languageOption${idx}`}
                  active={opt === selectedLanguage}
                  onClick={() => {
                    onLanguageChange(opt);
                    setMenuOpen(false);
                  }}
                  showDot={false}
                />
              );
            })}
          </div>
        )}
        <div
          onClick={() => setMenuOpen(!menuOpen)}
          className={`flex items-center cursor-pointer w-ztg-118 relative  ${className}`}
          {...restProps}
        >
          <div className="w-ztg-34 h-ztg-34 center text-ztg-12-120 font-bold rounded-full text-white  bg-ztg-blue">
            {selectedLanguage.short}
          </div>
          {hideLabel === false && (
            <>
              <div className="ml-ztg-15 text-ztg-12-120 font-bold text-sky-600 dark:text-sky-300">
                {selectedLanguage.label}
              </div>
              <ChevronDown size={18} className="ml-ztg-5" />
            </>
          )}
        </div>
      </div>
    );
  },
);

export default LocalizationSelect;
