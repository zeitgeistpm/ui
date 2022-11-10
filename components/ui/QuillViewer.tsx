import ReactQuill from "react-quill";
import "react-quill/dist/quill.bubble.css";

const QuillViewer = ({ value }: { value: string }) => {
  return <ReactQuill theme="bubble" value={value} readOnly={true} />;
};

export default QuillViewer;
