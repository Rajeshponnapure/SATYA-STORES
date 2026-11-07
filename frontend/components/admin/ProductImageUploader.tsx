"use client";

import Image from "next/image";
import React, { useState, useRef } from "react";
import {
  UploadCloud,
  Camera,
  X,
  Star,
  Link2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { toast } from "sonner";

interface ProductImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  minImages?: number;
  maxImages?: number;
}

export function ProductImageUploader({
  images,
  onChange,
  minImages = 2,
  maxImages = 10,
}: ProductImageUploaderProps) {
  const { uploadImage } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState("");

  const isAtMax = images.length >= maxImages;
  const isBelowMin = images.length < minImages;

  const processFile = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith("image/")) {
      toast.error(`"${file.name}" is not a valid image file.`);
      return null;
    }

    return new Promise<string | null>((resolve) => {
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
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    if (images.length >= maxImages) {
      toast.error(`Maximum limit of ${maxImages} images reached. Remove an image to add more.`);
      return;
    }

    const availableSlots = maxImages - images.length;
    const fileArray = Array.from(files).slice(0, availableSlots);

    if (files.length > availableSlots) {
      toast.info(`Only ${availableSlots} more image${availableSlots > 1 ? "s" : ""} allowed. Adding first ${availableSlots}.`);
    }

    setIsUploading(true);
    const newUrls: string[] = [];

    for (const file of fileArray) {
      try {
        const url = await processFile(file);
        if (url) newUrls.push(url);
      } catch (e) {
        console.error("Error uploading file:", e);
      }
    }

    setIsUploading(false);

    if (newUrls.length > 0) {
      const combined = [...images, ...newUrls].slice(0, maxImages);
      onChange(combined);
      toast.success(`Added ${newUrls.length} image${newUrls.length > 1 ? "s" : ""}`);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (images.length >= maxImages) {
      toast.error(`Maximum limit of ${maxImages} images already reached.`);
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
    if (updated.length < minImages) {
      toast.warning(`At least ${minImages} images are required for this product.`);
    }
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const target = images[indexToPrimary];
    const remaining = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([target, ...remaining]);
    toast.info("Cover image updated to #1");
  };

  const handleMoveImage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= images.length) return;
    const updated = [...images];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    onChange(updated);
  };

  const handleAddManualUrl = () => {
    if (images.length >= maxImages) {
      toast.error(`Maximum of ${maxImages} images reached.`);
      return;
    }

    const clean = manualUrlInput.trim();
    if (!clean) return;
    if (!clean.startsWith("http://") && !clean.startsWith("https://") && !clean.startsWith("/")) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }

    onChange([...images, clean].slice(0, maxImages));
    setManualUrlInput("");
    toast.success("Image URL added");
  };

  return (
    <div className="space-y-3">
      {/* Hidden native input with multiple selection support */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        disabled={isAtMax}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Requirement Header Pill */}
      <div className="flex items-center justify-between text-xs pb-1">
        <div className="flex items-center gap-1.5 font-bold">
          <span>Product Images</span>
          <span className="text-[11px] font-semibold text-slate-500">
            (Min: {minImages}, Max: {maxImages})
          </span>
        </div>

        {/* Counter Badge */}
        {isBelowMin ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-extrabold border border-amber-200 animate-pulse">
            <AlertCircle className="h-3 w-3" />
            {images.length} / {maxImages} (Need at least {minImages - images.length} more)
          </span>
        ) : isAtMax ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-extrabold border border-blue-200">
            <CheckCircle2 className="h-3 w-3 text-blue-600" />
            {images.length} / {maxImages} (Max Reached)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            {images.length} / {maxImages} Uploaded
          </span>
        )}
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isAtMax) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!isAtMax) fileInputRef.current?.click();
          else toast.info(`Maximum ${maxImages} images reached.`);
        }}
        className={`relative rounded-2xl border-2 border-dashed p-5 text-center transition-all ${
          isAtMax
            ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
            : isDragging
            ? "border-blue-600 bg-blue-50/80 scale-[1.01] shadow-md cursor-copy"
            : "border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-white cursor-pointer"
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`p-3 rounded-2xl shadow-sm transition-colors ${
                isDragging
                  ? "bg-blue-600 text-white"
                  : "bg-blue-100 text-blue-600"
              }`}
            >
              <UploadCloud className="h-6 w-6" />
            </span>
            <span className="p-3 rounded-2xl bg-amber-100 text-amber-700 shadow-sm sm:hidden">
              <Camera className="h-6 w-6" />
            </span>
          </div>

          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              {isAtMax ? (
                <span>Maximum limit of {maxImages} images reached</span>
              ) : isDragging ? (
                <span className="text-blue-600 font-extrabold">
                  Drop your photos here (up to {maxImages - images.length} remaining)
                </span>
              ) : (
                <>
                  <span className="text-blue-600 hover:underline">Click to browse</span> or drag and drop images
                </>
              )}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Drag multiple JPG, PNG, WEBP files (Min: {minImages}, Max: {maxImages} photos)
            </p>
          </div>

          {isUploading && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold pt-1">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Processing & uploading images...
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Images Gallery Preview & Ordering */}
      {images.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
            <span>
              {images.length} of {maxImages} images
            </span>
            <span className="text-slate-400">#1 is the primary cover photo</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {images.map((imgUrl, idx) => (
              <div
                key={idx}
                className={`group relative rounded-xl border bg-white overflow-hidden shadow-sm aspect-square flex items-center justify-center transition-all ${
                  idx === 0
                    ? "ring-2 ring-blue-500 border-blue-400"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <Image width={640} height={640} unoptimized
                  src={imgUrl}
                  alt={`Product Photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Index / Cover Badge */}
                {idx === 0 ? (
                  <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md flex items-center gap-1 z-10">
                    <Star className="h-2.5 w-2.5 fill-white" />
                    Cover
                  </span>
                ) : (
                  <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md z-10">
                    #{idx + 1}
                  </span>
                )}

                {/* Overlay actions on hover/touch */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 z-20">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white p-1 rounded-full shadow-md transition-transform hover:scale-110"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveImage(idx, idx - 1);
                      }}
                      className="p-1 rounded bg-white/90 text-slate-800 disabled:opacity-30 hover:bg-white"
                      title="Move backward"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>

                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(idx);
                        }}
                        className="py-0.5 px-1.5 rounded bg-blue-600 text-white text-[9px] font-bold hover:bg-blue-700"
                      >
                        Set Cover
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={idx === images.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveImage(idx, idx + 1);
                      }}
                      className="p-1 rounded bg-white/90 text-slate-800 disabled:opacity-30 hover:bg-white"
                      title="Move forward"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual URL Link Input */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowManualUrl(!showManualUrl)}
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1"
        >
          <Link2 className="h-3.5 w-3.5" />
          {showManualUrl ? "Hide manual URL input" : "Or add image URL link"}
        </button>

        {showManualUrl && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="url"
              disabled={isAtMax}
              placeholder="https://images.unsplash.com/photo-..."
              value={manualUrlInput}
              onChange={(e) => setManualUrlInput(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={isAtMax || !manualUrlInput.trim()}
              onClick={handleAddManualUrl}
              className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-40"
            >
              Add Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
