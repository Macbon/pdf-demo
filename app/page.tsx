'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import FileUpload from './components/FileUpload';
import ResultView from './components/ResultView';
import { FileState } from './types';
import { formatResult } from './utils/formatResult';

// 动态导入 PDFViewer 避免 SSR 问题
const PDFViewer = dynamic(() => import('./components/PDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-gray-400">加载 PDF 查看器...</div>
    </div>
  ),
});

export default function Home() {
  const [fileState, setFileState] = useState<FileState>({
    file: null,
    url: '',
    status: 'idle',
    result: null,
    rects: [],
  });
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const pdfViewerRef = useRef<HTMLDivElement>(null);
  const resultViewRef = useRef<HTMLDivElement>(null);

  // 处理文件上传
  const handleFileSelect = useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    
    setFileState({
      file,
      url,
      status: 'parsing',
      result: null,
      rects: [],
    });
    setActiveId(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.code === 200 && data.data?.result) {
        const result = data.data.result;
        const rects = formatResult(result);

        setFileState({
          file,
          url,
          status: 'complete',
          result,
          rects,
        });
      } else {
        setFileState((prev) => ({
          ...prev,
          status: 'error',
          error: data.message || '解析失败',
        }));
      }
    } catch {
      setFileState((prev) => ({
        ...prev,
        status: 'error',
        error: '网络错误',
      }));
    }
  }, []);

  // 点击 PDF 画框 -> 高亮解析结果
  const handleRectClick = useCallback((contentId: string | number) => {
    setActiveId(contentId);
    
    setTimeout(() => {
      const resultItem = document.querySelector(`[data-content-id="${contentId}"]`);
      resultItem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }, []);

  // 点击解析结果 -> 高亮 PDF 画框
  const handleResultItemClick = useCallback((contentId: string | number, _pageId: number) => {
    setActiveId(contentId);
  }, []);

  const isProcessing = fileState.status === 'uploading' || fileState.status === 'parsing';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-800">PDF 解析 Demo</h1>
          <p className="text-sm text-gray-500 mt-1">
            上传 PDF 文件，查看解析结果，点击画框或解析项可双向联动
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {fileState.status === 'idle' && (
          <div className="mb-6">
            <FileUpload onFileSelect={handleFileSelect} disabled={isProcessing} />
          </div>
        )}

        {isProcessing && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-blue-700">解析中，请稍候...</span>
          </div>
        )}

        {fileState.status === 'error' && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg text-red-700">
            {fileState.error || '处理失败'}
            <button
              onClick={() => setFileState({ file: null, url: '', status: 'idle', result: null, rects: [] })}
              className="ml-4 text-sm underline"
            >
              重新上传
            </button>
          </div>
        )}

        {(fileState.status === 'complete' || fileState.status === 'parsing') && fileState.url && (
          <div className="grid grid-cols-2 gap-6" style={{ height: 'calc(100vh - 200px)' }}>
            <div ref={pdfViewerRef} className="h-full">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-700">PDF 原文</h2>
                <button
                  onClick={() => setFileState({ file: null, url: '', status: 'idle', result: null, rects: [] })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  重新上传
                </button>
              </div>
              <div className="h-[calc(100%-28px)]">
                <PDFViewer
                  url={fileState.url}
                  rects={fileState.rects}
                  activeId={activeId}
                  onRectClick={handleRectClick}
                />
              </div>
            </div>

            <div ref={resultViewRef} className="h-full">
              <h2 className="text-sm font-medium text-gray-700 mb-2">解析结果</h2>
              <div className="h-[calc(100%-28px)]">
                <ResultView
                  result={fileState.result}
                  rects={fileState.rects}
                  activeId={activeId}
                  onItemClick={handleResultItemClick}
                />
              </div>
            </div>
          </div>
        )}

        {fileState.status === 'complete' && (
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded" /> 段落
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-500 rounded" /> 标题
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-orange-500 rounded" /> 表格
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-purple-500 rounded" /> 图片
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
