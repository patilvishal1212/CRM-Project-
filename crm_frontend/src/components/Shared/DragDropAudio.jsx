import React, { useState, useRef } from 'react';

const DragDropAudio = ({ onFileSelect, initialFileName = '' }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState(initialFileName);
  const [fileSize, setFileSize] = useState('');
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = (file) => {
    if (!file) return;

    // Check extension
    const allowedExtensions = ['mp3', 'wav', 'm4a'];
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (!allowedExtensions.includes(extension)) {
      setError('Invalid file type. Only .mp3, .wav, or .m4a audio files are allowed.');
      setFileName('');
      setFileSize('');
      onFileSelect(null);
      return;
    }

    // Check size (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File is too large. Maximum allowed size is 50MB.');
      setFileName('');
      setFileSize('');
      onFileSelect(null);
      return;
    }

    setError('');
    setFileName(file.name);
    
    // Format size
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    setFileSize(`${sizeInMB} MB`);
    
    onFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFileName('');
    setFileSize('');
    setError('');
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1">
        Call Audio Pitch Recording *
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
            : fileName
            ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/5'
            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-900/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="audio/mp3,audio/wav,audio/x-m4a,audio/m4a"
          onChange={handleFileChange}
          className="hidden"
        />

        {fileName ? (
          <div className="flex items-center gap-3 w-full animate-scaleUp">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{fileName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{fileSize}</p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
              title="Remove audio file"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="text-center">
            <svg className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2.5 transition-transform duration-200 group-hover:scale-105" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Drag & Drop call recording audio here
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Supports WAV, MP3, or M4A (Max. 50MB) or click to browse.
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-rose-500 font-semibold mt-1 animate-shake">
          {error}
        </p>
      )}
    </div>
  );
};

export default DragDropAudio;
