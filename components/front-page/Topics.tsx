import Carousel from "components/ui/Carousel";
import { CmsTopicHeader } from "lib/cms/topics";
import { chunk, isObject, isString } from "lodash-es";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

export const Topics = ({
  topics,
  imagePlaceholders,
  selectedTopic,
  onClick,
}: {
  topics: CmsTopicHeader[];
  imagePlaceholders: string[];
  selectedTopic?: CmsTopicHeader | string;
  onClick?: (topic: CmsTopicHeader) => void;
}) => {
  const router = useRouter();

  return (
    <>
      <div className="hidden w-full gap-3 md:flex">
        {topics.map((topic, index) => {
          return (
            //TODO: temp solution. waiting for login
            topic.slug !== "memecoin-markets" && (
              <Link
                key={index}
                href={`/topics/${topic.slug}`}
                className={`
            ztg-transition flex flex-1 cursor-pointer items-center gap-4 rounded-lg p-3 transition-all md:max-w-sm md:hover:scale-[1.015]
              ${
                (isString(selectedTopic) && selectedTopic === topic.slug) ||
                (isObject(selectedTopic) && selectedTopic.slug === topic.slug)
                  ? "bg-gray-200"
                  : "bg-white"
              }
            `}
                onClick={(e) => {
                  if (onClick) {
                    e.preventDefault();
                    onClick(topic);
                  } else {
                    router.push(`/topics/${topic.slug}`);
                  }
                }}
              >
                <div className="relative h-10 w-10">
                  <Image
                    key={index}
                    priority
                    src={topic.thumbnail ?? ""}
                    alt={`Image for topic ${topic.title}`}
                    placeholder="blur"
                    blurDataURL={imagePlaceholders[index]}
                    fill
                    sizes="100vw"
                    className="rounded-lg object-cover"
                    style={{
                      objectFit: "cover",
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-base text-sm text-gray-800">
                    {topic.title}
                  </h3>
                </div>
              </Link>
            )
          );
        })}
      </div>
      <div className="relative block w-full md:hidden">
        <Carousel
          options={{ align: "start", duration: 10 }}
          css={{
            width: "100%",
          }}
          slides={chunk(topics, 3).map((topics, index) => (
            <div className="flex gap-2">
              {topics.map((topic, index) => {
                return (
                  topic.slug !== "gaza" && (
                    <Link
                      href={`/topics/${topic.slug}`}
                      key={index}
                      className="flex flex-1 cursor-pointer items-center gap-4 rounded-lg bg-white p-2 transition-all hover:bg-gray-200 hover:bg-opacity-30 md:max-w-sm"
                    >
                      <div className="relative h-10 w-10">
                        <Image
                          key={index}
                          priority
                          src={topic.thumbnail ?? ""}
                          alt={`Image for topic ${topic.title}`}
                          placeholder="blur"
                          blurDataURL={imagePlaceholders[index]}
                          fill
                          sizes="100vw"
                          className="rounded-lg object-cover"
                          style={{
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-base text-sm text-gray-800">
                          {topic.title}
                        </h3>
                      </div>
                    </Link>
                  )
                );
              })}
            </div>
          ))}
        />
      </div>
    </>
  );
};
