import { SupportedTag, defaultTags } from "lib/constants/markets";
import Image from "next/image";
import { forwardRef } from "react";
import { FormEvent } from "../types";

export type CategorySelectProps = {
  name: string;
  value?: SupportedTag[];
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
      <div className="mx-auto flex flex-row flex-wrap justify-center gap-3">
        {defaultTags.map((tag, index) => {
          const isSelected = value?.includes(tag);
          return (
            <div
              key={tag}
              className={`
                center relative flex h-full cursor-pointer gap-2 rounded-full px-4 py-2 transition-all 
                duration-200 ease-in-out active:scale-95
                ${isSelected ? "bg-fog-of-war text-white" : "bg-gray-100"}
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
