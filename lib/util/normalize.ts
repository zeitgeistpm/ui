export type Normalized<
  T extends Record<string | number | symbol, any>,
  K extends keyof T,
> = {
  ids: T[K][];
  byId: Partial<Record<T[K], T>>;
};

export const empty = <T, K extends keyof T>(): Normalized<T, K> => ({
  ids: [],
  byId: {},
});

export const fromArray = <T extends Record<string, any>, K extends keyof T>(
  array: T[],
  key: K,
): Normalized<T, K> => {
  const keys = array.map((item) => item[key]);
  const index = array.reduce<Normalized<T, K>["byId"]>((index, item) => {
    return {
      ...index,
      [`${item[key]}`]: item,
    };
  }, {} as any);
  return { ids: keys, byId: index };
};

export const toArray = <T extends Record<string, any>, K extends keyof T>(
  data: Normalized<T, K>,
): T[] => data.ids.map((id) => data.byId[id]);

export const mergeR = <T extends Record<string, any>, K extends keyof T>(
  dataA: Normalized<T, K>,
  dataB: Normalized<T, K>,
): Normalized<T, K> => {
  return {
    ids: [...new Set([...dataA.ids, ...dataB.ids])],
    byId: {
      ...dataA.byId,
      ...dataB.byId,
    },
  };
};
