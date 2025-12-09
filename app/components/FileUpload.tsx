'use client';

import { useCallback } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file && file.type === 'application/pdf') {
        onFileSelect(file);
      }
    },
    [onFileSelect, disabled]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center transition-colors
        ${disabled 
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
          : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
        }
      `}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        id="pdf-upload"
      />
      <label
        htmlFor="pdf-upload"
        className={`flex flex-col items-center gap-2 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span className="text-gray-600 font-medium">
          {disabled ? '处理中...' : '点击或拖拽上传 PDF 文件'}
        </span>
        <span className="text-gray-400 text-sm">支持 PDF 格式</span>
      </label>
    </div>
  );
}
