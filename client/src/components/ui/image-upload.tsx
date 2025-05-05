import React, { useRef } from "react";
import { Camera } from "lucide-react";

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void;
  className?: string;
}

export function ImageUpload({ onImageSelect, className = "" }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        onImageSelect(file, e.target.result as string);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
      />
      <button
        type="button"
        className={className}
        onClick={() => fileInputRef.current?.click()}
        title="Upload food photo"
      >
        <Camera className="h-5 w-5" />
      </button>
    </>
  );
}