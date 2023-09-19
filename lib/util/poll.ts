import { delay } from "./delay";

/**
 * Static literal symbol for a timed out polling try.
 */
export const PollingTimeout = "timeout";
export type PollingTimeout = typeof PollingTimeout;

/**
 * @generic T type of the returned value
 * @param fn () => Promise T - the fn called to poll for values
 * @param opts.timeout number - how long to try total from start to finish.
 * @param opts.interval number - the time between tries.
 * @param opts.retries number - number of retries.
 * @param opts.validator (value: T) => Promise<boolean> - check the value returned from the fn
 * @returns Promise T | PollingTimeout | null
 */
export const poll = async <T>(
  fn: () => Promise<T | null | PollingTimeout>,
  opts: {
    timeout: number;
    interval: number;
    validator?: (value: T | null | PollingTimeout) => Promise<boolean>;
  },
): Promise<T | null | PollingTimeout> => {
  if (opts.timeout <= 0) {
    return PollingTimeout;
  }

  const start = Date.now();

  try {
    const value = await fn();
    if (value && (!opts.validator || (await opts.validator(value)))) {
      return value;
    }
  } catch {
    await delay(opts.interval);

    const end = Date.now();

    return poll<T>(fn, { ...opts, timeout: opts.timeout - (end - start) });
  }
  await delay(opts.interval);

  const end = Date.now();

  return poll<T>(fn, { ...opts, timeout: opts.timeout - (end - start) });
};
