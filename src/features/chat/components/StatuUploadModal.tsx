"use client";

import React, { useState } from "react";
import { X, Image, Type, Video } from "lucide-react";
import { toast } from "react-hot-toast";

interface StatusData {
  type: "text" | "image" | "video";
  content: string;
  backgroundColor?: string;
  textColor?: string;
  font?: string;
  image?: File;
}

interface StatusUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (statusData: StatusData) => Promise<void>;
}

const StatusUploadModal: React.FC<StatusUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
}) => {
  const [type, setType] = useState<"text" | "image" | "video">("text");
  const [content, setContent] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#3B82F6");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [font, setFont] = useState("font-sans");
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const statusData: StatusData = {
        type,
        content,
        backgroundColor: type === "text" ? backgroundColor : undefined,
        textColor: type === "text" ? textColor : undefined,
        font: type === "text" ? font : undefined,
        image: type !== "text" ? image || undefined : undefined,
      };

      await onUpload(statusData);
      setContent("");
      setImage(null);
      setType("text");
      setBackgroundColor("#3B82F6");
      setTextColor("#FFFFFF");
      setFont("font-sans");
      onClose();
    } catch (error) {
      toast.error("Failed to upload status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "image" && !file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      if (type === "video" && !file.type.startsWith("video/")) {
        toast.error("Please select a video file");
        return;
      }
      setImage(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-[var(--background)] text-[var(--foreground)] rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Upload Status</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2 mb-4">
            <button
              type="button"
              onClick={() => setType("text")}
              className={`p-2 rounded-full ${
                type === "text" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              <Type className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setType("image")}
              className={`p-2 rounded-full ${
                type === "image" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              <Image className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setType("video")}
              className={`p-2 rounded-full ${
                type === "video" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              <Video className="w-5 h-5" />
            </button>
          </div>

          {type === "text" ? (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full p-3 rounded-lg bg-gray-100 text-black focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <div className="space-y-2">
                <div>
                  <label className="text-sm">Background Color</label>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-full h-10 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm">Text Color</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full h-10 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm">Font</label>
                  <select
                    value={font}
                    onChange={(e) => setFont(e.target.value)}
                    className="w-full p-2 rounded-lg bg-gray-100 text-black"
                  >
                    <option value="font-sans">Sans</option>
                    <option value="font-serif">Serif</option>
                    <option value="font-mono">Mono</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="text-sm">
                Upload {type === "image" ? "Image" : "Video"}
              </label>
              <input
                type="file"
                accept={type === "image" ? "image/*" : "video/*"}
                onChange={handleFileChange}
                className="w-full p-2 rounded-lg bg-gray-100 text-black"
              />
              {image && (
                <p className="text-sm mt-2">Selected: {image.name}</p>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (type !== "text" && !image) || (type === "text" && !content)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUploadModal;