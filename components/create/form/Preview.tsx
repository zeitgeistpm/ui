import { MarketCreationFormData } from "lib/state/market-creation/types/form";
import { shortenAddress } from "lib/util";
import dynamic from "next/dynamic";
import React from "react";

const QuillViewer = dynamic(() => import("components/ui/QuillViewer"), {
  ssr: false,
});

export type MarketPreviewProps = {
  form: Partial<MarketCreationFormData>;
};

export const MarketPreview = ({ form }: MarketPreviewProps) => {
  return (
    <div className="flex-1 text-center">
      <div className="mb-10">
        <Label className="mb-2">Question</Label>
        <h2 className="text-[1.4em]">
          {form?.question ? (
            form?.question
          ) : (
            <span className="text-orange-300 font-normal">
              No question given.
            </span>
          )}
        </h2>
      </div>
      <div className="mb-10">
        <Label className="mb-2">Answers</Label>
        {form?.answers?.type === "yes/no" ? (
          <div className="flex center gap-4">
            <div>Yes</div>
            <div>No</div>
          </div>
        ) : form?.answers?.type === "categorical" ? (
          <>
            <div className="flex center gap-4">
              {form.answers.answers.map((answer, index) => (
                <div className="bg-gray-200 rounded-md py-1 px-2">{answer}</div>
              ))}
            </div>
          </>
        ) : (
          ""
        )}
      </div>
      <div className="mb-10">
        <Label className="mb-2">Oracle</Label>
        <h3 className="text-base font-normal">
          {form?.oracle ? shortenAddress(form?.oracle, 8, 8) : "--"}
        </h3>
      </div>
      <div className="mb-10">
        <Label className="mb-2">Description</Label>
        <div className="flex center ">
          {form?.description ? (
            <div className="w-2/3 bg-gray-100 rounded-md p-4">
              <QuillViewer value={form?.description} />
            </div>
          ) : (
            <span className="text-orange-300 bold">No description given.</span>
          )}
        </div>
      </div>

      <div className="italic font-light text-gray-400">
        Work in progress. To be continued...
      </div>
    </div>
  );
};

const Label: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return <div className={`text-sm text-gray-400 ${className}`}>{children}</div>;
};

export default MarketPreview;
