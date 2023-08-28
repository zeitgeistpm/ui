import { Listbox, Transition } from "@headlessui/react";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { MarketOutcomeAssetId, getIndexOf } from "@zeitgeistpm/sdk-next";
import Input from "components/ui/Input";
import TruncatedText from "components/ui/TruncatedText";
import * as fuzzysort from "fuzzysort";
import { calcMarketColors } from "lib/util/color-calc";
import { useEffect, useMemo, useState } from "react";
import { BsArrowLeft } from "react-icons/bs";
import { RiArrowDownSLine } from "react-icons/ri";

export type MarketContextActionOutcomeSelectorProps = {
  market: FullMarketFragment;
  selected: MarketOutcomeAssetId;
  options?: MarketOutcomeAssetId[];
  onChange: (selected: MarketOutcomeAssetId) => void;
};

export const MarketContextActionOutcomeSelector = ({
  market,
  selected,
  options,
  onChange,
}: MarketContextActionOutcomeSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState<string | undefined>();

  let optionsLength = useMemo(() => options?.length, [options]);

  if (search && options) {
    let opts = options.map((option) => {
      const name = market.categories?.[getIndexOf(option)].name ?? "";
      return { option, name };
    });

    options = fuzzysort
      .go(search, opts, { key: "name" })
      .map((result) => result.obj.option);
  }

  useEffect(() => {
    if (!open) {
      setSearch(undefined);
    }
  }, [open, search]);

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
          <div className="center gap-2 text-2xl md:text-xl lg:text-2xl">
            <TruncatedText
              length={24}
              text={market.categories?.[getIndexOf(selected)].name ?? ""}
            >
              {(text) => <>{text}</>}
            </TruncatedText>
            {options && options.length > 1 && <RiArrowDownSLine />}
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
          className="absolute top-[-1px] left-[1px] right-0 bottom-0 h-full w-full overflow-hidden rounded-xl z-50 bg-white"
        >
          <div
            className="py-6 px-5 text-xl flex items-center gap-4 cursor-pointer"
            onClick={() => setOpen(false)}
          >
            <BsArrowLeft />
            Select Outcome Asset
          </div>
          {Number(optionsLength) > 5 && (
            <div className="px-5 mb-3">
              <Input
                type="text"
                autoFocus
                placeholder="Search Assets"
                className="w-full text-base"
                value={search ?? ""}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
              />
            </div>
          )}
          <Listbox.Options
            static
            className="overflow-y-auto scrollbar-hide h-full"
          >
            {options &&
              options?.map((asset, index) => {
                const assetIndex = getIndexOf(asset);
                const category = market?.categories?.[assetIndex];
                const colors = calcMarketColors(
                  market?.marketId!,
                  options!.length,
                );
                return (
                  <Listbox.Option
                    key={assetIndex}
                    value={asset}
                    className=" text-base cursor-pointer py-1 px-2 hover:bg-opacity-10"
                  >
                    <div className="hover:bg-slate-100 flex py-6 md:text-sm lg:text-base px-5 gap-3 rounded-md items-center">
                      <div
                        className="w-4 h-4 rounded-full "
                        style={{ backgroundColor: colors[index] }}
                      ></div>
                      {category?.name || assetIndex}
                    </div>
                  </Listbox.Option>
                );
              })}
          </Listbox.Options>
        </Transition>
      </Listbox>
    </>
  );
};

export default MarketContextActionOutcomeSelector;
