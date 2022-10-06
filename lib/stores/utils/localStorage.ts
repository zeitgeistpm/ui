import { JSONObject, Primitive } from "lib/types";

export const getFromLocalStorage = (
  key: string,
  defaultValue: JSONObject,
): JSONObject => {
  const val = window.localStorage.getItem(key);
  if (val == null && defaultValue) {
    return defaultValue;
  }
  return JSON.parse(val);
};

export const setToLocalStorage = (key: string, value: JSONObject | Primitive) => {
  const val = JSON.stringify(value);
  window.localStorage.setItem(key, val);
};
