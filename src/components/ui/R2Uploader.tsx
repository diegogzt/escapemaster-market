import React, { useState, useRef, useCallback } from "react";
import { cn } from "../../lib/utils";
import { Upload, X, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const API_BASE = (import.meta.env.PUBLIC_API_URL as string) || '';

interface R2UploaderProps {
  bucket?: string;
  folder: string;
  value?: string;
  onUpload: (url: string, key: string) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
  disabled?: boolean;
  variant?: "room" | "avatar" | "gallery";
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

export function R2Uploader({
  bucket = "master",
  folder,
  value,
  onUpload,
  accept = "image/*",
  maxSize = DEFAULT_MAX_SIZE,
  className,
  disabled = false,
  variant = "room",
}: R2UploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentUrl = value;

  const uploadFile = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    setProgress(0);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Tipo de archivo no permitido. Usa JPG, PNG, WebP o GIF.");
      setUploading(false);
      return;
    }

    if (file.size > maxSize) {
      setError(`El archivo es demasiado grande. Máximo ${Math.round(maxSize / 1024 / 1024)}MB.`);
      setUploading(false);
      return;
    }

    try {
      const extension = file.name.split(".").pop() || "jpg";
      const timestamp = Date.now();
      const filename = `${timestamp}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
      const key = `${folder}/${filename}`;

      const presignRes = await fetch(`${API_BASE}/upload/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, contentType: file.type }),
      });

      if (!presignRes.ok) {
        throw new Error("Error al generar URL de subida");
      }

      const { uploadUrl, key: returnedKey } = await presignRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) {
        throw new Error("Error al subir archivo a R2");
      }

      setProgress(100);
      const publicUrl = `${import.meta.env.PUBLIC_R2_PUBLIC_BASE_URL || "https://pub-d893856059e2460aa3f811b26da67ab2.r2.dev"}/${returnedKey}`;
      onUpload(publicUrl, returnedKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [folder, maxSize, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || uploading) return;

    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [disabled, uploading, uploadFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const isRoom = variant === "room";
  const size = isRoom ? "h-48" : "h-32";

  return (
    <div className={cn("space-y-3", className)}>
      {currentUrl ? (
        <div className="relative">
          <div className={cn(
            "rounded-xl border border-border overflow-hidden bg-muted/20",
            size
          )}>
            <img
              src={currentUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-green-600">Subido</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="ml-auto text-xs font-semibold text-tropical-primary hover:underline"
              >
                Cambiar
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
            disabled={disabled || uploading}
          />
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={cn(
            "relative rounded-xl border-2 border-dashed transition-all cursor-pointer",
            dragging ? "border-tropical-primary bg-tropical-primary/5" : "border-border hover:border-tropical-primary/50",
            disabled && "opacity-50 cursor-not-allowed",
            size,
            "flex flex-col items-center justify-center gap-2"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-tropical-primary animate-spin" />
              <span className="text-xs font-medium text-foreground/50">Subiendo... {progress}%</span>
            </>
          ) : (
            <>
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                isRoom ? "bg-tropical-primary/10" : "bg-tropical-secondary/10"
              )}>
                <Upload className={cn(
                  "w-6 h-6",
                  isRoom ? "text-tropical-primary" : "text-tropical-secondary"
                )} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground/70">
                  Arrastra una imagen o <span className="text-tropical-primary">haz click</span>
                </p>
                <p className="text-[10px] font-medium text-foreground/30 mt-0.5">
                  JPG, PNG, WebP • Máx {Math.round(maxSize / 1024 / 1024)}MB
                </p>
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
            disabled={disabled || uploading}
          />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-destructive text-xs font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default R2Uploader;
