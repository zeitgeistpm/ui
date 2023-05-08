import {
  isMarketImageBase64Encoded,
  MarketImageString,
} from "lib/types/create-market";
import Image from "next/image";
import { useEffect, useState } from "react";

const getImageUrl = (image: MarketImageString) => {
  if (isMarketImageBase64Encoded(image)) {
    return image;
  }
  return `https://ipfs-gateway.zeitgeist.pm/ipfs/${image}`;
};

const fallbackImageUrl = "/icons/default-market.png";

const MarketImage = ({
  image,
  alt = "",
  className = "",
  size = "70px",
  status = "",
}: {
  image?: MarketImageString;
  className?: string;
  alt?: string;
  size?: string;
  status?: string;
}) => {
  const [imageUrl, setImageUrl] = useState<string>(fallbackImageUrl);

  const onError = () => {
    setImageUrl(fallbackImageUrl);
  };

  useEffect(() => {
    if (image == null) {
      return;
    }
    return setImageUrl(getImageUrl(image));
  }, [image]);

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
        className="overflow-hidden"
        style={{
          objectFit: "cover",
          objectPosition: "50% 50%",
        }}
        sizes={size}
        onError={onError}
        blurDataURL={fallbackImageUrl}
        placeholder="blur"
      />
    </div>
  );
};

export default MarketImage;
