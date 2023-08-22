import Image from "next/image";
import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";

interface ActionableCardProps {
  title: string;
  description: string;
  link: string;
  linkText: string;
  img: string;
  timeUsage: string;
}

export const ActionableCard = ({
  title,
  description,
  link,
  linkText,
  img,
  timeUsage,
}: ActionableCardProps) => {
  return (
    <div className="w-full rounded-md py-5 px-7 bg-white flex flex-col">
      <div className="mb-6 flex-1">
        <h6 className="font-semibold text-xl mb-4">{title}</h6>
        <div className="flex gap-4">
          <Image
            src={img}
            width={84}
            height={80}
            alt={title}
            className="flex-shrink-0 w-[84px] h-[80px]"
          />
          <p className="text-ztg-14-150">{description}</p>
        </div>
      </div>
      <div className="flex md:flex-col lg:flex-row gap-2">
        <div className="text-blue-500 flex items-center gap-1 flex-1">
          <Link href={link} className="flex flex-col">
            {linkText}
          </Link>
          <FiChevronRight size={20} />
        </div>
        <div className="">
          <div className="inline-block text-sm bg-gray-200 rounded-md py-1 px-2">
            {timeUsage}
          </div>
        </div>
      </div>
    </div>
  );
};
