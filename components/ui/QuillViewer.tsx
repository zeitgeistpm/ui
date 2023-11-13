import { useMemo } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.bubble.css";

const QuillViewer = ({ value }: { value: string }) => {
  const formats = ["bold", "underline", "italic", "link", "list"];

  const parsedValue = useMemo(() => {
    const maxLength = 30;
    const regex = /<a.*?>(.*?)<\/a>/g;
    const matches = value.matchAll(regex);

    for (const match of matches) {
      const [fullLink, linkText] = match;

      const linkContainSpaces = linkText.includes(" ");

      if (linkContainSpaces === false) {
        const newLinkText =
          linkText.length > maxLength
            ? linkText.substring(0, maxLength) + "..."
            : linkText;

        value = value.replace(`>${linkText}<`, `>${newLinkText}<`);
      }
    }
    return value;
  }, [value]);

  return (
    <ReactQuill
      theme="bubble"
      value={parsedValue}
      readOnly={true}
      formats={formats}
    />
  );
};

export default QuillViewer;
