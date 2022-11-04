import { observer } from "mobx-react";
import { MarketImageString } from "lib/types/create-market";
import useImageUrlString from "lib/hooks/useMarketImageUrl";

const MarketImage = observer(
  ({
    image,
    className = "",
  }: {
    image: MarketImageString;
    className?: string;
  }) => {
    const imageUrl = useImageUrlString(image);
    return (
      <div
        className={
          "w-ztg-70 h-ztg-70 rounded-ztg-10 flex-shrink-0 " + className
        }
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      ></div>
    );
  },
);

export default MarketImage;
