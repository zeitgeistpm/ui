import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@zeitgeistpm/avatara-nft-sdk";
import { useAvatarContext } from "@zeitgeistpm/avatara-react";
import { encodeAddress } from "@polkadot/util-crypto";

export const useAvatarParts = (address: string) => {
  const nftSdk = useAvatarContext();

  const enabled = !!nftSdk && !!address;

  return useQuery(
    [nftSdk, address],
    async () => {
      if (!enabled) return null;

      address = encodeAddress(address, nftSdk.chainProperties.ss58Format);

      const avatar = await Avatar.fetchIndexedAvatarForAccount(nftSdk, address);

      if (!Avatar.isAvatarWithBase(avatar)) {
        return null;
      }

      const inventory = await Avatar.fetchInventoryForAvatar(nftSdk, avatar);
      console.time("orderParts");
      const ordered = Avatar.orderParts(avatar, inventory ?? []);
      console.timeEnd("orderParts");

      return ordered;
    },
    {
      enabled,
      keepPreviousData: true,
    },
  );
};
