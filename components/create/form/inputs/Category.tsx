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
        {defaultTags.map((tag) => (
          <div
            className={`center h-full cursor-pointer rounded-full p-2 transition-all ${
              value?.includes(tag) ? "bg-fog-of-war text-white" : "bg-platinum"
            }`}
            onClick={handleSelect(tag)}
          >
            <Image
              className="rounded-full mr-2"
              src={`/category/${tag.toLowerCase()}.png`}
              alt={`${tag} button icon}`}
              width={48}
              height={48}
              quality={100}
            />
            <div>{tag}</div>
          </div>
        ))}
      </div>
    );
  },
);

export default CategorySelect;
