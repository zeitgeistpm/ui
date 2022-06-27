import BoringAvatar from "boring-avatars";
import { decodeAddress } from "@polkadot/keyring";
import { observer } from "mobx-react";
import { ZeitgeistAvatar } from "@zeitgeistpm/avatara-react";

const blues = ["#0001fe", "#a000ff", "#70f8ff"];
const reds = ["#fb7ce8", "#FF0054", "#FAB400"];

const Avatar = observer(
  ({
    address,
    zoomed = false,
    size = 30,
  }: {
    address: string;
    zoomed?: boolean;
    size?: number;
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
        style={{
          height: size,
          width: size,
          overflow: "hidden",
          borderRadius: "52%",
        }}
      >
        <ZeitgeistAvatar
          zoomed={zoomed}
          address={address}
          size={size}
          fallback={
            <BoringAvatar
              size={size}
              name={decodedAddressArray.join("")}
              variant="beam"
              colors={blueFirst ? [blue, red] : [red, blue]}
            />
          }
        />
      </div>
    );
  }
);

export default Avatar;
