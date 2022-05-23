import { observer } from "mobx-react";
import React, { FC, useEffect, useState } from "react";
import { Copy } from "react-feather";

export type CopyIconProps = {
  copyText: string;
  className?: string;
  size?: number;
};

const CopyIcon: FC<CopyIconProps> = observer(
  ({ copyText, className = "", size = 20 }) => {
    const [recentlyCopied, setRecentlyCopied] = useState(false);

    const copyAddressToClipboard = () => {
      navigator.clipboard.writeText(copyText);
      setRecentlyCopied(true);
    };

    const handleCopy = (event) => {
      event.stopPropagation();
      copyAddressToClipboard();
    };

    useEffect(() => {
      let ref;
      if (recentlyCopied) {
        ref = setTimeout(() => {
          setRecentlyCopied(false);
        }, 1000);
      }
      return () => clearTimeout(ref);
    }, [recentlyCopied]);

    return (
      <div className={"w-ztg-20 flex items-center " + className}>
        {recentlyCopied ? (
          <span className="text-sky-600 text-ztg-12-150 ml-auto">Copied!</span>
        ) : (
          <Copy
            size={size}
            role="button"
            className="cursor-pointer text-sky-600 ml-auto"
            onClick={handleCopy}
          />
        )}
      </div>
    );
  }
);

export default CopyIcon;
