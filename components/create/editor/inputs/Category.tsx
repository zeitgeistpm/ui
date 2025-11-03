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
      <div className="flex flex-row flex-wrap justify-start gap-2">
        {defaultTags.map((tag, index) => {
          const isSelected = value?.includes(tag);
          return (
            <button
              type="button"
              key={tag}
              className={`
                center relative flex cursor-pointer gap-1.5 rounded-lg border-2 px-4 py-3 text-sm font-semibold backdrop-blur-sm transition-all
                duration-200 ease-in-out active:scale-95 touch-manipulation
                ${
                  isSelected
                    ? "border-ztg-green-600/80 bg-ztg-green-600/90 text-white shadow-md hover:bg-ztg-green-600 hover:border-ztg-green-500"
                    : "border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30"
                }
              `}
              onClick={handleSelect(tag)}
            >
              <div>{tag}</div>
            </button>
          );
        })}
      </div>
    );
  },
);

export default CategorySelect;
