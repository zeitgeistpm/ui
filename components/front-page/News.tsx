import { CmsNews } from "lib/cms/news";
import { isCurrentOrigin } from "lib/util/is-current-origin";
import Image from "next/image";
import Link from "next/link";

export const NewsSection = ({
  news,
  imagePlaceholders,
}: {
  news: CmsNews[];
  imagePlaceholders: string[];
}) => {
  return (
    <div className="mb-12">
      <h2 className="mb-6 sm:col-span-2">News</h2>
      <div className="flex flex-col gap-8 md:flex-row md:gap-4">
        {news.map((news, index) => {
          const link = news.link?.isMarket
            ? `/markets/${news.link?.market?.marketId}`
            : news.link?.url;

          const isExternalLink = link ? !isCurrentOrigin(link) : false;

          return (
            <Link
              href={link!}
              key={index}
              className="ztg-transition flex-1 md:hover:scale-[1.035]"
              target={isExternalLink ? "_blank" : "_parent"}
            >
              <div className="relative mb-3 h-52">
                <Image
                  key={index}
                  priority
                  src={news.image ?? ""}
                  alt={`Image depicting ${news.title}`}
                  placeholder="blur"
                  fill
                  blurDataURL={imagePlaceholders[index]}
                  sizes="100vw"
                  className="rounded-lg object-cover"
                  style={{
                    objectFit: "cover",
                  }}
                />
              </div>
              <div className="mb-1 font-semibold">{news.title}</div>
              <div className="text-sm font-light">{news.subtitle}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
