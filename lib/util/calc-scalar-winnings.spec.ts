import { calcScalarWinnings } from "./calc-scalar-winnings";

describe("calcScalarWinnings", () => {
  test("should calculate winnings correct for short tokens", () => {
    const winnings = calcScalarWinnings(0, 10, 5, 100, 0);
    expect(winnings).toEqual(50);
  });
  test("should calculate winnings correct for long tokens", () => {
    const winnings = calcScalarWinnings(0, 40, 10, 0, 100);
    expect(winnings).toEqual(25);
  });
  test("should calculate winnings correct for both long and short tokens", () => {
    const winnings = calcScalarWinnings(0, 40, 10, 100, 100);
    expect(winnings).toEqual(100);
  });
});
