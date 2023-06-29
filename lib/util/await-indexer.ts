const INDEXER_DELAY_MS = 40 * 1000;

export const awaitIndexer = async (callback: () => void) => {
  setTimeout(() => {
    console.log("called");

    callback();
  }, INDEXER_DELAY_MS);
};
