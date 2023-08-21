import { ReactNode } from "react";

const TruncatedText = (props: {
  length: number;
  text: string;
  children: (text: string) => ReactNode;
}) => {
  let isCutOff = props.text?.length > props.length;
  let cuttofText = `${props.text?.slice(0, props.length)}${
    isCutOff ? "..." : ""
  }`;

  return <span title={props.text}>{props.children(cuttofText)}</span>;
};

export default TruncatedText;
