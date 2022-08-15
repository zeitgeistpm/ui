import { FC, ImgHTMLAttributes } from "react";

const Image: FC<
  ImgHTMLAttributes<HTMLImageElement> & {
    imageUrl1x: string;
    imageUrl2x?: string;
  }
> = ({ imageUrl1x, imageUrl2x, ...restParams }) => {
  if (imageUrl2x == null) {
    return <img src={imageUrl1x} {...restParams} />;
  }
  return (
    <img
      src={imageUrl1x}
      srcSet={`${imageUrl1x} 1x, ${imageUrl2x} 2x`}
      {...restParams}
    />
  );
};

export default Image;
