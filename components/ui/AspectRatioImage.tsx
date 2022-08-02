import React, { CSSProperties, FC, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useEvent } from "lib/hooks";
import { useStore } from "lib/stores/Store";

export interface AspectRatioImageProps {
  /** width divided by height */
  ratio: number;
  imageUrl: string;
  className?: string;
}

const AspectRatioImage: FC<AspectRatioImageProps> = observer(
  ({ ratio, imageUrl, className = "" }) => {
    const [height, setHeight] = useState<number>();
    const container = useRef<HTMLDivElement>();
    const resizeEvent = useEvent(window, "resize", 50);
    const store = useStore();

    useEffect(() => {
      if (!container.current) {
        return;
      }
      setHeight(container.current.getBoundingClientRect().width / ratio);
    }, [resizeEvent, store.leftDrawerClosed, store.rightDrawerClosed]);

    return (
      <div
        className={className}
        ref={container}
        style={
          {
            backgroundColor: "#c4c4c4",
            backgroundSize: "cover",
            backgroundImage: `url(${imageUrl})`,
            backgroundOrigin: "border-box",
            backgroundPosition: "center",
            height: `${height}px`,
          } as CSSProperties
        }
      ></div>
    );
  },
);

export default AspectRatioImage;
