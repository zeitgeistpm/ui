import { useRouter } from "next/router";
import { parse as parseUri } from "uri-js";

const getQueryParams = (path: string) => {
  const url = parseUri(path);
  let queryParams = {};
  const queryParamsArr = [...Array.from(new URLSearchParams(url.query))];
  for (const pair of queryParamsArr) {
    queryParams[pair[0]] = pair[1];
  }
  return queryParams;
};

export type UseQueryParamStateResult = [
  string,
  (value: string) => void,
  () => void,
];

export type UseQueryParamState = (key: string) => UseQueryParamStateResult;

/**
Hook for storing state as a query parameter. It can only handle strings for state value.
Hook's main purpose is to store state of the UI as a query parameter so navigation would show correct part of the page
@param key - The key of the query parameter to manage.
@returns @type {UseQueryParamStateResult} An array containing the value of the query parameter, a function to set the query parameter state, and a function to unset the query parameter state.
*/
export const useQueryParamState: UseQueryParamState = (key: string) => {
  const router = useRouter();
  const route = router.asPath.split("?")[0];

  const queryParams = getQueryParams(router.asPath);

  const value = queryParams[key];

  const setQueryState = (value: string) => {
    router.replace(
      { pathname: route, query: { ...queryParams, [key]: value } },
      undefined,
      { shallow: true },
    );
  };

  const unsetQueryState = () => {
    const nextQueryParams = { ...queryParams };
    delete nextQueryParams[key];
    router.replace(
      { pathname: route, query: { ...nextQueryParams } },
      undefined,
      { shallow: true },
    );
  };

  return [value, setQueryState, unsetQueryState];
};
