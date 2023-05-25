import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@zeitgeistpm/avatara-nft-sdk";
import { useAvatarContext } from "@zeitgeistpm/avatara-react";

export const badgesRootKey = "badges";

export const useBadges = (address: string) => {
  const avatarContext = useAvatarContext();

  const query = useQuery(
    [badgesRootKey, address],
    async () => {
      return Avatar.fetchEarnedBadgesForAddress(avatarContext, address);
    },
    {
      enabled: Boolean(avatarContext && address),
    },
  );

  return query;
};
