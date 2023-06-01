import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "react-quill/dist/quill.bubble.css";
import { FormEvent } from "components/create/editor/types";

const QuillEditor = ({
  name,
  value,
  onChange,
  onBlur,
  placeHolder,
  className,
}: {
  name?: string;
  value?: string;
  onChange: (value: FormEvent<string>) => void;
  onBlur: (value: FormEvent<string>) => void;
  placeHolder?: string;
  className?: string;
}) => {
  const modules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  const formats = ["bold", "underline", "italic", "link", "list"];

  const handleChange = (value: string, delta) => {
    onChange?.({
      type: "change",
      target: {
        name,
        value,
      },
    });
  };

  const handleBlur = (a, b, c: ReactQuill.UnprivilegedEditor) => {
    onBlur?.({
      type: "blur",
      target: {
        name,
        value: c.getHTML(),
      },
    });
  };

  return (
    <ReactQuill
      className={className}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeHolder}
      modules={modules}
      formats={formats}
    />
  );
};

export default QuillEditor;
