import { Input } from "components/ui/inputs";
import React, { FC, useRef } from "react";
import Form from "mobx-react-form";
import { Edit3, Image as ImageIcon } from "react-feather";

export interface MarketSlugProps {
  slug: string;
  textMaxLength: number;
  base64Image?: string;
  onSlugChange: (id: string) => void;
  onImageChange: (file: File) => void;
  form: Form;
}

const imageMaxSize = Number(process.env.NEXT_PUBLIC_MARKET_IMAGE_MAX_KB) * 1000;

const MarketSlugField: FC<MarketSlugProps> = ({
  slug,
  base64Image,
  onSlugChange,
  onImageChange,
  textMaxLength,
  form,
}) => {
  const fileInputRef = useRef(null);
  const marketSlug = useRef();

  const changeImage = (file?: File) => {
    if (file == null) {
      return;
    }
    if (file.size > imageMaxSize) {
      window.alert(
        `Image size greater than ${
          imageMaxSize / 1000
        } kilobytes is not allowed`,
      );
      return;
    }
    onImageChange(file);
  };

  return (
    <div className="flex" data-test="marketSlugField">
      <div className="w-ztg-70 h-ztg-70 rounded-ztg-10 center relative mr-ztg-20 bg-sky-600">
        {base64Image == null && <ImageIcon size={20} color="#fff" />}
        {base64Image != null && (
          <img src={base64Image} className="w-full h-full rounded-ztg-10" />
        )}
        <div className="h-ztg-24 w-ztg-24 rounded-full absolute top-ztg-6 -right-ztg-12 center bg-white dark:bg-black">
          <Edit3
            size={14}
            className="cursor-pointer text-sky-600"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          />
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/jpeg, image/png"
            onChange={(e) => {
              changeImage(e.target.files[0]);
            }}
          />
        </div>
      </div>
      <Input
        data-test="slugFieldInput"
        form={form}
        type="text"
        ref={marketSlug}
        placeholder="who-will-win"
        className="w-ztg-247"
        value={slug}
        maxLength={textMaxLength}
        name="slug"
        autoComplete="off"
        onChange={(e) => {
          onSlugChange(e.target.value);
        }}
      />
    </div>
  );
};

export default MarketSlugField;
