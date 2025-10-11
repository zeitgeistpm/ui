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
            <div
              key={tag}
              className={`
                center relative flex h-full cursor-pointer gap-1.5 rounded-full px-3 py-1.5 text-sm backdrop-blur-md transition-all
                duration-200 ease-in-out active:scale-95
                ${
                  isSelected
                    ? "border-2 border-sky-600/50 bg-sky-600/90 text-white shadow-md"
                    : "border-2 border-sky-200/30 bg-white/80 text-sky-900 hover:bg-sky-100/80"
                }
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
