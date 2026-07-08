import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, File } from 'lucide-react';

interface DocumentUploaderProps {
  id: string;
  currentUrl: string | undefined;
  currentFilename: string | undefined;
  onChange: (url: string, filename: string) => void;
  label?: string;
}

export default function DocumentUploader({ id, currentUrl, currentFilename, onChange, label }: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Support large files by chunking them in Firestore (limit increased to 10 MB)
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  const processFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeInKb = Math.round(file.size / 1024);
      setErrorMessage(`Datei ist zu groß (${sizeInKb} KB). Die maximale Dateigröße für den Upload beträgt 10 MB.`);
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setErrorMessage('');

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percent);
      }
    };

    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        // Ensure progress hits 100% visibly before completing
        setUploadProgress(100);
        const dataUrl = event.target.result;
        setTimeout(() => {
          onChange(dataUrl, file.name);
          setIsProcessing(false);
        }, 400);
      } else {
        setErrorMessage('Fehler bei der Dateiverarbeitung.');
        setIsProcessing(false);
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
    onChange('', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-zinc-600 font-bold mb-1 text-xs">{label}</label>}
      <div id={`document-uploader-container-${id}`} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Preview document box */}
        <div 
          id={`document-uploader-preview-box-${id}`} 
          className="relative w-24 h-24 rounded-lg bg-zinc-50 border border-zinc-200 flex-shrink-0 flex items-center justify-center overflow-hidden group shadow-inner"
        >
          {currentUrl ? (
            <div className="flex flex-col items-center justify-center text-emerald-600 p-2 text-center">
              <FileText className="w-8 h-8 mb-1" />
              <span className="text-[9px] uppercase font-mono font-bold truncate max-w-full block" title={currentFilename}>
                {currentFilename || 'DOKUMENT'}
              </span>
              <button
                id={`document-uploader-remove-btn-${id}`}
                type="button"
                onClick={handleRemove}
                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 hover:scale-110 active:scale-95 transition-all text-xs cursor-pointer shadow"
                title="Dokument löschen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-400">
              <File className="w-6 h-6 mb-1" />
              <span className="text-[10px] uppercase font-mono">Keine Datei</span>
            </div>
          )}
        </div>

        {/* Drag & Drop Area / Click Selector */}
        <div
          id={`document-uploader-dragzone-${id}`}
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
            accept=".pdf,.txt,.docx,.png,.jpg,.jpeg"
            className="hidden"
          />

          {isProcessing ? (
            <div className="flex flex-col items-center justify-center space-y-2 w-full px-4">
              <Loader2 className="w-5 h-5 animate-spin text-[#0073aa]" />
              <p className="text-xs text-zinc-700 font-bold">Wird geladen... {uploadProgress}%</p>
              <div className="w-full max-w-xs bg-zinc-200 h-2.5 rounded-full overflow-hidden shadow-inner">
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
                Dokument hierher ziehen oder <span className="text-[#0073aa] underline">durchsuchen</span>
              </p>
              <p className="text-[10px] text-zinc-400 uppercase font-mono">PDF, TXT, DOCX, etc. (Max. 10 MB)</p>
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
