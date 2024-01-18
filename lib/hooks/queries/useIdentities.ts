import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { Judgement, UserIdentity } from "lib/types/user-identity";
import { useSdkv2 } from "../useSdkv2";

export const identitiesRootKey = "identities";

export const useIdentities = (addresses?: string[]) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, identitiesRootKey, addresses],
    async () => {
      if (addresses && isRpcSdk(sdk)) {
        const userIdentities: UserIdentity[] = [];
        sdk.api.queryMulti(
          addresses.map((address) => [
            sdk.api.query.identity.identityOf as any,
            address,
          ]),
          (res) => {
            res.forEach((identity: any) => {
              const indentityInfo =
                identity.isNone === false
                  ? (identity.value as any).get("info")
                  : undefined;
              if (indentityInfo) {
                const textDecoder = new TextDecoder();

                let discordHandle: string | undefined;
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

                const userIdentity: UserIdentity = {
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

                userIdentities.push(userIdentity);
              } else {
                const userIdentity: UserIdentity = {
                  displayName: "",
                };

                userIdentities.push(userIdentity);
              }
            });
          },
        );
        return userIdentities;
      }
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk)),
      staleTime: 100_000,
    },
  );

  return query;
};
