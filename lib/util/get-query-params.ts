import { parse as parseUri } from "uri-js";

/**

Extracts query parameters from the given path and returns them as an object.
Router from next.js does not provide a way to get only the query parameters from router, so this function is used to extract them.
@param path - The path containing the query parameters.
@returns An object representing the extracted query parameters.
*/
export const getQueryParams = <T extends string>(
  path: string,
): { [key: string]: T } => {
  const url = parseUri(path);
  let queryParams = {};
  const queryParamsArr = [...Array.from(new URLSearchParams(url.query))];
  for (const pair of queryParamsArr) {
    queryParams[pair[0]] = pair[1];
  }
  return queryParams;
};
