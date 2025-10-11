import { Listbox, Transition } from "@headlessui/react";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { MarketOutcomeAssetId, getIndexOf } from "@zeitgeistpm/sdk";
import Input from "components/ui/Input";
import TruncatedText from "components/ui/TruncatedText";
import Fuse from "fuse.js";
import { calcMarketColors } from "lib/util/color-calc";
import { omit } from "lodash-es";
import { useEffect, useMemo, useRef, useState } from "react";
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
        <div className="center gap-3">
          <Listbox.Button
            onClick={() => setOpen(!open)}
            className="flex h-[56px] items-center gap-2 rounded-lg border border-sky-200/30 bg-white/80 px-4 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md"
          >
            <TruncatedText length={24} text={getSelectedText()}>
              {(text) => {
                const option = findMatchingOption(selected);

                return (
                  <>
                    {hideValue ? (
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-sky-900">
                          {revealed ? text : "∗∗∗∗∗∗"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: option?.color }}
                        ></div>
                        <span className="text-base font-semibold text-sky-900">
                          {text}
                        </span>
                      </div>
                    )}
                  </>
                );
              }}
            </TruncatedText>
            {!disabled && <RiArrowDownSLine className="text-sky-600" />}
          </Listbox.Button>

          {hideValue && (
            <button
              type="button"
              onClick={() => setRevealed(!revealed)}
              className="flex h-[56px] w-[56px] items-center justify-center rounded-lg border border-sky-200/30 bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow-md"
            >
              {revealed ? (
                <AiOutlineEye size={20} className="text-sky-600" />
              ) : (
                <AiOutlineEyeInvisible size={20} className="text-sky-600" />
              )}
            </button>
          )}
        </div>

        <Transition
          show={open}
          enter="transition duration-200 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-100 ease-in"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
          className="fixed inset-0 z-[100]"
        >
          <div className="relative flex h-full flex-col bg-sky-50/95 backdrop-blur-md">
            <div className="border-b border-sky-200/30 bg-sky-100/95 shadow-sm backdrop-blur-lg">
              <div
                className="flex cursor-pointer items-center gap-4 rounded-md px-5 py-4 text-lg font-semibold text-sky-900 transition-all hover:bg-sky-100/50"
                onClick={() => setOpen(false)}
              >
                <BsArrowLeft className="text-sky-600" />
                Select Outcome Asset
              </div>
              {Number(options?.length) > SEARCH_ITEMS_THRESHOLD && (
                <div className="px-5 pb-4">
                  <Input
                    type="text"
                    ref={inputRef}
                    placeholder="Search Assets"
                    className="w-full rounded-lg border border-sky-200/30 bg-white/95 text-sm shadow-sm backdrop-blur-sm"
                    value={search ?? ""}
                    onChange={(event) => {
                      setSearch(event.target.value);
                    }}
                  />
                </div>
              )}
            </div>
            <Listbox.Options
              static
              className="no-scroll-bar flex-1 overflow-y-scroll px-4 py-4"
            >
              {(searchResults ?? assetOptions)?.map((option, index) => {
                return (
                  <Listbox.Option
                    key={option.assetIndex}
                    value={option.asset}
                    className="mb-2 cursor-pointer"
                  >
                    {({ selected }) => (
                      <div
                        className={`flex items-center gap-3 rounded-xl border px-4 py-4 shadow-sm backdrop-blur-sm transition-all md:text-sm lg:text-base ${
                          selected
                            ? "border-sky-300/50 bg-sky-100/90 shadow-md"
                            : "border-sky-200/30 bg-white/90 hover:border-sky-300/50 hover:bg-white hover:shadow-md"
                        }`}
                      >
                        <div
                          className="h-4 w-4 flex-shrink-0 rounded-full shadow-sm"
                          style={{ backgroundColor: option.color }}
                        ></div>
                        <span
                          className={`font-semibold ${selected ? "text-sky-900" : "text-sky-700"}`}
                        >
                          {option.category?.name || option.assetIndex}
                        </span>
                      </div>
                    )}
                  </Listbox.Option>
                );
              })}
            </Listbox.Options>
          </div>
        </Transition>
      </Listbox>
    </>
  );
};

export default MarketContextActionOutcomeSelector;
