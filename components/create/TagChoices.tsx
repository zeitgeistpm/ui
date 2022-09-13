import React, { FC, useEffect, useState } from "react";
import { X, Check, Plus } from "react-feather";

export interface TagButtonProps {
  label: string;
  active: boolean;
  onActiveToggle: (active: boolean) => void;
}

export const TagButton: FC<TagButtonProps> = ({
  label,
  active,
  onActiveToggle,
}) => {
  const bgClass = active ? "bg-ztg-blue" : "bg-sky-200 dark:bg-sky-800";
  const iconBgClass = active ? "bg-black" : "bg-sky-600";
  const iconColorClass = active ? "text-sky-600" : "text-sky-200";
  const textColorClass = active ? "text-white" : "text-sky-600";
  const Icon = active ? X : Check;

  return (
    <div
      className={`h-ztg-25 flex items-center min-w-ztg-85 text-ztg-10-150
        rounded-full cursor-pointer px-ztg-3 mb-ztg-10 mr-ztg-10 ztg-transition
        ${bgClass} ${textColorClass}`}
      onClick={() => {
        const newActive = !active;
        onActiveToggle(newActive);
      }}
      data-test="tagButton"
    >
      <div
        className="px-ztg-15 text-center font-lato font-bold"
        data-test="tag"
      >
        {label}
      </div>
      <div
        className={`w-ztg-20 h-ztg-20 center rounded-full ml-auto ${iconBgClass}`}
      >
        <Icon size={14} className={`${iconColorClass}`} />
      </div>
    </div>
  );
};

export const defaultTags = [
  "Politics",
  "Governance",
  "North America",
  "China",
  "India",
  "Crypto",
  "Dotsama",
  "Zeitgeist",
  "Technology",
  "Science",
  "Pandemics",
  "Space",
  "News",
  "Sports",
  "E-sports",
  "Football",
  "MMA",
  "Cricket",
];

const TagChoices: FC<{ onTagsChange: (tags: string[]) => void }> = ({
  onTagsChange,
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([...defaultTags]);
  const [activeIndexes, setActiveIndexes] = useState<number[]>([]);

  useEffect(() => {
    const newTags = activeIndexes.reduce<string[]>((prev, curr) => {
      return [...prev, allTags[curr]];
    }, []);
    newTags.sort();
    setTags(newTags);
    onTagsChange(newTags);
  }, [activeIndexes]);

  return (
    <div className="flex flex-wrap" data-test="tagChoices">
      {allTags.map((cat, idx) => {
        return (
          <TagButton
            key={`marketCategories${idx}`}
            label={cat}
            active={activeIndexes.includes(idx)}
            onActiveToggle={(active) => {
              if (active) {
                setActiveIndexes([...activeIndexes, idx]);
              } else {
                const elIdx = activeIndexes.indexOf(idx);

                setActiveIndexes([
                  ...activeIndexes.slice(0, elIdx),
                  ...activeIndexes.slice(elIdx + 1),
                ]);
              }
            }}
          />
        );
      })}
      {/* <div className="flex w-ztg-85 h-ztg-25 items-center rounded-full border-2 border-sky-600 cursor-pointer px-ztg-3"> */}
      {/*   <div className="w-ztg-20 h-ztg-20 rounded-full center"> */}
      {/*     <Plus size={12} className="text-sky-600" /> */}
      {/*   </div> */}
      {/*   <div className="text-ztg-10-150 flex-grow text-center mr-ztg-5 text-sky-600 font-lato font-bold"> */}
      {/*     Add Tag */}
      {/*   </div> */}
      {/* </div> */}
    </div>
  );
};

export default TagChoices;
