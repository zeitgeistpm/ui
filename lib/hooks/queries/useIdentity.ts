import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { Judgement } from "lib/stores/UserStore";
import { useSdkv2 } from "../useSdkv2";

export const identityRootKey = "identity";

export const useIdentity = (address: string) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, identityRootKey, address],
    async () => {
      if (address && isRpcSdk(sdk)) {
        const identity = (await sdk.api.query.identity.identityOf(
          address,
        )) as any;

        const indentityInfo =
          identity.isNone === false
            ? (identity.value as any).get("info")
            : null;
        if (indentityInfo) {
          const textDecoder = new TextDecoder();

          let discordHandle: string;
          indentityInfo.get("additional").forEach((element) => {
            if (
              element[0].value?.isEmpty === false &&
              textDecoder.decode(element[0].value)
            ) {
              discordHandle = textDecoder.decode(element[1].value);
            }
          });

          const judgements = identity.value.get("judgements")[0];

          const judgementType: Judgement = judgements
            ? judgements[1].type
            : "Unknown";

          return {
            displayName:
              indentityInfo.get("display").isNone === false
                ? textDecoder.decode(indentityInfo.get("display").value)
                : "",
            twitter:
              indentityInfo.get("twitter").isNone === false
                ? textDecoder.decode(indentityInfo.get("twitter").value)
                : "",
            discord: discordHandle,
            judgement: judgementType,
          };
        } else {
          return {
            displayName: "",
            twitter: "",
            discord: "",
            judgement: null,
          };
        }
      }
      return null;
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk)),
    },
  );

  return query;
};
