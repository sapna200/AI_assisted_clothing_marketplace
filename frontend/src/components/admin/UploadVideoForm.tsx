"use client";

import { useState } from "react";
import { uploadProductVideo } from "@/lib/api";
import Button from "@/components/ui/Button";

interface UploadVideoFormProps {
  onUploaded: () => void;
  onToast: (message: string, type: "success" | "error") => void;
}

export default function UploadVideoForm({
  onUploaded,
  onToast,
}: UploadVideoFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    setProgress(0);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    try {
      await uploadProductVideo(file, setProgress);
      onToast("Video uploaded! AI is processing the draft (10–30s)…", "success");
      setFile(null);
      // Give the background AI task a moment, then surface the new draft.
      onUploaded();
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detail = (err as any)?.response?.data?.detail;
      onToast(String(detail ?? "Upload failed"), "error");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Upload a product video
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        A short clip of a clothing item (5–15s, rotating slowly). AI extracts
        frames, reads title/description/category/color, and detects size &amp;
        tag price for your review.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <label className="flex-1 cursor-pointer">
          <input
            type="file"
            accept="video/*,.mp4,.mov,.webm"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <span className="block w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-indigo-400 transition-colors truncate">
            {file ? `📹 ${file.name}` : "＋ Choose a video file"}
          </span>
        </label>
        <Button onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? "Uploading…" : "Upload"}
        </Button>
      </div>

      {uploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{progress}% uploaded</p>
        </div>
      )}
    </div>
  );
}