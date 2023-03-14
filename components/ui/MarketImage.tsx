import { observer } from "mobx-react";
import Image from "next/image";
import { MarketImageString } from "lib/types/create-market";
import useMarketImageUrl from "lib/hooks/useMarketImageUrl";

const MarketImage = observer(
  ({
    image,
    alt = "",
    className = "",
    size = "70px",
    status = "",
  }: {
    image: MarketImageString;
    className?: string;
    alt?: string;
    size?: string;
    status?: string;
  }) => {
    const imageUrl = useMarketImageUrl(image);
    return (
      <div
        className={`relative rounded-full flex-shrink-0 overflow-hidden ${
          status === "Active" && "border-[15px] border-green-lighter"
        } ${className} `}
        style={{ width: size, height: size }}
      >
        <Image
          alt={alt ?? "Market image"}
          src={imageUrl}
          fill
          className="rounded-full"
          style={{
            objectFit: "cover",
            objectPosition: "50% 50%",
          }}
          sizes={size}
        />
      </div>
    );
  },
);

export default MarketImage;
