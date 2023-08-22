import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "react-feather";

type ActionCardProps = {
  imageUrl: string;
  title: string;
  description: string;
  actionUrl: string;
  actionText: string;
  pillLabel: string;
  className?: string;
};

const ActionCard: React.FC<ActionCardProps> = ({
  imageUrl,
  title,
  description,
  actionUrl,
  actionText,
  pillLabel,
  className = "",
}) => {
  return (
    <div
      className={
        "px-5 py-2 bg-white rounded-lg flex flex-col justify-between hover:bg-pastel-blue duration-500 transition " +
        className
      }
    >
      <h3 className="p-2 font-bold">{title}</h3>
      <div className="flex p-2">
        <Image
          src={imageUrl}
          alt={title}
          width={69}
          height={69}
          quality={100}
          className="rounded-md"
        />
        <p className="ml-4">{description}</p>
      </div>
      <div className="flex items-center p-2">
        <div className="flex-grow">
          <Link
            className="text-blue font-medium inline-flex items-center"
            href={actionUrl}
            shallow
          >
            {actionText} <ChevronRight size={22} />
          </Link>
        </div>
        <div className="bg-mystic py-1 px-2 text-sm rounded-md">
          {pillLabel}
        </div>
      </div>
    </div>
  );
};

export default ActionCard;
