import { useRef, useState } from "react";

type Props = {
  label: string;
  accept?: string;
  onFile: (file: File) => void;
  file?: File | null;
};

export default function Dropzone({ label, accept = ".json", onFile, file }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type === "application/json" || selectedFile.name.endsWith('.json')) {
      onFile(selectedFile);
    } else {
      alert("Please select a valid JSON file");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      className={`card glass border-2 border-dashed p-8 text-center transition-all duration-300 hover:shadow-medium ${
        isDragOver 
          ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20 scale-105' 
          : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'
      } ${file ? 'border-green-400 bg-green-50/50 dark:bg-green-900/20' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFileSelect(f);
      }}
      role="region"
      aria-label={label}
    >
      {file ? (
        <div className="space-y-4 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <span className="text-green-600 dark:text-green-400 text-2xl">✅</span>
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-lg">{file.name}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {formatFileSize(file.size)} • {file.lastModified ? new Date(file.lastModified).toLocaleDateString() : 'Today'}
            </p>
          </div>
          <button
            className="btn btn-ghost text-sm"
            onClick={() => ref.current?.click()}
            type="button"
          >
            Change file
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <span className="text-slate-400 text-2xl">📁</span>
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-lg">{label}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Drag & drop or click to select
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => ref.current?.click()}
            type="button"
          >
            Choose file
          </button>
        </div>
      )}
      
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileSelect(f);
        }}
      />
    </div>
  );
}
