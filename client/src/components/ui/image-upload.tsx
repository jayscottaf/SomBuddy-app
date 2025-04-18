import React, { useState, useRef } from "react";
import { CameraIcon, ImageIcon, XIcon } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageSelect: (file: File, previewUrl: string) => void;
  className?: string;
}

export function ImageUpload({ onImageSelect, className }: ImageUploadProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        onImageSelect(file, reader.result);
        setIsPopoverOpen(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*;capture=camera";
      fileInputRef.current.click();
    }
  };

  const handlePhotoLibraryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileSelect}
        accept="image/*"
      />
      
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <button 
            type="button"
            className={cn(
              "rounded-full flex items-center justify-center hover:bg-gray-100 w-8 h-8 transition-colors",
              className
            )}
            aria-label="Add image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        </PopoverTrigger>
        
        <PopoverContent sideOffset={5} className="w-56 p-0">
          <div className="flex flex-col py-1">
            <button
              onClick={handleCameraClick}
              className="flex items-center gap-2 p-3 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <CameraIcon className="w-4 h-4" />
              <span>Take a Photo</span>
            </button>
            
            <button
              onClick={handlePhotoLibraryClick}
              className="flex items-center gap-2 p-3 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Choose from Library</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}