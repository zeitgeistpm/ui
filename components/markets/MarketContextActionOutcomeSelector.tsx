import { Listbox, Transition } from "@headlessui/react";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { MarketOutcomeAssetId, getIndexOf } from "@zeitgeistpm/sdk";
import Input from "components/ui/Input";
import TruncatedText from "components/ui/TruncatedText";
import Fuse from "fuse.js";
import { calcMarketColors } from "lib/util/color-calc";
import { omit } from "lodash-es";
import { useEffect, useMemo, useRef, useState } from "react";
import { BsArrowLeft } from "react-icons/bs";
import { RiArrowDownSLine } from "react-icons/ri";

export type MarketContextActionOutcomeSelectorProps = {
  market: FullMarketFragment;
  selected: MarketOutcomeAssetId;
  options?: MarketOutcomeAssetId[];
  onChange: (selected: MarketOutcomeAssetId) => void;
};

const SEARCH_ITEMS_THRESHOLD = 5;

const MarketContextActionOutcomeSelector = ({
  market,
  selected,
  options,
  onChange,
}: MarketContextActionOutcomeSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  const assetOptions = useMemo(() => {
    if (!options) return [];
    const colors = calcMarketColors(market?.marketId!, options.length);

    return options.map((asset, index) => {
      const assetIndex = getIndexOf(asset);
      const category = market?.categories?.[assetIndex];
      return {
        asset,
        assetIndex,
        category,
        color: colors[index],
      };
    });
  }, [options]);

  const searchResults = useMemo(() => {
    if (!search) return null;
    if (!options) return [];
    const fuse = new Fuse(
      assetOptions.map((option) => {
        const name = market.categories?.[getIndexOf(option.asset)].name ?? "";
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

  return (
    <>
      <Listbox
        value={selected}
        onChange={(value) => {
          onChange(value);
          setOpen(false);
        }}
      >
        <Listbox.Button onClick={() => setOpen(!open)}>
          <div className="center gap-2 md:text-lg lg:text-xl text-ztg-blue">
            <TruncatedText
              length={24}
              text={market.categories?.[getIndexOf(selected)].name ?? ""}
            >
              {(text) => <>{text}</>}
            </TruncatedText>
            <RiArrowDownSLine className="text-black" />
          </div>
        </Listbox.Button>
        <Transition
          show={open}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
          className="absolute right-0 bottom-0 h-full w-full overflow-hidden rounded-xl z-50 bg-white"
        >
          <div className="relative flex flex-col h-full">
            <div className="">
              <div
                className="py-6 px-5 text-xl flex items-center gap-4 cursor-pointer"
                onClick={() => setOpen(false)}
              >
                <BsArrowLeft />
                Select Outcome Asset
              </div>
              {Number(options?.length) > SEARCH_ITEMS_THRESHOLD && (
                <div className="px-5 mb-3">
                  <Input
                    type="text"
                    ref={inputRef}
                    placeholder="Search Assets"
                    className="w-full text-base"
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
              className="overflow-y-scroll no-scroll-bar flex-1 h-fit min-h-0 mb-4"
            >
              {(searchResults ?? assetOptions)?.map((option, index) => {
                return (
                  <Listbox.Option
                    key={option.assetIndex}
                    value={option.asset}
                    className=" text-base cursor-pointer py-1 px-5 hover:bg-opacity-10"
                  >
                    <div className="hover:bg-slate-100 flex py-6 md:text-sm lg:text-base px-5 gap-3 rounded-md items-center">
                      <div
                        className="w-4 h-4 rounded-full "
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
