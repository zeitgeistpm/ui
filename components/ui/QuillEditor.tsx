import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "react-quill/dist/quill.bubble.css";

const QuillEditor = ({
  onChange,
  placeholder,
}: {
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    onChange(value);
  }, [value]);

  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={setValue}
      placeholder={placeholder}
    />
  );
};

export default QuillEditor;
