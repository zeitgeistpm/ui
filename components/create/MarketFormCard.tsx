import { observer } from "mobx-react";
import { FC, PropsWithChildren } from "react";

const SectionTitle: FC<{ text: string; className?: string }> = ({
  text,
  className = "",
}) => {
  const classes = "text-ztg-16-150 font-bold mb-ztg-20 " + className;
  return <div className={classes}>{text}</div>;
};

const MarketFormCard: FC<PropsWithChildren<{ header: string }>> = ({
  children,
  header,
}) => {
  return (
    <div
      data-test={header}
      className="p-ztg-20 rounded-ztg-10 mb-ztg-23 bg-sky-100 dark:bg-sky-700"
    >
      <SectionTitle text={header} />
      {children}
    </div>
  );
};

export default MarketFormCard;
