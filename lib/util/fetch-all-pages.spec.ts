import { fetchAllPages } from "./fetch-all-pages";

describe("fetchAllPages", () => {
  test("should fetch all when there is a single page", async () => {
    const fetcher = async (pageNumber: number) => {
      if (pageNumber === 0) {
        return Array.from({ length: 10 }, (_, i) => i);
      }

      return [];
    };

    const pages = await fetchAllPages<number>(fetcher);

    expect(pages.length).toEqual(10);
  });

  test.only("should fetch all when there is multiple pages", async () => {
    const fetcher = async (pageNumber: number) => {
      if (pageNumber === 0) {
        return Array.from({ length: 5000 }, (_, i) => i);
      }
      if (pageNumber === 1) {
        return Array.from({ length: 10 }, (_, i) => i);
      }

      return [];
    };

    const pages = await fetchAllPages(fetcher);

    expect(pages.length).toEqual(5010);
  });
});
