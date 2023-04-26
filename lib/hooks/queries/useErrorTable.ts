import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { extractIndexFromErrorHex } from "lib/util/error-table";
import { useSdkv2 } from "../useSdkv2";

export const useErrorTable = () => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id],
    async () => {
      if (isRpcSdk(sdk)) {
        const errorTable = (
          await sdk.model.chainMetadata.fetchTables()
        ).unwrap();

        const getTransactionError = (
          groupIndex: number,
          error: number | string,
        ): string => {
          const errorIndex =
            typeof error === "string" ? extractIndexFromErrorHex(error) : error;

          const errorEntry = errorTable.getErrorEntry(groupIndex, errorIndex);

          if (!errorEntry) {
            return `Transaction failed due to unknown reasons.`;
          }

          return errorEntry.documentation.length > 0
            ? errorEntry.documentation
            : `Transaction failed, error code: ${errorEntry.errorName}`;
        };
        return {
          errorTable,
          getTransactionError,
        };
      }

      return null;
    },
    {
      keepPreviousData: true,
      staleTime: Infinity,
      enabled: Boolean(sdk && isRpcSdk(sdk)),
    },
  );

  query.data;

  return query;
};
