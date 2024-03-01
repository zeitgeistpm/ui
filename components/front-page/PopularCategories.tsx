import { FC } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCategoryCounts } from "lib/hooks/queries/useCategoryCounts";

export const CATEGORIES = [
  { name: "Sports", imagePath: "/category/sports.png" },
  { name: "Politics", imagePath: "/category/politics.png" },
  { name: "Technology", imagePath: "/category/technology.png" },
  { name: "Crypto", imagePath: "/category/crypto.png" },
  { name: "Science", imagePath: "/category/science.png" },
  { name: "News", imagePath: "/category/news.png" },
  { name: "Dotsama", imagePath: "/category/dotsama.png" },
  { name: "Zeitgeist", imagePath: "/category/zeitgeist.png" },
  { name: "Entertainment", imagePath: "/category/entertainment.png" },
  { name: "Finance", imagePath: "/category/finance.png" },
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
      className="ztg-transition flex w-full min-w-[80px] flex-1 flex-col md:hover:scale-[1.035]"
      data-testid="category"
    >
      <div className="relative aspect-square h-full w-full">
        <Link
          href={`/markets?status=Active&tag=${title}#market-list`}
          className="relative block h-full w-full"
        >
          <Image
            className="cursor-pointer rounded-ztg-10"
            src={imgURL}
            alt={title}
            fill
            placeholder={blurImage ? "blur" : "empty"}
            blurDataURL={blurImage}
            sizes="(max-width: 1000px) 230px, 130px"
          />
        </Link>
      </div>
      <span className="mt-[10px] flex flex-col lg:flex-row lg:items-center">
        <span
          className="line-clamp-1 text-ztg-16-150 font-medium"
          data-testid="categoryTitle"
        >
          {title}
        </span>
        <span className="mt-[8px] flex h-[24px] w-[41px] items-center justify-center rounded-ztg-5 bg-anti-flash-white lg:ml-[10px] lg:mt-0">
          <span className="text-ztg-12-150">{count}</span>
        </span>
      </span>
    </div>
  );
};

const PopularCategories: FC<{
  imagePlaceholders: string[];
}> = ({ imagePlaceholders }) => {
  const { data: counts } = useCategoryCounts();

  const topCategories = CATEGORIES.map((category, index) => ({
    ...category,
    count: counts?.[index] ?? 0,
    placeholder: imagePlaceholders[index],
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div className="flex flex-col" data-testid="popularCategories">
      <h2 className="mb-7">Popular Categories</h2>
      <div className="no-scroll-bar flex gap-4 overflow-x-auto md:overflow-x-visible">
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
};

export default PopularCategories;
