import { observer } from "mobx-react";
import { FC } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { IGetPlaiceholderReturn } from "plaiceholder";

export const CATEGORIES = [
  { name: "Sports", imagePath: "/category/sports.png" },
  { name: "Politics", imagePath: "/category/politics.png" },
  { name: "Technology", imagePath: "/category/tech.png" },
  { name: "Crypto", imagePath: "/category/crypto.png" },
  { name: "Science", imagePath: "/category/science.png" },
  { name: "E-Sports", imagePath: "/category/esports.png" },
] as const;

const Category = ({
  title,
  imgURL,
  blurImage,
  onClick,
  count,
}: {
  title: string;
  imgURL: string;
  blurImage: IGetPlaiceholderReturn;
  onClick: () => void;
  count: number;
  className?: string;
}) => {
  return (
    <div className="flex flex-col min-w-[150px] w-full h-[184px]">
      <Image
        className=" rounded-ztg-10 cursor-pointer"
        src={imgURL}
        alt={title}
        width={170}
        height={170}
        onClick={onClick}
        placeholder="blur"
        blurDataURL={blurImage.base64}
      />
      <span className="flex mt-[10px] items-center">
        <span className="font-medium text-ztg-16-150">{title}</span>
        <span className="flex justify-center items-center bg-anti-flash-white rounded-ztg-5 w-[41px] h-[24px] ml-[10px]">
          <span className="text-ztg-12-150">{count}</span>
        </span>
      </span>
    </div>
  );
};

const PopularCategories: FC<{
  counts: number[];
  imagePlaceholders: IGetPlaiceholderReturn[];
}> = observer(({ counts, imagePlaceholders }) => {
  const router = useRouter();

  const navigateToTag = (tag: string) => {
    router.push({ pathname: "/markets", query: { tag } });
  };

  return (
    <div className="flex flex-col mt-ztg-30">
      <h3 className=" font-bold text-[28px] mb-ztg-30">Popular Categories</h3>
      <div
        className="grid w-full gap-[28px]"
        style={{
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        }}
      >
        {CATEGORIES.map((category, index) => (
          <Category
            title={category.name}
            imgURL={category.imagePath}
            blurImage={imagePlaceholders[index]}
            count={counts[index]}
            onClick={() => navigateToTag(category.name)}
          />
        ))}
      </div>
    </div>
  );
});

export default PopularCategories;
