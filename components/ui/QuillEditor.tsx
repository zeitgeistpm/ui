import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "react-quill/dist/quill.bubble.css";

const QuillEditor = ({ onChange }: { onChange: (value: string) => void }) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    onChange(value);
  }, [value]);

  return <ReactQuill theme="snow" value={value} onChange={setValue} />;
};

export default QuillEditor;
