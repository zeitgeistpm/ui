import {
  EndpointOption,
  JSONObject,
  SelectOption,
  SupportedParachain,
} from "../types";
import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { hexToU8a, isHex } from "@polkadot/util";
import { endpoints, gqlEndpoints } from "../constants";

export const padBalance = (bal: string): string => {
  const digits = bal.length;
  if (digits < 10) {
    const diff = 10 - digits;
    const zeros = "0".repeat(diff);
    bal = `${zeros}${bal}`;
  }
  return bal;
};

export const formatBal = (bal: string | null) => {
  if (!bal || typeof bal !== "string") {
    return "0.000";
  }
  bal = padBalance(bal);

  let f = `${bal.slice(0, -10)}.${bal.slice(-10)}`;
  if (f.split(".")[0].length === 0) {
    f = `0${f}`;
  }
  if (f.split(".")[1].length < 4) {
    f += "000";
  }

  return f;
};

/**
 * The opposite of `formatBal`.
 * @param formatBal The formatted balance from `formatBal` function.
 */
export const toRawBalance = (formattedBal: string) => {
  const split = formattedBal.split(".");
  const left = split[0];
  let right = split[1] || "";
  if (right.length < 10) {
    right = right.padEnd(10, "0");
  }

  const whole = left.concat(right);

  return whole.replace(/^0+/, "");
};

/**
 * Returns label from [[SelectOption]] array for a value.
 * If option not found returns null
 * @param value: number | string
 * @param options: [[SelectOption]]
 * @returns option label: string | null
 */
export const getOptionLabel = (
  value: number | string,
  options: SelectOption[]
) => {
  const o = options.find((o) => o.value === value);
  return o == null ? null : o.label;
};

export const camelize = (s: string): string => {
  return s
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
};

// returns false if objects aren't same and true otherwise
export const compareJSON = (a: JSONObject, b: JSONObject): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

export const shortenAddress = (
  address: string,
  sliceStart: number = 6,
  sliceEnd: number = 4
) => {
  return `${address.slice(0, sliceStart)}...${address.slice(-sliceEnd)}`;
};

const hexChars = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
];

export const randomHexColor = (): string => {
  const arr = ["#"];
  for (let i = 0; i < 6; i++) {
    arr.push(`${hexChars[Math.floor(Math.random() * hexChars.length)]}`);
  }
  return arr.join("");
};

export const toBase64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result?.toString() || "");
    reader.onerror = (error) => reject(error);
  });
};

export const formatNumberLocalized = (
  num: number,
  locale: string = "en-US"
) => {
  return new Intl.NumberFormat(locale).format(num);
};

export const paramsForBlocksArray = (
  startBlock: number,
  endBlock: number,
  blockResolution: number,
  currentBlock?: number
) => {
  if (startBlock < 1) {
    startBlock = 1;
  }

  const diff = endBlock - startBlock;

  if (diff < blockResolution) {
    // if block resolution is too high, set it so we collect 4 data points
    blockResolution = Math.floor(diff / 4);
  }
  if (currentBlock != null && endBlock > currentBlock) {
    endBlock = currentBlock;
  }

  return {
    startBlock,
    blockResolution,
    endBlock,
  };
};

export const createBlocksArray = (
  startingBlock: number,
  resolution: number,
  endingBlock: number
) => {
  const count = Math.floor((endingBlock - startingBlock) / resolution);

  const blocks = Array.from({ length: count }, (_, index) => {
    const blockNumber = startingBlock + index * resolution;

    return blockNumber <= endingBlock ? blockNumber : null;
  }).filter((block) => block != null);

  blocks.push(endingBlock);

  return blocks;
};

export const isValidPolkadotAddress = (address: string) => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
    return true;
  } catch {
    return false;
  }
};

export const convertBlockNumberToTimestamp = (
  blockNumber: number,
  currentBlockNumber: number,
  blockTime: number
): number => {
  const blockDiff = currentBlockNumber - blockNumber;
  const timeDiffMS = blockDiff * blockTime * 1000;

  const unixTime = new Date().getTime() - timeDiffMS;
  return new Date(unixTime).getTime();
};

export const getEndpointOption = (url?: string): EndpointOption => {
  if (url == null) {
    return endpoints.find((e) => e.parachain === SupportedParachain.BSR);
  }
  const opt = endpoints.find((e) => e.value === url);
  if (opt == null) {
    let opt = endpoints.find(
      (endpoint) => endpoint.parachain == SupportedParachain.CUSTOM
    );
    opt.value = url;
  }
  return { ...opt };
};

Array.prototype.findLastIndexOf = function <T>(fn: (element: T) => boolean) {
  const arr = [...this].reverse();
  const len = arr.length;
  const idx = arr.findIndex(fn);
  if (idx < 0) {
    return idx;
  }
  return len - idx - 1;
};
