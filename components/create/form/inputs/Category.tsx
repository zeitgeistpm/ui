import { SupportedTag, defaultTags } from "lib/constants/markets";
import Image from "next/image";
import { forwardRef } from "react";
import { FormEvent } from "../types";

export type CategorySelectProps = {
  name: string;
  value: SupportedTag[];
  onBlur: (event: FormEvent<SupportedTag[]>) => void;
  onChange: (event: FormEvent<SupportedTag[]>) => void;
};

export const CategorySelect = forwardRef(
  ({ name, value, onChange, onBlur }: CategorySelectProps) => {
    const handleSelect = (tag: SupportedTag) => () => {
      let newTags: SupportedTag[];

      if (value?.includes(tag)) {
        newTags = value.filter((t) => t !== tag);
      } else {
        newTags = [...(value ?? []), tag];
      }

      onChange({ target: { name, value: newTags }, type: "change" });

      setTimeout(() => {
        onBlur({ target: { name, value: newTags }, type: "blur" });
      }, 5);
    };

    return (
      <div className="flex flex-row flex-wrap mx-auto gap-3 justify-center">
        {defaultTags.map((tag, index) => {
          const isSelected = value?.includes(tag);
          return (
            <div
              className={`
              relative flex gap-2 center h-full cursor-pointer rounded-full py-2 px-4 transition-all 
              ease-in-out active:scale-95 duration-200
              ${isSelected ? "bg-fog-of-war text-white" : "bg-platinum"}
            `}
              onClick={handleSelect(tag)}
            >
              <div>{tag}</div>
            </div>
          );
        })}
      </div>
    );
  },
);

export default CategorySelect;
