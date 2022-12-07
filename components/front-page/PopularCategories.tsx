import { Skeleton } from "@material-ui/lab";
import { TagCounts } from "lib/gql/popular-categories";
import { useMarketsUrlQuery } from "lib/hooks/useMarketsUrlQuery";
import { observer } from "mobx-react";
import { FC, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const Category = ({
  title,
  imgURL,
  onClick,
  count,
}: {
  title: string;
  imgURL: string;
  onClick: () => void;
  count: number;
  className?: string;
}) => {
  const [isHoving, setIsHoving] = useState(false);

  return (
    <div
      className="flex flex-col min-w-[150px] w-full h-[184px]"
      onMouseEnter={() => setIsHoving(true)}
      onMouseLeave={() => setIsHoving(false)}
    >
      <div
        className="bg-anti-flash-white rounded-ztg-10 flex justify-center items-center h-full cursor-pointer"
        onClick={onClick}
      >
        <motion.div animate={isHoving ? { scale: 1.05 } : { scale: 1.0 }}>
          <Image src={imgURL} alt={title} width={100} height={100} />
        </motion.div>
      </div>
      <span className="flex mt-[10px] items-center">
        <span className=" font-bold text-ztg-16-150">{title}</span>
        <span className="ml-auto">
          <span className="flex justify-center items-center bg-anti-flash-white rounded-ztg-5 w-[41px] h-[19px]">
            <span className="text-ztg-10-150">{count}</span>
          </span>
        </span>
      </span>
    </div>
  );
};

const PopularCategories: FC<{ tagCounts: TagCounts }> = observer(
  ({ tagCounts }) => {
    const query = useMarketsUrlQuery();

    const navigateToTag = (tag: string) => {
      query.updateQuery({
        tag,
      });
    };

    return (
      <div className="flex flex-col mt-ztg-30">
        <h3 className=" font-bold text-[28px] mb-ztg-30">Popular Categories</h3>
        <div
          className="grid w-full gap-[28px]"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          }}
        >
          <Category
            title="Sports"
            imgURL="/topics/sports.png"
            count={tagCounts.sports}
            onClick={() => navigateToTag("Sports")}
          />
          <Category
            title="Politics"
            imgURL="/topics/politics.png"
            count={tagCounts.politics}
            onClick={() => navigateToTag("Politics")}
          />
          <Category
            title="Governance"
            imgURL="/topics/governance.png"
            count={tagCounts.governance}
            onClick={() => navigateToTag("Governance")}
          />
          <Category
            title="Crypto"
            imgURL="/topics/crypto.png"
            count={tagCounts.crypto}
            onClick={() => navigateToTag("Crypto")}
          />
        </div>
      </div>
    );
  },
);

export default PopularCategories;
