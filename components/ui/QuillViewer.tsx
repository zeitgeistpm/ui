import ReactQuill from "react-quill";
import "react-quill/dist/quill.bubble.css";

const QuillViewer = ({ value }: { value: string }) => {
  const formats = ["bold", "underline", "italic", "link", "list"];

  return (
    <ReactQuill
      theme="bubble"
      value={value}
      readOnly={true}
      formats={formats}
    />
  );
};

export default QuillViewer;
