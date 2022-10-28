import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "react-quill/dist/quill.bubble.css";

const QuillEditor = ({
  onChange,
  placeholder,
  className,
}: {
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    onChange(value);
  }, [value]);

  return (
    <ReactQuill
      className={className}
      theme="snow"
      value={value}
      onChange={setValue}
      placeholder={placeholder}
    />
  );
};

export default QuillEditor;
