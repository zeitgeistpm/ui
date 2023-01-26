import type { ApiPromise } from "@polkadot/api";

export const getApiAtBlock = async (
  api: ApiPromise,
  blockNumber?: number,
): Promise<ApiPromise> => {
  if (blockNumber != null) {
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    const apiAt = (await api.at(blockHash)) as ApiPromise;
    return apiAt;
  } else {
    return api;
  }
};
