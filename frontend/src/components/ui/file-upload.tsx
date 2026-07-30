"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { fetchApi } from "@/lib/api";

interface FileUploadProps {
  /** URL de l'image actuelle (si existante) pour l'aperçu */
  value?: string;
  /** Fonction de rappel déclenchée une fois l'upload réussi renvoyant l'URL */
  onChange: (url: string) => void;
  /** Message d'aide affiché sous la zone de drop */
  description?: string;
}

/**
 * Composant de zone de dépôt (Drag & Drop) pour le téléversement de fichiers.
 * Gère la sélection, la prévisualisation et la transmission via FormData à l'API.
 *
 * @param {FileUploadProps} props - Les propriétés du composant.
 * @returns {JSX.Element} L'interface utilisateur de la zone d'upload.
 */
export function FileUpload({ value, onChange, description = "PNG, JPG ou WEBP (max. 5MB)" }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Transmet le fichier à l'API et récupère l'URL d'accès public.
   */
  const processFile = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetchApi<{ url: string }>("/v1/upload/image", {
        method: "POST",
        body: formData,
      });

      if (response?.url) {
        // En développement local (port 4000), on construit l'URL absolue. En production, le proxy gère le relatif.
        const fullUrl = process.env.NODE_ENV === "production" ? response.url : `http://localhost:4000${response.url}`;
        onChange(fullUrl);
      }
    } catch (error) {
      console.error("Échec de l'upload:", error);
      alert("Le format du fichier est invalide ou le fichier est trop lourd.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full">
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-champagne/40 bg-champagne/5 group h-48 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Aperçu du fichier" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-noir/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={() => onChange("")}
              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
              aria-label="Supprimer l'image"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`h-48 w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
            isDragging ? "border-or bg-or/5" : "border-champagne/40 hover:border-or/50 hover:bg-champagne/5"
          }`}
          role="button"
          tabIndex={0}
          aria-label="Zone de dépôt pour téléverser une image"
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg, image/png, image/webp"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) void processFile(e.target.files[0]);
            }}
          />
          {isUploading ? (
            <div className="flex flex-col items-center text-champagne animate-pulse">
              <Loader2 size={32} className="animate-spin mb-3 text-or" />
              <span className="font-montserrat font-bold text-sm">Téléversement en cours...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-champagne">
              <UploadCloud size={32} className="mb-3 opacity-60" />
              <span className="font-montserrat font-bold text-sm text-noir mb-1">
                Cliquez ou glissez une image ici
              </span>
              <span className="font-raleway text-xs">{description}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
