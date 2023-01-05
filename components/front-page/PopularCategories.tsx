import { observer } from "mobx-react";
import { FC, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { IGetPlaiceholderReturn } from "plaiceholder";

export const CATEGORIES = [
  { name: "Crypto", imagePath: "/category/crypto.png" },
  { name: "Governance", imagePath: "/category/governance.png" },
  { name: "Politics", imagePath: "/category/politics.png" },
  { name: "Sports", imagePath: "/category/sports.png" },
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
  const [isHoving, setIsHoving] = useState(false);

  return (
    <div
      className="flex flex-col min-w-[150px] w-full h-[184px]"
      onMouseEnter={() => setIsHoving(true)}
      onMouseLeave={() => setIsHoving(false)}
    >
      <div
        className="bg-anti-flash-white rounded-ztg-10 flex justify-center items-center h-full cursor-pointer"
        onClick={onClick}
      >
        <motion.div animate={isHoving ? { scale: 1.05 } : { scale: 1.0 }}>
          <Image
            src={imgURL}
            alt={title}
            width={100}
            height={100}
            blurDataURL={blurImage.base64}
          />
        </motion.div>
      </div>
      <span className="flex mt-[10px] items-center">
        <span className=" font-bold text-ztg-16-150">{title}</span>
        <span className="ml-auto">
          <span className="flex justify-center items-center bg-anti-flash-white rounded-ztg-5 w-[41px] h-[19px]">
            <span className="text-ztg-10-150">{count}</span>
          </span>
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
