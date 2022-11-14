import Link from "next/link";
import React, { FC } from "react";

export interface SubMenuItemProps {
  label: string;
  detail?: string;
  href?: string;
  active: boolean;
  showDot?: boolean;
  onClick: () => void;
}

const SubMenuItem: FC<SubMenuItemProps> = ({
  label,
  active,
  href,
  detail,
  showDot = true,
  onClick,
}) => {
  const Wrap: FC = ({ children }) =>
    href == null ? <div>{children}</div> : <Link href={href}>{children}</Link>;

  return (
    <Wrap>
      <div
        className={`cursor-pointer h-ztg-56 flex items-center py-ztg-16 ml-ztg-24 
        text-ztg-16-150 font-lato ${
          active
            ? "font-bold text-black dark:text-white"
            : "font-medium text-sky-600"
        }
        ${showDot ? "mr-ztg-37" : "mr-ztg-28"}
        `}
        onClick={onClick}
      >
        {active && showDot ? (
          <div className="bg-ztg-blue w-ztg-5 h-ztg-5 rounded-full ml-ztg-25"></div>
        ) : (
          <></>
        )}
        <span
          className={`ztg-transition text-sky-600 hover:text-black dark:hover:text-white ${
            active && showDot ? "ml-ztg-25" : showDot ? "ml-ztg-55" : ""
          }`}
        >
          {label}
        </span>
        {detail ? (
          <span
            className={`${
              active ? "text-ztg-blue " : "text-sky-600"
            } text-ztg-10-150 ml-auto font-bold`}
          >
            {" "}
            {detail}
          </span>
        ) : (
          <></>
        )}
      </div>
    </Wrap>
  );
};

export default SubMenuItem;
