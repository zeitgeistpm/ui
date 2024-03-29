import { createSdkContext } from "@zeitgeistpm/avatara-nft-sdk";

export const createAvatarSdk = () => {
  return createSdkContext({
    api: process.env.NEXT_PUBLIC_AVATAR_API_HOST!,
    ipfs: { node: { url: process.env.NEXT_PUBLIC_IPFS_NODE! } },
    rpc: process.env.NEXT_PUBLIC_RMRK_CHAIN_RPC_NODE!,
    indexer: process.env.NEXT_PUBLIC_RMRK_INDEXER_API!,
    avatarCollectionId: process.env.NEXT_PUBLIC_AVATAR_COLLECTION_ID!,
    badgeCollectionId: process.env.NEXT_PUBLIC_BADGE_COLLECTION_ID!,
    avatarBaseId: process.env.NEXT_PUBLIC_AVATAR_BASE_ID!,
    prerenderUrl: process.env.NEXT_PUBLIC_RMRK_PRERENDER_URL!,
  });
};
