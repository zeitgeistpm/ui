import {
  EndpointOption,
  Environment,
  JSONObject,
  SelectOption,
} from "../types";
import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { hexToU8a, isHex } from "@polkadot/util";
import { endpoints, graphQlEndpoints, environment } from "../constants";

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

export const shortenAddress = (
  address: string,
  sliceStart: number = 6,
  sliceEnd: number = 4,
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

export const isValidImageFile = (file: File): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result;
      var arr = new Uint8Array(res as ArrayBuffer).subarray(0, 4);
      var header = "";
      for (var i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
      }
      let type: string;
      switch (header) {
        case "89504e47":
          type = "image/png";
          break;
        case "47494638":
          type = "image/gif";
          break;
        case "ffd8ffe0":
        case "ffd8ffe1":
        case "ffd8ffe2":
        case "ffd8ffe3":
        case "ffd8ffe8":
          type = "image/jpeg";
          break;
        default:
          type = "unknown"; // Or you can use the blob.type as fallback
          break;
      }
      console.log(type);
      if (type === "image/png" || type === "image/jpeg") {
        resolve(true);
      } else {
        resolve(false);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const formatNumberLocalized = (
  num: number,
  locale: string = "en-US",
) => {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
    num,
  );
};

export const paramsForBlocksArray = (
  startBlock: number,
  endBlock: number,
  blockResolution: number,
  currentBlock?: number,
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
  endingBlock: number,
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
  blockTime: number,
): number => {
  const blockDiff = currentBlockNumber - blockNumber;
  const timeDiffMS = blockDiff * blockTime * 1000;

  const unixTime = new Date().getTime() - timeDiffMS;
  return new Date(unixTime).getTime();
};
