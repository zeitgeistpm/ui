import { SupportedTag, defaultTags } from "lib/constants/markets";
import Image from "next/image";

export type CategorySelectProps = {
  value?: SupportedTag[];
  onChange?: (value: SupportedTag[]) => void;
};

export const CategorySelect = ({ value, onChange }: CategorySelectProps) => {
  const onClickHandler = (tag: SupportedTag) => () => {
    if (onChange) {
      if (value?.includes(tag)) {
        onChange(value.filter((t) => t !== tag));
      } else {
        onChange([...(value ?? []), tag]);
      }
    }
  };

  return (
    <div className="flex flex-row flex-wrap mx-auto gap-3 justify-center">
      {defaultTags.map((tag) => (
        <div
          className={`center h-full cursor-pointer rounded-full p-2 transition-all ${
            value?.includes(tag) ? "bg-fog-of-war text-white" : "bg-platinum"
          }`}
          onClick={onClickHandler(tag)}
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
};

export default CategorySelect;
