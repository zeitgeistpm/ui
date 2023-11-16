import { decodeAddress } from "@polkadot/keyring";
import { sanitizeIpfsUrl } from "@zeitgeistpm/avatara-util";
import BoringAvatar from "boring-avatars";
import { useAvatarParts } from "lib/hooks/queries/useAvatarParts";
import Image from "next/image";
import Skeleton from "./Skeleton";

const blues = ["#0001fe", "#a000ff", "#70f8ff"];
const reds = ["#fb7ce8", "#FF0054", "#FAB400"];

const Avatar = ({
  address,
  zoomed = false,
  size = 30,
  deps,
  copy = true,
}: {
  address: string;
  zoomed?: boolean;
  size?: number;
  deps?: any[];
  copy?: boolean;
}) => {
  if (address === "") {
    return null;
  }

  const decodedAddressArray = Array.from(decodeAddress(address));
  const blue = blues[decodedAddressArray[5] % blues.length];
  const red = reds[decodedAddressArray[6] % reds.length];
  const blueFirst = decodedAddressArray[10] % 2;

  const {
    data: avatarParts,
    isLoading,
    isFetching,
    isFetched,
  } = useAvatarParts(address);

  return (
    <div
      className="z-0"
      style={{
        height: size,
        width: size,
        overflow: "hidden",
        borderRadius: "52%",
      }}
    >
      {(isFetching || isLoading) && !isFetched ? (
        <Skeleton className="h-full w-full bg-opacity-50" />
      ) : avatarParts ? (
        <div className="relative h-full w-full">
          {avatarParts.map(
            ({ part }, index) =>
              part.src && (
                <Image
                  fill
                  sizes="100vw"
                  alt={"Avatar part"}
                  key={`${address}${part.id}`}
                  className="absolute left-0 top-0 scale-125"
                  style={{ zIndex: index + 1 }}
                  src={sanitizeIpfsUrl(part.src)}
                />
              ),
          )}
        </div>
      ) : (
        <BoringAvatar
          size={size}
          name={decodedAddressArray.join("")}
          variant="beam"
          colors={blueFirst ? [blue, red] : [red, blue]}
        />
      )}
    </div>
  );
};

export default Avatar;
