import { CmsTopicHeader } from "lib/cms/topics";
import Image from "next/image";
import Link from "next/link";

export const Topics = ({
  topics,
  imagePlaceholders,
}: {
  topics: CmsTopicHeader[];
  imagePlaceholders: string[];
}) => {
  return (
    <>
      {topics.map((topic, index) => (
        <Link
          href={`/topics/${topic.slug}`}
          key={index}
          className="flex flex-1 cursor-pointer items-center gap-4 rounded-lg bg-white p-2 transition-all hover:bg-gray-200 hover:bg-opacity-30"
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
            <h3 className="font-base text-sm text-gray-800">{topic.title}</h3>
          </div>
        </Link>
      ))}
    </>
  );
};
