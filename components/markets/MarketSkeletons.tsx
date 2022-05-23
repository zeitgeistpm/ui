import { Skeleton } from "@material-ui/lab";

const MarketSkeletons = ({ pageSize }: { pageSize: number }) => {
  const indexes = [...new Array(pageSize)].map((_, idx) => idx);
  return (
    <div>
      {indexes.map((idx) => {
        return (
          <Skeleton
            height={136}
            className="!rounded-ztg-10 !mb-ztg-15 !transform-none"
            key={idx}
          />
        );
      })}
    </div>
  );
};

export default MarketSkeletons;
