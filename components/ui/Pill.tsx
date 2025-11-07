import { FC, PropsWithChildren } from "react";

const Pill: FC<PropsWithChildren<{ title: string; value: string }>> = ({
  title,
  value,
  children,
}) => {
  return (
    <div
      className="mb-ztg-10 mr-ztg-15 flex w-full min-w-[90px] max-w-[170px] 
      justify-center rounded-ztg-100 bg-ztg-primary-200 py-ztg-5 text-ztg-12-150 dark:bg-border-dark"
    >
      <span className="mr-ztg-3 font-bold">{title}: </span>
      <span className="">{value}</span>
      {children}
    </div>
  );
};

export default Pill;
