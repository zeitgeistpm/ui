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
          const isMainCategory =
            isSelected && value?.findIndex((t) => t === tag) === 0;

          return (
            <div
              className={`
              relative flex gap-2 center h-full cursor-pointer rounded-full py-2 px-4 transition-all 
              ${isSelected ? "bg-fog-of-war text-white" : "bg-platinum"}
              ${isMainCategory && "bg-nyanza-base !text-gray-700"}
            `}
              onClick={handleSelect(tag)}
            >
              {isMainCategory && (
                <div className="absolute py-1 px-2 translate-x-[-50%] translate-y-[-50%] top-0 right-0 border-2 text-gray-700 border-nyanza-base bg-white rounded-full text-xxs">
                  main
                </div>
              )}

              <div className="relative h-8 w-8 md:w-12 md:h-12">
                <Image
                  className="rounded-full mr-2"
                  src={`/category/${tag.toLowerCase()}.png`}
                  alt={`${tag} button icon}`}
                  fill
                  sizes="100vw"
                  quality={100}
                />
              </div>
              <div>{tag}</div>
            </div>
          );
        })}
      </div>
    );
  },
);

export default CategorySelect;
