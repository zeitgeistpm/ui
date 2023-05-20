import { MarketCreationFormData } from "./form";
import { MarketCreationStepType } from "./step";

export const sections: Record<
  MarketCreationStepType,
  Array<keyof MarketCreationFormData>
> = {
  Currency: ["currency"],
  Question: ["question", "tags"],
  Answers: ["answers"],
  "Time Period": ["endDate", "gracePeriod", "reportingPeriod", "disputePeriod"],
  Oracle: ["oracle"],
  Description: ["description"],
  Moderation: ["moderation"],
  Preview: [],
};

export const sectionOfFormKey = (
  key: keyof MarketCreationFormData,
): MarketCreationStepType => {
  for (const sectionKey in sections) {
    if (sections[sectionKey].includes(key))
      return sectionKey as MarketCreationStepType;
  }
};
