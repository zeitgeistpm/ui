import { decodeAddress, encodeAddress } from "@polkadot/keyring";
import { hexToU8a, isHex } from "@polkadot/util";

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

export const formatNumberLocalized = (
  num: number | bigint,
  locale: string = "en-US",
) => {
  // Ensure displaying absolute zeros are usnigned(-), because javascript sucks sometimes.
  if (num === 0 || num === 0n) num = 0;

  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
    num,
  );
};

export const isValidPolkadotAddress = (address: string) => {
  try {
    encodeAddress(isHex(address) ? hexToU8a(address) : decodeAddress(address));
    return true;
  } catch {
    return false;
  }
};
