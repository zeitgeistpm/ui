import { decodeAddress } from "@polkadot/keyring";
import BoringAvatar from "boring-avatars";

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
      <BoringAvatar
        size={size}
        name={decodedAddressArray.join("")}
        variant="beam"
        colors={blueFirst ? [blue, red] : [red, blue]}
      />
    </div>
  );
};

export default Avatar;
