import {
  IGetPlaiceholderOptions,
  IGetPlaiceholderReturn,
  getPlaiceholder,
} from "plaiceholder";

export const getPlaiceholders = (
  paths: string[],
  options?: IGetPlaiceholderOptions,
): Promise<IGetPlaiceholderReturn[]> => {
  return Promise.all(paths.map((path) => getPlaiceholder(path, options)));
};
