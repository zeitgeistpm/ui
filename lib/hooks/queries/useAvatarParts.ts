import { UseQueryResult, useQuery } from "@tanstack/react-query";
import { Avatar } from "@zeitgeistpm/avatara-nft-sdk";
import { useAvatarContext } from "@zeitgeistpm/avatara-react";
import { encodeAddress } from "@polkadot/util-crypto";

export const ROOT_KEY = "avatar-parts";

export const useAvatarParts = (
  address: string,
): UseQueryResult<ReturnType<typeof Avatar.orderParts>> => {
  const nftSdk = useAvatarContext();

  const enabled = !!nftSdk && !!address;

  return useQuery(
    [ROOT_KEY, address],
    async () => {
      if (!enabled) return null;

      address = encodeAddress(address, nftSdk.chainProperties.ss58Format);

      const avatar = await Avatar.fetchIndexedAvatarForAccount(nftSdk, address);

      if (!Avatar.isAvatarWithBase(avatar)) {
        return null;
      }

      const inventory = await Avatar.fetchInventoryForAvatar(nftSdk, avatar);

      const ordered = Avatar.orderParts(avatar, inventory ?? []);

      return ordered;
    },
    {
      enabled,
      keepPreviousData: true,
    },
  );
};
