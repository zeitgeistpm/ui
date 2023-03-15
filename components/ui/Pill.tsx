import { FC, PropsWithChildren } from "react";

const Pill: FC<PropsWithChildren<{ title: string; value: string }>> = ({
  title,
  value,
  children,
}) => {
  return (
    <div
      className="flex w-full justify-center bg-sky-200 dark:bg-border-dark rounded-ztg-100 
      text-ztg-12-150 py-ztg-5 mr-ztg-15 mb-ztg-10 min-w-[90px] max-w-[170px]"
    >
      <span className="font-bold mr-ztg-3">{title}: </span>
      <span className="">{value}</span>
      {children}
    </div>
  );
};

export default Pill;
