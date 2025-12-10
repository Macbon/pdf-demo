'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { parsePdfWithTextin, convertTextInResultToRects } from '@/lib/textin-api';
import type { TextInPosition } from '@/types/textin';

// 动态导入组件以避免服务端渲染问题
const EnhancedPDFViewer = dynamic(() => import('@/components/EnhancedPDFViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">加载 PDF 查看器...</p>
      </div>
    </div>
  ),
});

const ResultViewer = dynamic(() => import('@/components/ResultViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500">加载结果查看器...</p>
      </div>
    </div>
  ),
});

// TextIn API 凭证
const TEXTIN_APP_ID = 'ec0abf01ac8fdca69e2cd2bfa50c5c7e';
const TEXTIN_SECRET_CODE = '3616214cef3d8d2a3e4f2728adb36a24';

// API 端点
const API_URL = 'https://api.textin.com/ai/service/v1/pdf_to_markdown';

// API 参数配置
const DEFAULT_OPTIONS = {
  apply_document_tree: 1,
  apply_merge: 1,
  catalog_details: 1,
  dpi: 144,
  formula_level: 1,
  get_excel: 1,
  get_image: 'both',
  markdown_details: 1,
  page_count: 1000,
  page_details: 1,
  page_start: 1,
  paratext_mode: 'annotation',
  parse_mode: 'scan',
  raw_ocr: 0,
  table_flavor: 'html',
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [rects, setRects] = useState<TextInPosition[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [parsed, setParsed] = useState(false);
  const [fullResult, setFullResult] = useState<any>(null);
  
  // 双向联动状态
  const [focusId, setFocusId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // 面板显示状态
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // 文件选择处理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setRects([]);
      setParsed(false);
      setError('');
      setFullResult(null);
      setFocusId(null);
    } else {
      setError('请选择 PDF 文件');
    }
  };

  // 加载本地 PDF
  const loadLocalPdf = async () => {
    try {
      const response = await fetch('/论文.pdf');
      const blob = await response.blob();
      const file = new File([blob], '论文.pdf', { type: 'application/pdf' });
      setFile(file);
      setError('');
      console.log('已加载本地 PDF 文件:', file.name);
    } catch (err) {
      setError('加载本地 PDF 失败，请确认 public/论文.pdf 文件存在');
      console.error('加载本地文件错误:', err);
    }
  };

  // 加载本地 JSON
  const loadLocalJson = async () => {
    try {
      // 先加载 PDF
      const pdfResponse = await fetch('/论文.pdf');
      const pdfBlob = await pdfResponse.blob();
      const pdfFile = new File([pdfBlob], '论文.pdf', { type: 'application/pdf' });
      setFile(pdfFile);

      // 加载 JSON
      const jsonResponse = await fetch('/论文.json');
      const jsonData = await jsonResponse.json();
      
      // 处理结果
      setFullResult(jsonData);
      
      let rectsData: TextInPosition[][] = [];
      if (jsonData.result) {
        rectsData = convertTextInResultToRects(jsonData.result);
      } else if (jsonData.detail) {
        rectsData = convertTextInResultToRects(jsonData);
      }
      
      setRects(rectsData);
      setParsed(true);
      setError('');
      console.log('已加载本地 JSON 文件');
    } catch (err) {
      setError('加载本地 JSON 失败');
      console.error('加载本地 JSON 错误:', err);
    }
  };

  // API 解析
  const handleParse = async () => {
    if (!file) {
      setError('请先上传 PDF 文件或加载本地文件');
      return;
    }

    setLoading(true);
    setError('');
    setFullResult(null);

    try {
      console.log('使用 API:', API_URL);
      console.log('使用参数:', DEFAULT_OPTIONS);
      
      const result = await parsePdfWithTextin(file, { 
        appId: TEXTIN_APP_ID, 
        secretCode: TEXTIN_SECRET_CODE,
        apiUrl: API_URL,
        options: DEFAULT_OPTIONS,
      });
      
      setFullResult(result);
      
      let rectsData: TextInPosition[][] = [];
      if (result.result) {
        rectsData = convertTextInResultToRects(result.result);
      } else {
        rectsData = convertTextInResultToRects(result);
      }
      
      setRects(rectsData);
      setParsed(true);
      console.log('解析结果:', result);
      
      if (result.result?.markdown) {
        console.log('Markdown 内容预览:', result.result.markdown.substring(0, 500) + '...');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '解析失败';
      setError(errorMessage);
      console.error('解析错误:', err);
    } finally {
      setLoading(false);
    }
  };

  // 下载 JSON 结果
  const downloadJson = () => {
    if (!fullResult) return;
    const blob = new Blob([JSON.stringify(fullResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'result.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // 处理画框点击（PDF -> 结果）
  const handleRectClick = useCallback((contentId: number, pageNumber: number, cellId?: string) => {
    console.log('画框被点击:', { contentId, pageNumber, cellId });
    setFocusId(contentId);
    setCurrentPage(pageNumber);
  }, []);

  // 处理结果点击（结果 -> PDF）
  const handleContentClick = useCallback((contentId: number, pageNumber: number) => {
    console.log('🎯 Step 1: 结果被点击:', { 
      contentId, 
      pageNumber,
      contentIdType: typeof contentId 
    });
    setFocusId(contentId);
    setCurrentPage(pageNumber);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧控制面板 */}
      {showLeftPanel && (
        <div className="w-80 bg-white border-r shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600 relative">
            <button
              onClick={() => setShowLeftPanel(false)}
              className="absolute top-4 right-4 text-white hover:bg-blue-700 rounded p-1"
              title="隐藏左侧面板"
            >
              ✕
            </button>
            <h1 className="text-2xl font-bold text-white">PDF 解析 Demo</h1>
            <p className="text-sm text-blue-100 mt-2">位置溯源 + 双向联动</p>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* API 凭证状态 */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <span className="text-lg">✓</span>
                <span className="font-medium">API 凭证已配置</span>
              </div>
            </div>

            {/* 文件选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择 PDF 文件
              </label>
              
              <button
                onClick={loadLocalPdf}
                className="w-full mb-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium transition-colors"
              >
                📄 加载 public/论文.pdf
              </button>

              <button
                onClick={loadLocalJson}
                className="w-full mb-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors"
              >
                📊 加载 public/论文.json
              </button>

              <div className="relative mb-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">或者</span>
                </div>
              </div>

              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              
              {file && (
                <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                  <p className="text-sm text-gray-700 font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    大小: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            {/* 解析按钮 */}
            <div className="space-y-2">
              <button
                onClick={handleParse}
                disabled={loading || !file}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    解析中...
                  </span>
                ) : (
                  '调用 API 解析'
                )}
              </button>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-medium text-red-800 mb-2">❌ 错误</h4>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 解析结果统计 */}
            {parsed && fullResult && (
              <div className="space-y-3">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">📊 解析结果</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>总页数: <strong>{rects.length}</strong></li>
                    <li>总元素数: <strong>{rects.reduce((sum, page) => sum + page.length, 0)}</strong></li>
                    {rects.slice(0, 5).map((page, idx) => (
                      <li key={idx}>
                        第 {idx + 1} 页: <strong>{page.length}</strong> 个元素
                      </li>
                    ))}
                    {rects.length > 5 && (
                      <li className="text-gray-500">...</li>
                    )}
                  </ul>
                </div>

                <button
                  onClick={downloadJson}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 text-sm font-medium transition-colors"
                >
                  💾 下载 JSON 结果
                </button>
              </div>
            )}

            {/* 使用说明 */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="text-sm font-medium text-gray-800 mb-2">💡 双向联动说明</h3>
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                <li>点击 PDF 中的画框可跳转到右侧结果</li>
                <li>点击右侧结果可跳转到 PDF 画框</li>
                <li>支持表格单元格级别的精确定位</li>
                <li>支持多页 PDF 自动翻页</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 显示左侧面板按钮 */}
      {!showLeftPanel && (
        <button
          onClick={() => setShowLeftPanel(true)}
          className="fixed left-4 top-4 z-50 px-3 py-2 bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700 transition-colors"
          title="显示控制面板"
        >
          ☰ 控制面板
        </button>
      )}

      {/* 中间 PDF 查看器 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <EnhancedPDFViewer
          file={file}
          rects={rects}
          result={fullResult}
          focusId={focusId}
          initialPage={currentPage}
          onRectClick={handleRectClick}
        />
      </div>

      {/* 右侧结果展示 */}
      {showRightPanel && (
        <div className="w-96 bg-white border-l shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-green-500 to-green-600 relative">
            <button
              onClick={() => setShowRightPanel(false)}
              className="absolute top-4 right-4 text-white hover:bg-green-700 rounded p-1"
              title="隐藏右侧面板"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold text-white">解析结果</h2>
            <p className="text-sm text-green-100 mt-1">点击内容可跳转到 PDF</p>
          </div>
          
          <ResultViewer
            result={fullResult}
            focusId={focusId}
            onContentClick={handleContentClick}
          />
        </div>
      )}

      {/* 显示右侧面板按钮 */}
      {!showRightPanel && (
        <button
          onClick={() => setShowRightPanel(true)}
          className="fixed right-4 top-4 z-50 px-3 py-2 bg-green-600 text-white rounded-md shadow-lg hover:bg-green-700 transition-colors"
          title="显示结果面板"
        >
          📊 结果面板
        </button>
      )}
    </div>
  );
}
