import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { ChainTime } from "@zeitgeistpm/utility/dist/time";
import { atom, getDefaultStore, useAtom } from "jotai";
import { sdkAtom } from "lib/hooks/useSdkv2";
import { Observable, Subscription } from "rxjs";

export const chainTimeAtom = atom<ChainTime | false>(false);

const store = getDefaultStore();

let sub: Subscription;

store.sub(sdkAtom, () => {
  const sdk = store.get(sdkAtom);
  if (sub) sub.unsubscribe();
  if (isRpcSdk(sdk)) {
    sub = sdk.model.time.now.$().subscribe((time) => {
      store.set(chainTimeAtom, time);
    });
  }
});

export const useChainTime = (): ChainTime | null => {
  const [chainTime] = useAtom(chainTimeAtom);
  return chainTime || null;
};
