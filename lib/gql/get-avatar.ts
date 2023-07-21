import { Avatar, SdkContext } from "@zeitgeistpm/avatara-nft-sdk";
import { encodeAddress } from "@polkadot/util-crypto";

export const getAvatarParts = async (
  avatarSdk: SdkContext,
  address: string,
) => {
  const encodedAddress = encodeAddress(
    address,
    avatarSdk.chainProperties.ss58Format,
  );
  const avatar = await Avatar.fetchIndexedAvatarForAccount(
    avatarSdk,
    encodedAddress,
  );

  if (!Avatar.isAvatarWithBase(avatar)) return null;
  const inventory = await Avatar.fetchInventoryForAvatar(avatarSdk, avatar);

  const orderedParts = await Avatar.orderParts(avatar, inventory ?? []);
  return orderedParts;
};
