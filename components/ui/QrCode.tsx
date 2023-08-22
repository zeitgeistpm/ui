import React from "react";
import { useQRCode } from "next-qrcode";

type QrCodeProps = {
  width?: number;
  text: string;
};

const QrCode: React.FC<QrCodeProps> = ({ width, text }) => {
  const { Canvas } = useQRCode();
  return (
    <Canvas
      text={text}
      options={{
        width,
      }}
    />
  );
};

export default QrCode;
