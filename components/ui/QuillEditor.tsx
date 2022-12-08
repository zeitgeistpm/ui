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

  const modules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  const formats = ["bold", "underline", "italic", "link", "list"];

  return (
    <ReactQuill
      className={className}
      value={value}
      onChange={setValue}
      placeholder={placeholder}
      modules={modules}
      formats={formats}
    />
  );
};

export default QuillEditor;
