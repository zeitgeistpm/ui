import { observer } from "mobx-react";
import { Plus } from "react-feather";

type PaginatorProps = {
  disabled?: boolean;
  onPlusClicked?: () => void;
};

const Paginator = observer(
  ({ disabled = false, onPlusClicked = () => {} }: PaginatorProps) => {
    const handlePlusClicked = () => {
      onPlusClicked();
    };
    return (
      <div className="mt-ztg-40 w-full flex justify-center items-center">
        <div className="w-ztg-184 flex flex-col">
          <div className="flex flex-row h-ztg-24 justify-center items-center">
            <Plus
              onClick={() => {
                if (!disabled) {
                  handlePlusClicked();
                }
              }}
              size={24}
              className={
                !disabled ? "cursor-pointer" : "cursor-default opacity-20"
              }
            />
          </div>
          <div className="flex flex-row h-ztg-38 justify-center">
            <div
              className={
                "text-ztg-12-150 font-medium w-ztg-164 h-full flex items-center justify-center " +
                (!disabled ? "cursor-pointer" : "cursor-default opacity-20")
              }
            >
              Load more
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default Paginator;
