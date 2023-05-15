import { QuestionSectionFormData } from "lib/state/market-creation/types";
import { useForm } from "react-hook-form";
import CategorySelect from "../inputs/Category";

export type QuestionSectionFormProps = {
  wizard?: boolean;
};

export const QuestionSectionForm = ({ wizard }: QuestionSectionFormProps) => {
  const { handleSubmit, register, watch } = useForm<QuestionSectionFormData>(
    {},
  );

  const onSubmit = (data: any) => {
    console.log("CurrencySectionForm.submit", data);
  };

  const input = (
    <CategorySelect
      value={watch("tags")}
      {...register("tags", {
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
