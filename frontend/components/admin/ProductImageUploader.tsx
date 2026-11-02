"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Camera, Image as ImageIcon, X, Star, Link2, Check, RefreshCw } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { toast } from "sonner";

interface ProductImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ProductImageUploader({ images, onChange }: ProductImageUploaderProps) {
  const { uploadImage } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState("");

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error(`"${file.name}" is not a valid image file.`);
      return;
    }

    // Convert file to base64 data url
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          // Upload to backend static storage
          const result = await uploadImage(file.name, base64Data);
          if (result.success && result.url) {
            resolve(result.url);
          } else {
            resolve(base64Data);
          }
        } catch {
          resolve(base64Data);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const url = await processFile(files[i]);
        if (url) newUrls.push(url);
      } catch (e) {
        console.error("Error uploading file:", e);
      }
    }

    setIsUploading(false);

    if (newUrls.length > 0) {
      onChange([...images, ...newUrls]);
      toast.success(`Added ${newUrls.length} image${newUrls.length > 1 ? "s" : ""}`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const target = images[indexToPrimary];
    const remaining = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([target, ...remaining]);
    toast.info("Cover image updated");
  };

  const handleAddManualUrl = () => {
    const clean = manualUrlInput.trim();
    if (!clean) return;
    if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("/")) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }
    onChange([...images, clean]);
    setManualUrlInput("");
    toast.success("Image URL added");
  };

  return (
    <div className="space-y-3">
      {/* Hidden native input with mobile camera + file picker support */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = ""; // Reset
        }}
      />

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50/70 scale-[1.01]"
            : "border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-white"
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-3 rounded-2xl bg-blue-100 text-blue-600 shadow-sm">
              <UploadCloud className="h-6 w-6" />
            </span>
            <span className="p-3 rounded-2xl bg-amber-100 text-amber-700 shadow-sm sm:hidden">
              <Camera className="h-6 w-6" />
            </span>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              <span className="text-blue-600 hover:underline">Click to browse</span> or drag and drop image
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              JPG, PNG, WEBP from your computer, mobile photo gallery, or camera
            </p>
          </div>

          {isUploading && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold pt-1">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Processing & uploading...
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Images Gallery Preview */}
      {images.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>{images.length} Image{images.length > 1 ? "s" : ""} Selected</span>
            <span className="text-[10px] text-slate-400">First image is the Primary cover</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="group relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm aspect-square flex items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl}
                  alt={`Product Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Primary Badge */}
                {idx === 0 ? (
                  <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-md flex items-center gap-1">
                    <Star className="h-3 w-3 fill-white" />
                    Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetPrimary(idx);
                    }}
                    className="absolute top-1.5 left-1.5 bg-slate-900/70 hover:bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Make Cover
                  </button>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(idx);
                  }}
                  className="absolute top-1.5 right-1.5 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition-transform hover:scale-110"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual URL Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
        >
          <Link2 className="h-3.5 w-3.5" />
          {showManualUrl ? "Hide manual URL input" : "Or paste image web link manually"}
        </button>

        {showManualUrl && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={manualUrlInput}
              onChange={(e) => setManualUrlInput(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={handleAddManualUrl}
              className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900"
            >
              Add Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

