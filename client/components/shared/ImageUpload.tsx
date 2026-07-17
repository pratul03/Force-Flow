"use client";

import { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  isUploading?: boolean;
  className?: string;
  shape?: "circle" | "square";
}

export function ImageUpload({
  currentImageUrl,
  onUpload,
  onRemove,
  isUploading = false,
  className,
  shape = "square",
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await onUpload(e.target.files[0]);
    }
  };

  return (
    <div className={cn("relative group", className)}>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center overflow-hidden border-2 border-dashed transition-all hover:bg-slate-50 cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-slate-200",
          shape === "circle" ? "rounded-full aspect-square" : "rounded-lg aspect-video w-full",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleChange}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-2 p-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-xs font-medium text-slate-500">Uploading...</span>
          </div>
        ) : currentImageUrl ? (
          <>
            <Image
              src={currentImageUrl}
              alt="Uploaded image"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <UploadCloud className="h-8 w-8 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 p-4 text-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Click or drag image</p>
              <p className="text-xs text-slate-500">SVG, PNG, JPG or GIF (max. 5MB)</p>
            </div>
          </div>
        )}
      </div>

      {currentImageUrl && onRemove && !isUploading && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
          <span className="sr-only">Remove</span>
        </Button>
      )}
    </div>
  );
}
