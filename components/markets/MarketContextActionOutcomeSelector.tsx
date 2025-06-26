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
import { isCombinatorialToken, CombinatorialToken } from "lib/types/combinatorial";

export type MarketContextActionOutcomeSelectorProps = {
  market: FullMarketFragment;
  selected: MarketOutcomeAssetId | CombinatorialToken;
  options?: (MarketOutcomeAssetId | CombinatorialToken)[];
  disabled?: boolean;
  hideValue?: boolean;
  onChange: (selected: MarketOutcomeAssetId | CombinatorialToken) => void;
  // For combo markets, provide the outcome combinations with names and colors
  outcomeCombinations?: Array<{
    assetId: CombinatorialToken;
    name: string;
    color: string;
  }>;
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
  console.log(market)
  const assetOptions = useMemo(() => {
    if (!options) return [];
    
    if (outcomeCombinations) {
      return options.map((asset, index) => {
        const combination = outcomeCombinations.find(combo => 
          JSON.stringify(combo.assetId) === JSON.stringify(asset)
        );
        return {
          asset,
          assetIndex: index,
          category: combination ? { name: combination.name } : null,
          color: combination?.color || '#000000',
        };
      });
    } else {
      // For regular markets, use the existing logic
      const colors = calcMarketColors(market?.marketId!, options.length);
      return options.map((asset, index) => {
        const assetIndex = isCombinatorialToken(asset) ? index : getIndexOf(asset) || 0;
        console.log(assetIndex)
        const category = market?.categories?.[assetIndex];
        return {
          asset,
          assetIndex,
          category,
          color: colors[index],
        };
      });
    }
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
      // For combo markets, find the matching combination
      if (outcomeCombinations) {
        const combination = outcomeCombinations.find(combo => 
          JSON.stringify(combo.assetId) === JSON.stringify(selected)
        );
        return combination?.name ?? "";
      }
      // Fallback to asset options
      return assetOptions.find(a => 
        JSON.stringify(a.asset) === JSON.stringify(selected)
      )?.category?.name ?? "";
    } else if ('CategoricalOutcome' in selected) {
      return market.categories?.[selected.CategoricalOutcome[1]]?.name ?? "";
    } else {
      return selected.ScalarOutcome[1];
    }
  };

  const findMatchingOption = (selected: MarketOutcomeAssetId | CombinatorialToken) => {
    return assetOptions.find((a) => {
      if (isCombinatorialToken(selected) && isCombinatorialToken(a.asset)) {
        return JSON.stringify(a.asset) === JSON.stringify(selected);
      } else if (!isCombinatorialToken(selected) && !isCombinatorialToken(a.asset)) {
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
          <Listbox.Button onClick={() => setOpen(!open)}>
            <div className="center gap-2 text-2xl md:text-xl lg:text-2xl">
              <TruncatedText
                length={24}
                text={getSelectedText()}
              >
                {(text) => {
                  const option = findMatchingOption(selected);

                  return (
                    <>
                      {hideValue ? (
                        <div className="center gap-2">
                          <span>{revealed ? text : "∗∗∗∗∗∗"}</span>
                        </div>
                      ) : (
                        <div className="center gap-2">
                          <div
                            className="h-3 w-3 rounded-full "
                            style={{ backgroundColor: option?.color }}
                          ></div>
                          {text}
                        </div>
                      )}
                    </>
                  );
                }}
              </TruncatedText>
              {!disabled && <RiArrowDownSLine />}
            </div>
          </Listbox.Button>

          {hideValue && (
            <>
              {revealed ? (
                <AiOutlineEye size={16} onClick={() => setRevealed(false)} />
              ) : (
                <AiOutlineEyeInvisible
                  size={16}
                  onClick={() => setRevealed(true)}
                />
              )}
            </>
          )}
        </div>

        <Transition
          show={open}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
          className="absolute bottom-0 right-0 z-50 h-full w-full overflow-hidden rounded-xl bg-white"
        >
          <div className="relative flex h-full flex-col">
            <div className="">
              <div
                className="flex cursor-pointer items-center gap-4 px-5 py-5 text-lg"
                onClick={() => setOpen(false)}
              >
                <BsArrowLeft />
                Select Outcome Asset
              </div>
              {Number(options?.length) > SEARCH_ITEMS_THRESHOLD && (
                <div className="mb-3 px-5">
                  <Input
                    type="text"
                    ref={inputRef}
                    placeholder="Search Assets"
                    className="w-full text-sm"
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
              className="no-scroll-bar mb-4 h-fit min-h-0 flex-1 overflow-y-scroll"
            >
              {(searchResults ?? assetOptions)?.map((option, index) => {
                return (
                  <Listbox.Option
                    key={option.assetIndex}
                    value={option.asset}
                    className=" cursor-pointer px-5 py-1 hover:bg-opacity-10"
                  >
                    <div className="flex items-center gap-3 rounded-md px-3 py-4 hover:bg-slate-100 md:text-sm lg:text-base">
                      <div
                        className="h-4 w-4 rounded-full "
                        style={{ backgroundColor: option.color }}
                      ></div>
                      {option.category?.name || option.assetIndex}
                    </div>
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
