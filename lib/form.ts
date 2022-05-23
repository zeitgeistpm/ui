import validatorjs from "validatorjs";
import dvr from "mobx-react-form/lib/validators/DVR";
import vjf from "mobx-react-form/lib/validators/VJF";

export const defaultPlugins = {
  dvr: dvr(validatorjs),
  vjf: vjf(),
};

export const defaultOptions = {
  validateOnChange: true,
  validateOnBlur: true,
};
