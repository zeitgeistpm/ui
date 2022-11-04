import { observer } from "mobx-react";
import Image from "next/image";
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
      <Image
        src={imageUrl}
        width={70}
        height={70}
        className={"rounded-[10px] " + className}
      />
    );
  },
);

export default MarketImage;
