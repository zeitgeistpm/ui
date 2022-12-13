import { camelCase } from "lodash-es";

export const camelcaseObjectKeys = (obj: object) => {
  return Object.keys(obj).reduce((acc, key) => {
    return {
      ...acc,
      [camelCase(key)]: obj[key],
    };
  }, {});
};
