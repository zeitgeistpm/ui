import { isRpcSdk } from "@zeitgeistpm/sdk";
import { ChainTime } from "@zeitgeistpm/utility/dist/time";
import { atom, getDefaultStore, useAtom } from "jotai";
import { sdkAtom } from "lib/hooks/useSdkv2";
import { Subscription } from "rxjs";

export const chainTimeAtom = atom<ChainTime | false>(false);

const store = getDefaultStore();

let sub: Subscription;

const onSdkChange = () => {
  const sdk = store.get(sdkAtom);
  if (sub) sub.unsubscribe();
  if (isRpcSdk(sdk)) {
    sub = sdk.model.time.now.$().subscribe((time) => {
      store.set(chainTimeAtom, time);
    });
  }
};

/**
 * In dev the subscription is sometimes not set up on first render.
 * So we need to check if the sdk is already set up and if so update the chaintime atom.
 */
const sdk = store.get(sdkAtom);
if (sdk) onSdkChange();

store.sub(sdkAtom, onSdkChange);

export const useChainTime = (): ChainTime | null => {
  const [chainTime] = useAtom(chainTimeAtom);
  return chainTime || null;
};
