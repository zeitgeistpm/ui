export const fetchAllPages = async <T>(
  fetcher: (pageNumber: number) => Promise<T[]>,
) => {
  const MAX_RECORDS = 100;

  const records: T[] = [];
  let lastBatchLength;
  let pageNumber = 0;

  while (lastBatchLength == null || lastBatchLength === MAX_RECORDS) {
    const batch = await fetcher(pageNumber);
    records.push(...batch);
    pageNumber++;
    lastBatchLength = batch.length;
  }

  return records;
};
