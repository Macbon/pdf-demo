'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import SvgRect from './SvgRect';
import { RectItem } from '../types';

// 设置 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  rects: RectItem[][];
  activeId: string | number | null;
  onRectClick: (contentId: string | number) => void;
  onPageChange?: (page: number) => void;
}

export default function PDFViewer({ url, rects, activeId, onRectClick, onPageChange }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [pageScale, setPageScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 加载 PDF
  useEffect(() => {
    if (!url) return;

    const loadPDF = async () => {
      try {
        const doc = await pdfjsLib.getDocument(url).promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
      } catch (error) {
        console.error('PDF 加载失败:', error);
      }
    };

    loadPDF();
  }, [url]);

  // 渲染当前页
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    try {
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 计算缩放比例以适应容器宽度
      const containerWidth = containerRef.current.clientWidth - 40;
      const viewport = page.getViewport({ scale: 1 });
      const newScale = containerWidth / viewport.width;
      
      setPageScale(newScale);
      
      const scaledViewport = page.getViewport({ scale: newScale * scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      await page.render({
        canvasContext: ctx,
        viewport: scaledViewport,
      }).promise;
    } catch (error) {
      console.error('页面渲染失败:', error);
    }
  }, [pdfDoc, scale]);

  useEffect(() => {
    renderPage(currentPage);
  }, [currentPage, renderPage]);

  useEffect(() => {
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  // 页面导航
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 滚动到指定页面（供外部调用）
  const scrollToPage = useCallback((pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  }, [totalPages]);

  // 暴露方法给父组件
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).scrollToPage = scrollToPage;
    }
  }, [scrollToPage]);

  const currentRects = rects[currentPage - 1] || [];

  return (
    <div className="flex flex-col h-full bg-gray-100 rounded-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <span className="text-sm text-gray-600">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            -
          </button>
          <span className="text-sm text-gray-600 w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2, s + 0.25))}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            +
          </button>
        </div>
      </div>

      {/* PDF 渲染区域 */}
      <div ref={containerRef} className="flex-1 overflow-auto p-5">
        <div className="relative inline-block mx-auto shadow-lg bg-white">
          <canvas ref={canvasRef} />
          <SvgRect
            rects={currentRects}
            scale={pageScale * scale}
            activeId={activeId}
            onRectClick={onRectClick}
          />
        </div>
      </div>
    </div>
  );
}
