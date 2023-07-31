export const fetchAllPages = async <T>(
  fetcher: (pageNumber: number, limit: number) => Promise<T[]>,
) => {
  const MAX_RECORDS = 5000;

  const records: T[] = [];
  let lastBatchLength;
  let pageNumber = 0;

  while (lastBatchLength == null || lastBatchLength === MAX_RECORDS) {
    const batch = await fetcher(pageNumber, MAX_RECORDS);
    records.push(...batch);
    pageNumber++;
    lastBatchLength = batch.length;
  }

  return records;
};
