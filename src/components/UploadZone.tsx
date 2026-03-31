import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, X, FileText, Film, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  video: ["video/mp4", "video/quicktime", "video/webm"],
  document: ["application/pdf", "text/plain", "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};
const ALL_ALLOWED = Object.values(ALLOWED_TYPES).flat();
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

interface UploadedFile {
  id: string;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number;
  ai_description?: string | null;
}

interface UploadZoneProps {
  linkedEntityType?: string;
  linkedEntityId?: string;
  onUploadComplete?: (file: UploadedFile) => void;
  compact?: boolean;
}

export default function UploadZone({ linkedEntityType, linkedEntityId, onUploadComplete, compact }: UploadZoneProps) {
  const { user } = useAuth();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; type: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileCategory = (mime: string) => {
    if (ALLOWED_TYPES.image.includes(mime)) return "image";
    if (ALLOWED_TYPES.video.includes(mime)) return "video";
    return "document";
  };

  const uploadFile = useCallback(async (file: File) => {
    if (!user) return;
    setError(null);

    if (!ALL_ALLOWED.includes(file.type)) {
      setError(`Unsupported file type: ${file.type.split("/")[1] || "unknown"}`);
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File too large. Maximum size is 50MB.");
      return;
    }

    setUploading(true);
    setProgress(10);

    const category = getFileCategory(file.type);
    if (category === "image") {
      setPreview({ url: URL.createObjectURL(file), type: "image" });
    }

    const ext = file.name.split(".").pop() || "bin";
    const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    setProgress(30);
    const { error: uploadError } = await supabase.storage
      .from("mavis-media")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setError("Upload failed. Please try again.");
      setUploading(false);
      setPreview(null);
      return;
    }

    setProgress(70);
    const { data: urlData } = supabase.storage.from("mavis-media").getPublicUrl(path);
    const fileUrl = urlData.publicUrl;

    // Save metadata
    const { data: mediaRow, error: dbError } = await supabase.from("media" as any).insert({
      user_id: user.id,
      file_url: fileUrl,
      file_type: category,
      file_name: file.name,
      file_size: file.size,
      linked_entity_type: linkedEntityType || null,
      linked_entity_id: linkedEntityId || null,
    }).select("*").single();

    if (dbError) {
      setError("Failed to save file metadata.");
      setUploading(false);
      setPreview(null);
      return;
    }

    setProgress(90);

    // Trigger AI analysis via edge function (fire and forget)
    if (category === "image" || category === "document") {
      supabase.functions.invoke("navi-analyze-media", {
        body: { media_id: (mediaRow as any).id, file_url: fileUrl, file_type: category, file_name: file.name },
      }).catch(() => {});
    }

    setProgress(100);
    setTimeout(() => {
      setUploading(false);
      setProgress(0);
      setPreview(null);
      onUploadComplete?.(mediaRow as any);
    }, 300);
  }, [user, linkedEntityType, linkedEntityId, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded cursor-pointer transition-colors ${
          compact ? "p-3" : "p-6"
        } ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={handleChange}
          accept={ALL_ALLOWED.join(",")} />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            {preview && <img src={preview.url} className="w-12 h-12 rounded object-cover" alt="" />}
            <Loader2 size={compact ? 16 : 20} className="animate-spin text-primary" />
            <div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] font-mono text-muted-foreground">{progress}%</p>
          </div>
        ) : (
          <div className={`flex ${compact ? "flex-row gap-2" : "flex-col gap-1"} items-center justify-center text-muted-foreground`}>
            <Upload size={compact ? 14 : 20} />
            <p className={`${compact ? "text-[10px]" : "text-xs"} font-mono`}>
              {compact ? "Upload file" : "Drop files here or click to browse"}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2 text-destructive text-[10px] font-mono">
          <X size={10} /> {error}
        </div>
      )}
    </div>
  );
}

// Thumbnail display for attached media
export function MediaThumbnail({ file, onClick }: { file: UploadedFile; onClick?: () => void }) {
  if (file.file_type === "image") {
    return (
      <div className="relative group cursor-pointer" onClick={onClick}>
        <img src={file.file_url} alt={file.file_name}
          className="w-20 h-20 rounded object-cover border border-border group-hover:border-primary/40 transition-colors" />
        {file.ai_description && (
          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center p-1">
            <p className="text-[8px] font-mono text-foreground text-center line-clamp-3">{file.ai_description}</p>
          </div>
        )}
      </div>
    );
  }
  if (file.file_type === "video") {
    return (
      <div className="relative group cursor-pointer w-20 h-20 bg-muted rounded border border-border flex items-center justify-center"
        onClick={onClick}>
        <Film size={20} className="text-muted-foreground" />
        <div className="absolute bottom-0.5 left-0.5 right-0.5">
          <p className="text-[7px] font-mono text-muted-foreground truncate text-center">{file.file_name}</p>
        </div>
      </div>
    );
  }
  return (
    <a href={file.file_url} target="_blank" rel="noreferrer"
      className="flex items-center gap-1.5 px-2 py-1.5 bg-muted border border-border rounded text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
      <FileText size={12} /> {file.file_name}
    </a>
  );
}

// Lightbox viewer
export function MediaLightbox({ file, onClose }: { file: UploadedFile | null; onClose: () => void }) {
  if (!file) return null;
  return (
    <div className="fixed inset-0 z-50 bg-background/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-8 right-0 text-muted-foreground hover:text-foreground">
          <X size={20} />
        </button>
        {file.file_type === "image" && (
          <div>
            <img src={file.file_url} alt={file.file_name} className="w-full max-h-[80vh] object-contain rounded" />
            {file.ai_description && (
              <p className="text-xs font-mono text-muted-foreground mt-2 text-center">{file.ai_description}</p>
            )}
          </div>
        )}
        {file.file_type === "video" && (
          <video src={file.file_url} controls className="w-full max-h-[80vh] rounded" />
        )}
        {file.file_type === "document" && (
          <div className="bg-card border border-border rounded p-6 text-center">
            <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-mono text-foreground mb-2">{file.file_name}</p>
            {file.ai_description && (
              <p className="text-xs text-muted-foreground mb-4">{file.ai_description}</p>
            )}
            <a href={file.file_url} target="_blank" rel="noreferrer"
              className="text-xs font-mono text-primary hover:underline">Download</a>
          </div>
        )}
      </div>
    </div>
  );
}
