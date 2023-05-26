import { getQueryParams } from "lib/util/get-query-params";
import { useRouter } from "next/router";

export type UseQueryParamStateResult<T extends string> = [
  T,
  (value: T) => void,
  () => void,
];

export type UseQueryParamState = <T extends string>(
  key: string,
) => UseQueryParamStateResult<T>;

/**
Hook for storing state as a query parameter. It can only handle strings for state value.
Hook's main purpose is to store state of the UI as a query parameter so correct part of the page would show after navigating back.
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
