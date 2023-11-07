import { describe, expect, test } from "vitest";
import { calcMarketColors, hslToHex } from "./color-calc";

describe("color calculation", () => {
  describe("calcMarketColors", () => {
    test("should create evenly distibuted colors", () => {
      const colors = calcMarketColors(0, 2);

      expect(colors.length).toEqual(2);
      expect(colors).toStrictEqual(["#ff0000", "#00ffff"]); // blue and red
    });
    test("should work with large markets", () => {
      const colors = calcMarketColors(1230, 64);

      expect(colors.length).toEqual(64);
      expect(colors[0]).toEqual("#00ff80"); //green
      expect(colors[32]).toEqual("#ff0080"); //pink
      expect(colors.at(-1)).toEqual("#00ff68"); //green
    });
  });

  describe("hslToHex", () => {
    test("should convert hsl to hex", () => {
      const hex = hslToHex(181, 100, 50);

      expect(hex).toEqual("#00fbff");
    });

    test("should convert hsl to hex (black)", () => {
      const hex = hslToHex(0, 0, 0);

      expect(hex).toEqual("#000000");
    });

    test("should work for hues above 360", () => {
      const hex = hslToHex(700, 100, 50);

      expect(hex).toEqual("#ff0055");
    });
  });
});
