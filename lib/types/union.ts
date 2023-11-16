import { Unpacked } from "@zeitgeistpm/utility/dist/array";

/**
 * Union helper for type asserting that constant arrays or records
 * include all union values.
 * @note - See marketCreationSteps and stepFormKeys for example usage.
 */
export const union = <T>() => ({
  /**
   * Narrow the union helper to a distinct union set field.
   * Useful for unions of records with a 'type', 'label' or '_tag' on them (see branded types.)
   */
  by: <K extends keyof T>(key: K) => ({
    exhaust: <U extends T[]>(
      array: U &
        ([T[K]] extends [U[number][K]]
          ? unknown
          : Exclude<Unpacked<T[]>[K], Unpacked<U>[K]> extends
                | string
                | number
                | boolean
            ? `MissingKey<${Exclude<Unpacked<T[]>[K], Unpacked<U>[K]>}>`
            : never) &
        NonEmptyArray<T>,
    ): T[] => array,
  }),

  /**
   * Assert that given array includes all union types.
   */
  exhaust: <U extends T[]>(
    array: U &
      ([T] extends [U[number]]
        ? unknown
        : Exclude<Unpacked<T[]>, Unpacked<U>> extends string | number | boolean
          ? `MissingKey<${Exclude<Unpacked<T[]>, Unpacked<U>>}>`
          : never) &
      NonEmptyArray<T>,
  ): T[] => array,

  /**
   * Assert that a given record uses all union types as keys at least once.
   */
  exhaustAsRecord: <R>(
    record: [T] extends [keyof R]
      ? R
      : Exclude<T, keyof R> extends string | number | boolean
        ? `MissingKey<${Exclude<T, keyof R>}>`
        : never,
  ) => record,

  match: <
    R extends Record<any, () => any>,
    A = R extends Record<keyof R, () => infer A> ? A : never,
  >(
    value: T,
    record: [T] extends [keyof R] ? R : Record<keyof R | "_", () => A>,
  ): A => {
    let match = (record[value] ?? record["_"]) as () => A;
    return match();
  },
});

/**
 * Type helper that ensures value on index one in a indexed type, like arrays.
 */
export type NonEmptyArray<T> = { 0: T };
