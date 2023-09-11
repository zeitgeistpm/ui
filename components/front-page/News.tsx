import { News } from "lib/cms/get-news";
import { isCurrentOrigin } from "lib/util/is-current-origin";
import Image from "next/image";
import Link from "next/link";

export const NewsSection = ({
  news,
  imagePlaceholders,
}: {
  news: News[];
  imagePlaceholders: string[];
}) => {
  return (
    <div className="mb-12">
      <h2 className="sm:col-span-2 text-center sm:text-start mb-6">News</h2>
      <div className="flex flex-col md:flex-row gap-8 md:gap-4">
        {news.map((news, index) => {
          const isExternalLink = news.ctaLink
            ? !isCurrentOrigin(news.ctaLink)
            : false;

          return (
            <Link
              href={news.ctaLink!}
              key={index}
              className="flex-1 ztg-transition md:hover:scale-105"
              target={isExternalLink ? "_blank" : "_parent"}
            >
              <div className="relative h-52 mb-3">
                <Image
                  key={index}
                  priority
                  src={news.imageUrl ?? ""}
                  alt={`Image depicting ${news.title}`}
                  placeholder="blur"
                  fill
                  blurDataURL={imagePlaceholders[index]}
                  sizes="100vw"
                  className="object-cover rounded-lg"
                  style={{
                    objectFit: "cover",
                  }}
                />
              </div>
              <h4 className="mb-1 font-semibold">{news.title}</h4>
              <h5 className="text-base font-light">{news.subtitle}</h5>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
