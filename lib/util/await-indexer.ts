const INDEXER_DELAY_MS = 40 * 1000;

export const awaitIndexer = async (callback: () => void) => {
  setTimeout(() => {
    callback();
  }, INDEXER_DELAY_MS);
};
