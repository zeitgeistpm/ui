import { Skeleton } from "@material-ui/lab";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { FC } from "react";

const SectionTitle: FC<{ text: string; className?: string, dataSet?: string }> = ({
  text,
  className = "",
  dataSet,
}) => {
  const classes = "text-ztg-16-150 font-bold mb-ztg-20 font-lato outComesLabel"  + className;
  return <div data-test={dataSet} className={classes}>{text}</div>;
};

const MarketFormCard: FC<{ header: string, dataSet:string }> = observer(({ children, header,dataSet }) => {
  const store = useStore();

  if (!store.initialized) {
    return <Skeleton className="!transform-none !h-ztg-99 w-full !mb-ztg-23" />
  }
  return (
    <div className="p-ztg-20 rounded-ztg-10 mb-ztg-23 bg-sky-100 dark:bg-sky-700">
      <SectionTitle text={header} dataSet={dataSet} />
      {children}
    </div>
  );
});

export default MarketFormCard;
