import React, { useState, useRef } from 'react';
import { Upload, X, Film, Loader2 } from 'lucide-react';
import { uploadFileToStorage, resolveChunkedUrl } from '../lib/firebase';

interface VideoUploaderProps {
  id: string;
  currentValue: string | undefined;
  onChange: (value: string) => void;
  label?: string;
}

export default function VideoUploader({ id, currentValue, onChange, label }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enforce max 20 MB for videos since they are larger
  const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

  const processFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setErrorMessage('Bitte wähle eine gültige Videodatei (MP4, WEBM, MOV, etc.)');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(`Video ist zu groß (${sizeInMb} MB). Die maximale Dateigröße für Videos beträgt 20 MB.`);
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setErrorMessage('');

    try {
      const downloadUrl = await uploadFileToStorage(
        file,
        'videos',
        file.name,
        (progress) => setUploadProgress(progress)
      );
      onChange(downloadUrl);
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Firebase Storage video upload failed:', err);
      setErrorMessage('Upload fehlgeschlagen. Bitte versuche es erneut.');
      setIsProcessing(false);
    }
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
      <div id={`video-uploader-container-${id}`} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Preview video */}
        <div 
          id={`video-uploader-preview-box-${id}`} 
          className="relative w-24 h-24 rounded-lg bg-zinc-100 border border-zinc-200 flex-shrink-0 flex items-center justify-center overflow-hidden group shadow-inner"
        >
          {currentValue ? (
            <>
              <video 
                src={resolveChunkedUrl(currentValue)} 
                className="w-full h-full object-cover"
                muted
                playsInline
                loop
                autoPlay
              />
              <button
                id={`video-uploader-remove-btn-${id}`}
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 hover:scale-110 active:scale-95 transition-all text-xs cursor-pointer shadow z-10"
                title="Video löschen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400">
              <Film className="w-6 h-6 mb-1" />
              <span className="text-[10px] uppercase font-mono">Kein Video</span>
            </div>
          )}
        </div>

        {/* Drag & Drop Area / Click Selector */}
        <div
          id={`video-uploader-dragzone-${id}`}
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
            accept="video/*"
            className="hidden"
          />

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center space-y-2 w-full px-4">
              <Loader2 className="w-5 h-5 animate-spin text-[#0073aa]" />
              <p className="text-xs text-zinc-700 font-bold">Wird hochgeladen... {uploadProgress}%</p>
              <div className="w-full max-w-xs bg-zinc-200 h-2 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="bg-[#0073aa] h-full rounded-full transition-all duration-150" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <Upload className="w-5 h-5 mx-auto text-zinc-400" />
              <p className="text-xs text-zinc-700 font-semibold">
                Video hierher ziehen oder <span className="text-[#0073aa] underline">durchsuchen</span>
              </p>
              <p className="text-[10px] text-zinc-400 uppercase font-mono">MP4, WEBM, MOV (Max. 25MB)</p>
            </div>
          )}
        </div>
      </div>
      {errorMessage && (
        <p className="text-xs text-red-600 font-semibold">{errorMessage}</p>
      )}
    </div>
  );
}
