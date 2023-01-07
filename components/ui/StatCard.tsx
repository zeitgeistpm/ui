import { FC } from "react";

export type StatCardProps = {
  header: string;
  text: string;
  bottomText: string;
};

const StatCard: FC<StatCardProps> = ({ header, text, bottomText }) => (
  <div className="w-1/3 pr-ztg-15 ">
    <div className="rounded-ztg-10 p-ztg-15 h-full block bg-sky-100 dark:bg-black dark:text-white">
      <div className="text-ztg-12-150  font-bold bg-sky-300 dark:bg-sky-700 rounded-ztg-100 px-ztg-6 py-ztg-1 inline-block">
        {header}
      </div>
      <div className="flex flex-col mt-ztg-8 font-mono">
        <div className="text-ztg-16-150 h-ztg-24 font-bold ">{text}</div>
        <div className="text-ztg-14-150 h-ztg-24 text-sky-600">
          {bottomText}
        </div>
      </div>
    </div>
  </div>
);

export default StatCard;
