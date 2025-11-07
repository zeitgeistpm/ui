import { Listbox, Transition } from "@headlessui/react";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { MarketOutcomeAssetId, getIndexOf } from "@zeitgeistpm/sdk";
import Input from "components/ui/Input";
import TruncatedText from "components/ui/TruncatedText";
import Fuse from "fuse.js";
import { calcMarketColors } from "lib/util/color-calc";
import { omit } from "lodash-es";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { BsArrowLeft } from "react-icons/bs";
import { RiArrowDownSLine } from "react-icons/ri";
import {
  isCombinatorialToken,
  CombinatorialToken,
} from "lib/types/combinatorial";

export type MarketContextActionOutcomeSelectorProps = {
  market?: FullMarketFragment;
  selected: MarketOutcomeAssetId | CombinatorialToken;
  options?: (MarketOutcomeAssetId | CombinatorialToken)[];
  disabled?: boolean;
  hideValue?: boolean;
  onChange: (selected: MarketOutcomeAssetId | CombinatorialToken) => void;
  outcomeCombinations?: {
    assetId: CombinatorialToken;
    name: string;
    color?: string;
  }[];
};

const SEARCH_ITEMS_THRESHOLD = 5;

const MarketContextActionOutcomeSelector = ({
  market,
  selected,
  options,
  disabled,
  hideValue,
  onChange,
  outcomeCombinations,
}: MarketContextActionOutcomeSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const assetOptions = useMemo(() => {
    if (!options) return [];

    // Use marketId if available, otherwise use a fallback
    const marketId = market?.marketId || 0;
    const colors = calcMarketColors(marketId, options.length);

    return options.map((asset, index) => {
      let assetIndex: number;
      let category: { name: string } | null = null;
      let color = colors[index]; // Default color

      if (isCombinatorialToken(asset)) {
        if (outcomeCombinations) {
          // Find the combination that matches this asset
          const combination = outcomeCombinations.find(
            (combo) => JSON.stringify(combo.assetId) === JSON.stringify(asset),
          );
          if (combination) {
            category = { name: combination.name };
            color = combination.color || colors[index];
            assetIndex = index; // Use current position for combinatorial with outcomeCombinations
          } else {
            assetIndex = index;
          }
        } else {
          // For combinatorial tokens without outcomeCombinations, use the index directly
          // since assets are now in natural order matching categories
          assetIndex = index;
          const marketCategory = market?.categories?.[assetIndex];
          category = marketCategory
            ? { name: marketCategory.name || "" }
            : null;
        }
      } else {
        // For regular assets, use getIndexOf
        assetIndex = getIndexOf(asset) || 0;
        const marketCategory = market?.categories?.[assetIndex];
        category = marketCategory ? { name: marketCategory.name || "" } : null;
      }

      return {
        asset,
        assetIndex,
        category,
        color,
      };
    });
  }, [options, market?.marketId, market?.categories, outcomeCombinations]);

  const searchResults = useMemo(() => {
    if (!search) return null;
    if (!options) return [];
    const fuse = new Fuse(
      assetOptions.map((option) => {
        const name = option.category?.name ?? "";
        return { ...option, name };
      }),
      {
        includeScore: true,
        keys: ["name"],
      },
    );

    const results = fuse.search(search);

    return results.map((result) => omit(result.item, "name"));
  }, [assetOptions, search]);

  useEffect(() => {
    if (!open) {
      setSearch(undefined);
    }
  }, [open, search]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 66);
    }
  }, [open, inputRef]);

  const [revealed, setRevealed] = useState(false);

  const getSelectedText = () => {
    if (isCombinatorialToken(selected)) {
      return (
        assetOptions.find(
          (a) => JSON.stringify(a.asset) === JSON.stringify(selected),
        )?.category?.name ?? ""
      );
    } else if ("CategoricalOutcome" in selected) {
      return market?.categories?.[selected.CategoricalOutcome[1]]?.name ?? "";
    } else {
      return selected.ScalarOutcome[1];
    }
  };

  const findMatchingOption = (
    selected: MarketOutcomeAssetId | CombinatorialToken,
  ) => {
    return assetOptions.find((a) => {
      if (isCombinatorialToken(selected) && isCombinatorialToken(a.asset)) {
        return JSON.stringify(a.asset) === JSON.stringify(selected);
      } else if (
        !isCombinatorialToken(selected) &&
        !isCombinatorialToken(a.asset)
      ) {
        return getIndexOf(a.asset) === getIndexOf(selected);
      }
      return false;
    });
  };

  return (
    <>
      <Listbox
        value={selected}
        disabled={disabled}
        onChange={(value) => {
          onChange(value);
          setOpen(false);
        }}
      >
        <div
          ref={containerRef}
          className="relative z-10 flex w-full flex-col gap-3"
        >
          <div className="flex gap-3">
            <Listbox.Button
              onClick={() => setOpen(!open)}
              className="group flex h-[56px] flex-1 items-center gap-2 rounded-lg bg-white/10 px-4 shadow-md backdrop-blur-sm transition-all hover:bg-white/20 hover:shadow-lg"
            >
              <TruncatedText length={24} text={getSelectedText()}>
                {(text) => {
                  const option = findMatchingOption(selected);

                  return (
                    <>
                      {hideValue ? (
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-white/90">
                            {revealed ? text : "∗∗∗∗∗∗"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3.5 w-3.5 flex-shrink-0 rounded-full ring-2 ring-white/20"
                            style={{ backgroundColor: option?.color }}
                          ></div>
                          <span className="text-base font-semibold text-white/90">
                            {text}
                          </span>
                        </div>
                      )}
                    </>
                  );
                }}
              </TruncatedText>
              {!disabled && (
                <RiArrowDownSLine
                  size={18}
                  className={`ml-auto text-white/90 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                />
              )}
            </Listbox.Button>

            {hideValue && (
              <button
                type="button"
                onClick={() => setRevealed(!revealed)}
                className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-lg bg-white/10 shadow-md backdrop-blur-sm transition-all hover:bg-white/20 hover:shadow-lg"
              >
                {revealed ? (
                  <AiOutlineEye size={18} className="text-white/90" />
                ) : (
                  <AiOutlineEyeInvisible size={18} className="text-white/90" />
                )}
              </button>
            )}
          </div>

          <Transition
            show={open}
            as={Fragment}
            enter="transition duration-200 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-100 ease-in"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <div
              ref={dropdownRef}
              className="fixed inset-0 z-[100] flex flex-col bg-ztg-primary-500/95 backdrop-blur-md md:absolute md:bottom-auto md:left-0 md:right-0 md:top-full md:z-[100] md:mt-2 md:w-full md:rounded-lg md:border-2 md:border-white/10 md:bg-ztg-primary-700/95 md:shadow-2xl md:ring-2 md:ring-white/5 md:backdrop-blur-lg"
            >
              {/* Mobile header */}
              <div className="border-b-2 border-white/10 bg-ztg-primary-600/95 shadow-sm backdrop-blur-lg md:hidden">
                <div
                  className="flex cursor-pointer items-center gap-3 px-5 py-3.5 text-base font-semibold text-white/90 transition-all hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  <BsArrowLeft size={18} className="text-white/90" />
                  <span>Select Outcome Asset</span>
                </div>
                {Number(options?.length) > SEARCH_ITEMS_THRESHOLD && (
                  <div className="px-5 pb-3">
                    <Input
                      type="text"
                      ref={inputRef}
                      placeholder="Search Assets"
                      className="h-[44px] w-full rounded-lg bg-white/10 px-4 text-sm text-white/90 shadow-md backdrop-blur-sm placeholder:text-white/60 focus:bg-white/15 focus:shadow-lg"
                      value={search ?? ""}
                      onChange={(event) => {
                        setSearch(event.target.value);
                      }}
                    />
                  </div>
                )}
              </div>
              {/* Desktop search */}
              {Number(options?.length) > SEARCH_ITEMS_THRESHOLD && (
                <div className="hidden px-3 pb-3 pt-3 md:block">
                  <Input
                    type="text"
                    ref={inputRef}
                    placeholder="Search outcomes..."
                    className="h-[40px] w-full rounded-lg bg-white/10 px-3 text-sm text-white/90 backdrop-blur-sm transition-all placeholder:text-white/60 focus:bg-white/15 focus:shadow-md focus:ring-2 focus:ring-ztg-green-500/30"
                    value={search ?? ""}
                    onChange={(event) => {
                      setSearch(event.target.value);
                    }}
                  />
                </div>
              )}
              <Listbox.Options
                static
                className="no-scroll-bar flex-1 overflow-y-scroll px-3 py-3 md:max-h-[300px]"
              >
                {(searchResults ?? assetOptions)?.map((option, index) => {
                  return (
                    <Listbox.Option
                      key={option.assetIndex}
                      value={option.asset}
                      className="mb-2 cursor-pointer last:mb-0"
                    >
                      {({ selected, active }) => (
                        <div
                          className={`group flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-150 ease-in-out ${
                            selected
                              ? "bg-ztg-green-500/20 text-white shadow-sm ring-2 ring-ztg-green-500/30"
                              : active
                                ? "bg-white/20 text-white shadow-sm"
                                : "bg-white/10 text-white/90 hover:bg-white/20 hover:shadow-sm"
                          }`}
                        >
                          <div
                            className="h-3 w-3 flex-shrink-0 rounded-full ring-2 ring-white/30 transition-all group-hover:ring-white/50"
                            style={{ backgroundColor: option.color }}
                          ></div>
                          <span
                            className={`text-sm font-medium transition-colors ${
                              selected
                                ? "text-ztg-green-400"
                                : "text-white/90 group-hover:text-white"
                            }`}
                          >
                            {option.category?.name || option.assetIndex}
                          </span>
                          {selected && (
                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-ztg-green-400"></div>
                          )}
                        </div>
                      )}
                    </Listbox.Option>
                  );
                })}
              </Listbox.Options>
            </div>
          </Transition>
        </div>
      </Listbox>
    </>
  );
};

export default MarketContextActionOutcomeSelector;
