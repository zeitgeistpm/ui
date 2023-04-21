import { observer } from "mobx-react";
import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export const CATEGORIES = [
  { name: "Sports", imagePath: "/category/sports.png" },
  { name: "Politics", imagePath: "/category/politics.png" },
  { name: "Technology", imagePath: "/category/technology.png" },
  { name: "Crypto", imagePath: "/category/crypto.png" },
  { name: "Science", imagePath: "/category/science.png" },
  { name: "E-Sports", imagePath: "/category/e-sports.png" },
  { name: "News", imagePath: "/category/news.png" },
  { name: "Dotsama", imagePath: "/category/dotsama.png" },
  { name: "Zeitgeist", imagePath: "/category/zeitgeist.png" },
] as const;

const Category = ({
  title,
  imgURL,
  blurImage,
  count,
}: {
  title: string;
  imgURL: string;
  blurImage: string;
  count: number;
  className?: string;
}) => {
  return (
    <div
      className="flex flex-col w-full max-w-[230px] min-w-[80px] md:hover:scale-105 ztg-transition"
      data-testid="category"
    >
      <div className="relative max-w-[230px] max-h-[230px] w-full h-full aspect-square">
        <Link href={`/markets/?tag=${title}#market-list`}>
          <Image
            className="rounded-ztg-10 cursor-pointer"
            src={imgURL}
            alt={title}
            fill
            placeholder={blurImage ? "blur" : "empty"}
            blurDataURL={blurImage}
            sizes="(max-width: 1000px) 230px, 130px"
          />
        </Link>
      </div>
      <span className="flex flex-col lg:flex-row lg:items-center mt-[10px]">
        <span
          className="font-medium text-ztg-16-150 line-clamp-1"
          data-testid="categoryTitle"
        >
          {title}
        </span>
        <span className="flex justify-center items-center bg-anti-flash-white rounded-ztg-5 w-[41px] h-[24px] mt-[8px] lg:mt-0 lg:ml-[10px]">
          <span className="text-ztg-12-150">{count}</span>
        </span>
      </span>
    </div>
  );
};

const PopularCategories: FC<{
  counts: number[];
  imagePlaceholders: string[];
}> = observer(({ counts, imagePlaceholders }) => {
  const topCategories = CATEGORIES.map((category, index) => ({
    ...category,
    count: counts[index],
    placeholder: imagePlaceholders[index],
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div className="flex flex-col mt-ztg-30" data-testid="popularCategories">
      <h2 className="mb-7 text-center sm:text-start">Popular Categories</h2>
      <div className="flex gap-x-[20px] overflow-x-auto no-scroll-bar md:overflow-x-visible">
        {topCategories.map((category, index) => (
          <Category
            key={index}
            title={category.name}
            imgURL={category.imagePath}
            blurImage={category.placeholder}
            count={category.count}
          />
        ))}
      </div>
    </div>
  );
});

export default PopularCategories;
