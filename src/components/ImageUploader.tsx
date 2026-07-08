import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  id: string;
  currentValue: string | undefined;
  onChange: (value: string) => void;
  label?: string;
}

export default function ImageUploader({ id, currentValue, onChange, label }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Bitte wähle eine gültige Bilddatei (PNG, JPG, WEBP, etc.)');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to keep Firestore doc size small and performance super high
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress as JPEG with 0.75 quality for visual perfectness and tiny size (~20-40kb)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          onChange(dataUrl);
        } else {
          setErrorMessage('Fehler bei der Bildverarbeitung.');
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        setErrorMessage('Fehler beim Laden des Bildes.');
        setIsProcessing(false);
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.onerror = () => {
      setErrorMessage('Datei konnte nicht gelesen werden.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-zinc-600 font-bold mb-1 text-xs">{label}</label>}
      <div id={`image-uploader-container-${id}`} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Preview image */}
        <div 
          id={`image-uploader-preview-box-${id}`} 
          className="relative w-24 h-24 rounded-lg bg-zinc-100 border border-zinc-200 flex-shrink-0 flex items-center justify-center overflow-hidden group shadow-inner"
        >
          {currentValue ? (
            <>
              <img 
                src={currentValue} 
                alt="Vorschau" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                id={`image-uploader-remove-btn-${id}`}
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 hover:scale-110 active:scale-95 transition-all text-xs cursor-pointer shadow"
                title="Bild löschen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400">
              <ImageIcon className="w-6 h-6 mb-1" />
              <span className="text-[10px] uppercase font-mono">Kein Bild</span>
            </div>
          )}
        </div>

        {/* Drag & Drop Area / Click Selector */}
        <div
          id={`image-uploader-dragzone-${id}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 w-full min-h-[96px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-150 ${
            isDragging 
              ? 'border-[#0073aa] bg-[#cce9ff]/10 text-[#0073aa]' 
              : 'border-zinc-300 hover:border-[#0073aa] hover:bg-zinc-50'
          }`}
        >
          <input
            id={id}
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-5 h-5 animate-spin text-[#0073aa]" />
              <p className="text-xs text-zinc-500 font-medium">Bilder werden optimiert...</p>
            </div>
          ) : (
            <div className="space-y-1">
              <Upload className="w-5 h-5 mx-auto text-zinc-400" />
              <p className="text-xs text-zinc-700 font-semibold">
                Bild hierher ziehen oder <span className="text-[#0073aa] underline">durchsuchen</span>
              </p>
              <p className="text-[10px] text-zinc-400 uppercase font-mono">PNG, Jpeg, WebP, SVG (Max. 10MB)</p>
            </div>
          )}
        </div>
      </div>
      {errorMessage && (
        <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
          <span>⚠️ {errorMessage}</span>
        </p>
      )}
    </div>
  );
}
