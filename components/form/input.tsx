import React from "react";
import { useFormContext } from "react-hook-form";

const inputClasses =
  "bg-sky-200 dark:bg-black text-ztg-14-150 w-full rounded-ztg-5 h-ztg-40 p-ztg-8 font-lato focus:outline-none border-1 dark:border-black text-black dark:text-white";

const disabledInputClasses =
  "disabled:bg-transparent dark:disabled:bg-transparent disabled:border-sky-200 dark:disabled:border-border-dark ";

const invalidClasses = "!border-vermilion !text-vermilion";

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props,
) => {
  return <input {...props} />;
};
