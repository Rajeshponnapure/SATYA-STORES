"use client";

import Image from "next/image";
import { Camera, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface ProfileImagePickerProps {
  image?: string;
  name: string;
  onUpload: (fileName: string, fileData: string) => Promise<string | null>;
}

export function ProfileImagePicker({ image, name, onUpload }: ProfileImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Profile images must be 3 MB or smaller.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const data = typeof reader.result === "string" ? reader.result : "";
      const url = data ? await onUpload(file.name, data) : null;
      if (url) {
        setPreview(url);
        toast.success("Profile photo updated.");
      }
      setUploading(false);
    };
    reader.onerror = () => {
      toast.error("Could not read that image. Please try again.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white ring-4 ring-white">
        {(preview || image) ? (
          <Image src={preview || image || ""} alt={`${name} profile photo`} fill sizes="64px" unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {name ? <span className="text-xl font-black">{name.charAt(0).toUpperCase()}</span> : <UserRound className="h-7 w-7" />}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">Profile photo</p>
        <p className="mt-0.5 text-xs text-slate-500">JPG, PNG, or WebP · up to 3 MB</p>
        <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60">
          <Camera className="h-4 w-4" />{uploading ? "Uploading…" : "Choose photo"}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { void handleFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
    </div>
  );
}
