import BoringAvatar from "boring-avatars";
import { decodeAddress } from "@polkadot/keyring";
import { observer } from "mobx-react";

const blues = ["#0001fe", "#a000ff", "#70f8ff"];
const reds = ["#fb7ce8", "#FF0054", "#FAB400"];

const Avatar = observer(
  ({ address, size = 30 }: { address: string; size?: number }) => {
    if (address === "") {
      return null;
    }
    const decodedAddressArray = Array.from(decodeAddress(address));

    const blue = blues[decodedAddressArray[5] % blues.length];
    const red = reds[decodedAddressArray[6] % reds.length];
    const blueFirst = decodedAddressArray[10] % 2;

    return (
      <BoringAvatar
        size={size}
        name={decodedAddressArray.join("")}
        variant="beam"
        colors={blueFirst ? [blue, red] : [red, blue]}
      />
    );
  }
);

export default Avatar;
