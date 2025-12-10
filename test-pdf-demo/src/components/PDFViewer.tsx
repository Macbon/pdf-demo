'use client';

import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { TextInPosition } from '@/types/textin';
import '../app/pdf-viewer.css';

// 设置 PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  file: File | null;
  rects?: TextInPosition[][];
  onLoadSuccess?: (numPages: number) => void;
  focusId?: number | null;
  initialPage?: number;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  file, 
  rects = [], 
  onLoadSuccess,
  focusId = null,
  initialPage = 1,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.5);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 当 initialPage 变化时更新页码
  React.useEffect(() => {
    if (initialPage > 0 && initialPage <= numPages) {
      setPageNumber(initialPage);
    }
  }, [initialPage, numPages]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onLoadSuccess?.(numPages);
  };

  const onPageLoadSuccess = (page: any) => {
    const viewport = page.getViewport({ scale: 1 });
    setPageWidth(viewport.width * scale);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  // 渲染标识框
  const renderRects = (pageIndex: number) => {
    const pageRects = rects[pageIndex];
    if (!pageRects || !pageRects.length) return null;

    return (
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      >
        {pageRects.map((rect, idx) => {
          if (!rect.position || rect.position.length !== 8) return null;

          const [x1, y1, x2, y2, x3, y3, x4, y4] = rect.position.map(
            (val) => val * scale
          );
          const points = `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`;

          const typeColors: Record<string, string> = {
            text: 'rgba(255, 0, 0, 0.3)',
            table: 'rgba(0, 255, 0, 0.3)',
            image: 'rgba(0, 0, 255, 0.3)',
            title: 'rgba(255, 165, 0, 0.3)',
            paragraph: 'rgba(255, 0, 255, 0.3)',
          };

          const fillColor = typeColors[rect.type] || 'rgba(72, 119, 255, 0.3)';
          const isFocused = focusId !== null && rect.content_id === focusId;

          return (
            <g key={`rect-${pageIndex}-${idx}`}>
              <polygon
                points={points}
                fill={fillColor}
                stroke={isFocused ? '#FF0000' : '#4877FF'}
                strokeWidth={isFocused ? '4' : '2'}
                vectorEffect="non-scaling-stroke"
                className={`hover:fill-opacity-50 transition-all pointer-events-auto cursor-pointer ${
                  isFocused ? 'animate-pulse' : ''
                }`}
                style={isFocused ? { fill: 'rgba(255, 0, 0, 0.4)' } : {}}
              />
              {/* 显示序号 */}
              <g transform={`translate(${x1}, ${y1})`}>
                <rect
                  x="0"
                  y="0"
                  width="24"
                  height="20"
                  fill="#4877FF"
                  rx="2"
                />
                <text
                  x="12"
                  y="14"
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {idx + 1}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    );
  };

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        请上传 PDF 文件
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 bg-gray-100 border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="px-3">
            {pageNumber} / {numPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="px-3 py-1 bg-white border rounded hover:bg-gray-50"
          >
            -
          </button>
          <span className="px-3">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            className="px-3 py-1 bg-white border rounded hover:bg-gray-50"
          >
            +
          </button>
        </div>
      </div>

      {/* PDF 渲染区域 */}
      <div className="flex-1 overflow-auto bg-gray-200 p-4">
        <div className="flex justify-center">
          <div className="bg-white shadow-lg relative">
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-8">
                  加载中...
                </div>
              }
              error={
                <div className="flex items-center justify-center p-8 text-red-500">
                  加载 PDF 失败
                </div>
              }
            >
              <div className="relative">
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  onLoadSuccess={onPageLoadSuccess}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
                {/* 渲染标识框 */}
                {renderRects(pageNumber - 1)}
              </div>
            </Document>
          </div>
        </div>
      </div>

      {/* 图例 */}
      {rects.length > 0 && (
        <div className="p-4 bg-gray-100 border-t">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 opacity-50 border border-red-700"></div>
              <span>文本</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 opacity-50 border border-green-700"></div>
              <span>表格</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 opacity-50 border border-blue-700"></div>
              <span>图片</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 opacity-50 border border-orange-700"></div>
              <span>标题</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 opacity-50 border border-purple-700"></div>
              <span>段落</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;

