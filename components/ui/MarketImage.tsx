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
          "w-[40px] h-[40px] sm:w-[60px] sm:h-[60px] rounded-full flex-shrink-0 relative overflow-hidden" +
          className
        }
      >
        <Image
          alt={alt}
          src={imageUrl}
          fill
          className="rounded-full"
          style={{ objectFit: "cover", objectPosition: "50% 50%" }}
          sizes="60px"
        />
      </div>
    );
  },
);

export default MarketImage;
