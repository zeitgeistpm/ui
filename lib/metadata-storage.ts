import { u8aToString } from "@polkadot/util";
import { u8aConcat } from "@polkadot/util/u8a";
import {
  MarketMetadata,
  MetadataStorage,
  createStorage,
} from "@zeitgeistpm/sdk";
import { Codec, JsonCodec } from "@zeitgeistpm/utility/dist/codec";
import * as O from "@zeitgeistpm/utility/dist/option";
import * as Te from "@zeitgeistpm/utility/dist/taskeither";
import { Storage, StorageError } from "@zeitgeistpm/web3.storage";
import * as IPFSHTTPClient from "ipfs-http-client";
import { CID } from "multiformats/cid";

const node = IPFSHTTPClient.create({
  url: process.env.NEXT_PUBLIC_IPFS_NODE_URL,
});

export const createMetadataStorage = (): MetadataStorage<MarketMetadata> => {
  const createInnerStorage = (
    codec: Codec<
      string | Uint8Array,
      MarketMetadata
    > = JsonCodec<MarketMetadata>(),
  ): Storage<MarketMetadata, CID> => {
    return {
      put: Te.from(
        async (data) => {
          const response = await fetch("/api/ipfs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });

          if (response.status === 400) {
            const { message } = await response.json();
            throw new Error(message);
          }

          const { cid: cidString } = await response.json();
          const cid = CID.parse(cidString);

          return cid;
        },
        (message, error) => new StorageError(message, error),
      ),
      hash: Te.from(
        async (data) => {
          const response = await fetch("/api/ipfs?only-hash=true", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });

          if (response.status === 400) {
            const { message } = await response.json();
            throw new Error(message);
          }

          const { cid: cidString } = await response.json();
          const cid = CID.parse(cidString);

          return cid;
        },
        (message, error) => new StorageError(message, error),
      ),
      get: Te.from(
        async (cid) => {
          const data = (await read(node, cid).unwrap())
            .map((chunks) => u8aConcat(...chunks))
            .unwrap();

          if (data) {
            const parsed = JSON.parse(u8aToString(data));
            return O.option(O.some(parsed));
          }

          return O.option(O.none());
        },
        (message, error) => new StorageError(message, error),
      ),
      withCodec: <A>() => createInnerStorage(codec) as Storage<A, CID>,
      provider: node,
    };
  };

  return createStorage(createInnerStorage());
};

/**
 * Read data from a cid and parse it to a string.
 */
const read = Te.from<
  O.IOption<Uint8Array[]>,
  Error,
  [node: IPFSHTTPClient.IPFSHTTPClient, cid: IPFSHTTPClient.CID]
>(async (node, cid) => {
  let content: Uint8Array[] = [];

  for await (const chunk of node.cat(cid)) {
    content = [...content, chunk];
  }

  new Blob(content);

  if (content.length === 0) return O.option(O.none());

  return O.option(O.some(content));
});
