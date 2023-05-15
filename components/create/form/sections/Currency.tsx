import { CurrencySectionFormData } from "lib/state/market-creation/types";
import { useForm } from "react-hook-form";
import CurrencySelect from "../inputs/Currency";

export type CurrencySectionFormProps = {
  wizard?: boolean;
};

export const CurrencySectionForm = ({ wizard }: CurrencySectionFormProps) => {
  const { handleSubmit, register, watch } = useForm<CurrencySectionFormData>(
    {},
  );

  const onSubmit = (data: any) => {
    console.log("CurrencySectionForm.submit", data);
  };

  const input = (
    <CurrencySelect
      options={["ZTG", "DOT"]}
      value={watch("currency")}
      {...register("currency", {
        required: true,
      })}
    />
  );

  if (wizard) {
    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        {input}
        <button type="submit">Next</button>
      </form>
    );
  }

  return input;
};
