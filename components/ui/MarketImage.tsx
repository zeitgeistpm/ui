import { observer } from "mobx-react";
import Image from "next/image";
import { MarketImageString } from "lib/types/create-market";
import useMarketImageUrl from "lib/hooks/useMarketImageUrl";

const MarketImage = observer(
  ({
    image,
    alt = "",
    className = "",
  }: {
    image: MarketImageString;
    className?: string;
    alt?: string;
  }) => {
    const imageUrl = useMarketImageUrl(image);
    return (
      <div
        className={
          "w-[70px] h-[70px] rounded-[10px] flex-shrink-0 relative overflow-hidden relative" +
          className
        }
      >
        <Image
          alt="market image"
          src={imageUrl}
          fill
          className="rounded-[10px]"
          style={{ objectFit: "cover", objectPosition: "50% 50%" }}
        />
      </div>
    );
  },
);

export default MarketImage;
