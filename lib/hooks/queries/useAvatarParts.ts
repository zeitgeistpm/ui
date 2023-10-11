import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { Avatar, SdkContext } from "@zeitgeistpm/avatara-nft-sdk";
import { useAvatarContext } from "@zeitgeistpm/avatara-react";
import { encodeAddress } from "@polkadot/util-crypto";

export const avatarPartsKey = "avatar-parts";

export const useAvatarParts = (
  address: string,
): UseQueryResult<ReturnType<typeof Avatar.orderParts>> => {
  const nftSdk = useAvatarContext();

  const enabled = !!nftSdk && !!address;

  return useQuery(
    [avatarPartsKey, address],
    async () => {
      if (!enabled) return null;

      return getAvatarParts(nftSdk, address);
    },
    {
      enabled,
      keepPreviousData: true,
      staleTime: 100_000,
    },
  );
};

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
