import validatorjs from "validatorjs";
import dvr from "mobx-react-form/lib/validators/DVR";
import vjf from "mobx-react-form/lib/validators/VJF";
import { isValidPolkadotAddress } from "lib/util";
import { getDefaultStore } from "jotai";
import { chainTimeAtom } from "./state/chaintime";

export const defaultPlugins = {
  dvr: dvr(validatorjs),
  vjf: vjf(),
};

export const defaultOptions = {
  validateOnChange: true,
  validateOnBlur: true,
};

export const registerValidationRules = () => {
  validatorjs.register(
    "amount_validation",
    (val: string) => {
      if (!val) {
        val = "0";
      }
      return +val > 0;
    },
    "Enter amount greater than zero.",
  );

  validatorjs.register("timestamp_gt_now", (val: string) => {
    if (typeof val !== "string") {
      return false;
    }
    return new Date().valueOf() < Number(val);
  });

  validatorjs.register("range_outcome", (val: number | string) => {
    return +val > 0 && +val < 1;
  });

  validatorjs.register("address_input", (val: string) => {
    return isValidPolkadotAddress(val);
  });

  const store = getDefaultStore();

  store.sub(chainTimeAtom, () => {
    const chainTime = store.get(chainTimeAtom);
    validatorjs.register("gt_current_blocknum", (val: number | string) => {
      return chainTime ? chainTime.block < Number(val) : false;
    });
  });
};
