// import { useState, useEffect } from "react";
// import { encodeAddress } from "@polkadot/util-crypto";
// import { useSdkv2 } from "lib/hooks/useSdkv2";
// import { isRpcSdk, AssetId, IOForeignAssetId } from "@zeitgeistpm/sdk";
// import Decimal from "decimal.js";
// import { useConfirmation } from "lib/state/confirm-modal/useConfirmation";
// import { ZTG } from "@zeitgeistpm/sdk";
// import { wsxIdObject } from "lib/constants";
// import { walletAtom, store } from "./wallet";
// import { useAtom } from "jotai";
// import { formatNumberLocalized } from "lib/util";

// const useActiveBalance = (
//   userAddress: string | undefined,
//   foreignAssetId?: AssetId,
// ) => {
//   const assetId = foreignAssetId || wsxIdObject;
//   const [balance, setBalance] = useState<Decimal | undefined>(undefined);
//   const [walletState, setWalletState] = useAtom(walletAtom);
//   const [sdk, id] = useSdkv2();
//   const confirm = useConfirmation();
//   useEffect(() => {
//     let unsubscribe;

//     const subscribeToBalance = async () => {
//       if (
//         isRpcSdk(sdk) &&
//         userAddress &&
//         sdk.api.query.tokens &&
//         sdk.api.query.tokens.accounts &&
//         IOForeignAssetId.is(assetId)
//       ) {
//         try {
//           unsubscribe = await sdk.api.query.tokens.accounts(
//             userAddress,
//             assetId,
//             (balance) => {
//               const newBalance = new Decimal(balance.free.toString());
//               setBalance((prevBalance) => {
//                 return prevBalance?.equals(newBalance)
//                   ? prevBalance
//                   : newBalance;
//               });
//             },
//           );
//         } catch (error) {
//           console.error("Error setting up balance subscription:", error);
//         }
//       }
//     };

//     subscribeToBalance();

//     return () => {
//       if (unsubscribe && typeof unsubscribe === "function") {
//         unsubscribe();
//       }
//     };
//   }, [sdk, userAddress]);

//   useEffect(() => {
//     if (
//       balance &&
//       balance?.div(ZTG).abs().toNumber() <= 100 &&
//       walletState.newUser
//     ) {
//       store.set(walletAtom, (state) => {
//         return {
//           ...state,
//           newUser: false,
//         };
//       });
//       confirm.prompt({
//         title: "Your account is now funded!",
//         description: `You have ${formatNumberLocalized(
//           balance?.div(ZTG).abs().toNumber(),
//         )} WSX in your account.`,
//       });
//     }
//   }, [balance, walletState.newUser]);

//   return balance;
// };

// export default useActiveBalance;
