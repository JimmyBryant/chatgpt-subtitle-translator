import { useState } from "react";
import { Button } from "@nextui-org/react";

export const FileUploadButton = ({ label, onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  // Handle file input change
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragging ? "#0070f3" : "#ccc"}`,
        borderRadius: "8px",
        padding: "20px",
        textAlign: "center",
        cursor: "pointer",
        backgroundColor: isDragging ? "#f0f8ff" : "white",
      }}
    >
      <input
        type="file"
        id="file-input"
        style={{ display: "none" }}
        onChange={handleFileInput}
      />
      <label htmlFor="file-input" style={{ display: "block" }}>
        <Button as="span" color="primary">
          {label}
        </Button>
      </label>
      <p style={{ marginTop: "10px" }}>
        或拖拽文件到此处上传
      </p>
    </div>
  );
};