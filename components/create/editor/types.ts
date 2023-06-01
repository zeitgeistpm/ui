export type FormEvent<T> = {
  target: { name: string; value: T };
  type: "blur" | "change" | "focusout" | string;
};
