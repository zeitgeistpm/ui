import { Skeleton } from "@material-ui/lab";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { FC, PropsWithChildren } from "react";

const SectionTitle: FC<{ text: string; className?: string }> = ({
  text,
  className = "",
}) => {
  const classes = "text-ztg-16-150 font-bold mb-ztg-20 " + className;
  return <div className={classes}>{text}</div>;
};

const MarketFormCard: FC<PropsWithChildren<{ header: string }>> = observer(
  ({ children, header }) => {
    const store = useStore();

    if (!store.initialized) {
      return (
        <Skeleton className="!transform-none !h-ztg-99 w-full !mb-ztg-23" />
      );
    }
    return (
      <div
        data-test={header}
        className="p-ztg-20 rounded-ztg-10 mb-ztg-23 bg-sky-100 dark:bg-sky-700"
      >
        <SectionTitle text={header} />
        {children}
      </div>
    );
  },
);

export default MarketFormCard;
