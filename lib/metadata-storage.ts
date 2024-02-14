import { u8aConcat } from "@polkadot/util/u8a";
import * as O from "@zeitgeistpm/utility/dist/option";
import * as Te from "@zeitgeistpm/utility/dist/taskeither";
import { Storage, StorageError } from "@zeitgeistpm/web3.storage";
import * as IPFSHTTPClient from "ipfs-http-client";
import { isU8a, u8aToString } from "@polkadot/util";
import { CID } from "multiformats/cid";
import { MetadataStorage, createStorage } from "@zeitgeistpm/sdk";
import { Codec, JsonCodec } from "@zeitgeistpm/utility/dist/codec";

const node = IPFSHTTPClient.create({ url: "https://ipfs.zeitgeist.pm" });

export const createMetadataStorage = (): MetadataStorage => {
  const createInnerStorage = (
    codec: Codec<string | Uint8Array, any> = JsonCodec(),
  ): Storage<any, any> => {
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
      del: Te.from(
        async (cid) => {
          const response = await fetch("/api/ipfs", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ cid: cid.toString() }),
          });

          if (!response.ok) {
            const { message } = await response.json();
            throw message;
          }
        },
        (message, error) => new StorageError(message, error),
      ),
      withCodec: (codec) => createInnerStorage(codec),
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
