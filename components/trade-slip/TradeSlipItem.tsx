// import { isIndexedData, isNA } from "@zeitgeistpm/sdk-next";
// import { Decimal } from "decimal.js";
// import { ZTG } from "lib/constants";
// import { TradeSlipItem, useTradeslipItems } from "lib/state/tradeslip/items";
// import { useTradeslipItemState } from "lib/state/tradeslip/tradeslipItemsState";
// import { useStore } from "lib/stores/Store";
// import { observer } from "mobx-react";
// import { FC } from "react";
// import { X } from "react-feather";
// import { AmountInput } from "../ui/inputs";

// export type TradeSlipItemProps = {
//   item: TradeSlipItem;
//   disabled?: boolean;
// };

// const TradeSlipItem = observer<FC<TradeSlipItemProps>>(({ item, disabled }) => {
//   const { config } = useStore();

//   const { put, removeAsset } = useTradeslipItems();
//   const state = useTradeslipItemState(item);

//   const onAmountChange = (val: string) => put({ ...item, amount: Number(val) });

//   return (
//     <div
//       className={`rounded-ztg-10 mb-ztg-15 relative transition-opacity ${
//         !state && "opacity-75"
//       }`}
//     >
//       <div className="px-ztg-16 h-ztg-30 flex items-center rounded-t-ztg-10 bg-sky-300 dark:bg-sky-700">
//         <div
//           className={
//             "w-ztg-33 text-ztg-14-150 uppercase font-space font-bold " +
//             `${item.action === "buy" ? "text-sunglow-2" : "text-red-crayola"}`
//           }
//         >
//           {item.action}
//         </div>
//         <div className="text-ztg-10-150 break-words whitespace-nowrap overflow-hidden overflow-ellipsis text-gray-dark-3 text-center font-lato font-bold uppercase flex-grow mx-ztg-10">
//           {isIndexedData(state?.market) ? state?.market.slug : "--"}
//         </div>
//         <div className="w-ztg-16 h-ztg-16 rounded-full bg-sky-400 dark:bg-black center">
//           <X
//             size={16}
//             className="cursor-pointer text-sky-600"
//             onClick={() => removeAsset(item.assetId)}
//           />
//         </div>
//       </div>
//       <div className="py-ztg-8 px-ztg-16 bg-white dark:bg-sky-1000 flex flex-col items-center mb-ztg-8 rounded-b-ztg-10">
//         {state?.market?.status && state?.market?.status !== "Active" ? (
//           <div className="text-vermilion font-lato font-bold text-ztg-12-120 h-ztg-30 center">
//             Market Ended
//           </div>
//         ) : (
//           <>
//             <div className="flex items-center h-ztg-30 w-full">
//               <div
//                 className="w-ztg-20 h-ztg-20 rounded-full border-2 border-sky-600 flex-shrink-0"
//                 style={{
//                   background: `${state?.asset?.category.color}`,
//                 }}
//               ></div>
//               <div className="uppercase font-space font-bold text-ztg-14-150 ml-ztg-8 mr-ztg-10 text-black dark:text-white">
//                 {state?.asset?.category.ticker ?? "--"}
//               </div>
//               <div className="font-lato font-bold text-ztg-12-150 ml-auto text-black dark:text-white">
//                 @{state?.price?.toFixed(4) ?? "0.0"}{" "}
//                 {config?.tokenSymbol ?? "--"}
//               </div>
//             </div>
//             <div className="h-ztg-15 w-full mb-ztg-10 font-lato text-ztg-10-150 flex items-center text-gray-dark-3">
//               Balance:
//               <div className="text-black dark:text-white ml-1">
//                 {isNA(state?.traderAssetBalance)
//                   ? "--"
//                   : state?.traderAssetBalance?.div(ZTG).toNumber().toFixed(4)}
//               </div>
//             </div>
//             <div className="flex w-full h-ztg-34 mb-ztg-10">
//               <div className="h-full w-ztg-164">
//                 <AmountInput
//                   disabled={disabled || !state}
//                   value={item.amount.toString()}
//                   name={""}
//                   containerClass="h-full"
//                   className={"!h-full w-full rounded-ztg-8 text-right mb-ztg-2"}
//                   onChange={onAmountChange}
//                   max={
//                     !state
//                       ? "0"
//                       : state.max.isNaN()
//                       ? "0"
//                       : state.max.div(ZTG).toString()
//                   }
//                 />
//               </div>
//               <div className="ml-ztg-10 h-full flex flex-col text-sky-600 font-lato text-ztg-10-150 text-right flex-grow">
//                 {item.action === "sell" ? (
//                   <div>To Receive</div>
//                 ) : (
//                   <div>To Spend:</div>
//                 )}
//                 <div className="font-bold text-black dark:text-white">
//                   {!state?.sum || state?.sum.isNaN()
//                     ? "---"
//                     : state?.sum?.div(ZTG).toFixed(4, Decimal.ROUND_DOWN)}{" "}
//                   {config?.tokenSymbol}
//                 </div>
//               </div>
//             </div>
//             <div className="flex w-full font-lato text-ztg-10-150 text-gray-dark-3 mt-ztg-5">
//               Trading Fee:
//               <div className="text-black dark:text-white ml-1">
//                 {new Decimal(item.amount)
//                   .mul(state?.swapFee?.div(ZTG) ?? 0)
//                   .toFixed(4)}{" "}
//                 {item.action === "sell"
//                   ? state?.asset.category.ticker?.toUpperCase()
//                   : config?.tokenSymbol}
//               </div>
//               <span className="ml-2">
//                 ({state?.swapFee.div(ZTG).toString()}%)
//               </span>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// });

// export default TradeSlipItem;
export default () => null;
