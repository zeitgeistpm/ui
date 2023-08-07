import { AssetId } from "@zeitgeistpm/sdk-next";
import { atom, getDefaultStore, useAtom } from "jotai";

type QueueItem = {
  id: number;
  lifetimeMS: number;
  metadata?: Metadata;
  onItemRemoved: () => void;
};

type Metadata = { address?: string; assetId: AssetId };

const delayQueueAtom = atom<QueueItem[]>([]);

const store = getDefaultStore();

export const useDelayQueue = () => {
  const atom = useAtom(delayQueueAtom);

  const addItem = (lifetimeMS: number, metadata?: Metadata) => {
    const items = store.get(delayQueueAtom);
    const id = items.length + 1;
    const onItemRemoved = () => {};

    store.set(delayQueueAtom, [
      ...items,
      { id: id, lifetimeMS, metadata, onItemRemoved },
    ]);

    setTimeout(() => {
      const items = store.get(delayQueueAtom);
      const remainingItems = items.filter((item) => item.id !== id);

      store.set(delayQueueAtom, remainingItems);
    }, lifetimeMS);
  };

  return {
    addItem,
    items: atom[0],
  };
};
