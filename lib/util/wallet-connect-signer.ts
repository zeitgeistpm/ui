import { TypeRegistry } from "@polkadot/types";
import type {
  Signer,
  SignerPayloadJSON,
  SignerPayloadRaw,
  SignerResult,
} from "@polkadot/types/types";
import type { HexString } from "@polkadot/util/types";
import SignClient from "@walletconnect/sign-client";
import { SessionTypes, SignClientTypes } from "@walletconnect/types";

export type KeypairType = "ed25519" | "sr25519";
export type WcAccount = `${string}:${string}:${string}`;
export type PolkadotNamespaceChainId = `polkadot:${string}`;
export interface WalletConnectConfiguration extends SignClientTypes.Options {}

interface Signature {
  signature: HexString;
}

export class WalletConnectSigner implements Signer {
  registry: TypeRegistry;
  client: SignClient;
  session: SessionTypes.Struct;
  chainId: PolkadotNamespaceChainId;
  id = 0;

  constructor(
    client: SignClient,
    session: SessionTypes.Struct,
    chainId: PolkadotNamespaceChainId,
  ) {
    this.client = client;
    this.session = session;
    this.registry = new TypeRegistry();
    this.chainId = chainId;
  }

  signPayload = async (payload: SignerPayloadJSON): Promise<SignerResult> => {
    let request = {
      topic: this.session.topic,
      chainId: this.chainId,
      request: {
        id: 1,
        jsonrpc: "2.0",
        method: "polkadot_signTransaction",
        params: { address: payload.address, transactionPayload: payload },
      },
    };
    let { signature } = await this.client.request<Signature>(request);
    return { id: ++this.id, signature };
  };

  // ref: https://polkadot.js.org/docs/extension/cookbook#sign-a-message
  signRaw = async (raw: SignerPayloadRaw): Promise<SignerResult> => {
    let request = {
      topic: this.session.topic,
      chainId: this.chainId,
      request: {
        id: 1,
        jsonrpc: "2.0",
        method: "polkadot_signMessage",
        params: { address: raw.address, message: raw.data },
      },
    };
    let { signature } = await this.client.request<Signature>(request);
    return { id: ++this.id, signature };
  };
}
