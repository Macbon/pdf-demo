'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { TextInPosition } from '@/types/textin';
import SvgRect from './SvgRect';
import '../app/pdf-viewer.css';

// 设置 PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface EnhancedPDFViewerProps {
  file: File | null;
  rects?: TextInPosition[][];
  result?: any; // 完整的解析结果
  onLoadSuccess?: (numPages: number) => void;
  focusId?: number | null;
  initialPage?: number;
  onRectClick?: (contentId: number, pageNumber: number, cellId?: string) => void;
}

const EnhancedPDFViewer: React.FC<EnhancedPDFViewerProps> = ({ 
  file, 
  rects = [], 
  result,
  onLoadSuccess,
  focusId = null,
  initialPage = 1,
  onRectClick,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(initialPage);
  const [scale, setScale] = useState<number>(1.5);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);
  const [rotate, setRotate] = useState<number>(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const viewerRef = useRef<HTMLDivElement>(null);

  // 当 initialPage 变化时更新页码
  React.useEffect(() => {
    if (initialPage > 0 && initialPage <= numPages) {
      setPageNumber(initialPage);
      // 滚动到指定页面
      setTimeout(() => {
        const pageElement = document.querySelector(`[data-page-number="${initialPage}"]`);
        if (pageElement) {
          pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [initialPage, numPages]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    onLoadSuccess?.(numPages);
  };

  const onPageLoadSuccess = (page: any) => {
    const viewport = page.getViewport({ scale: 1, rotation: rotate });
    setPageWidth(viewport.width);
    setPageHeight(viewport.height);
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

  const rotateRight = () => {
    setRotate((prev) => (prev + 90) % 360);
  };

  const rotateLeft = () => {
    setRotate((prev) => (prev - 90 + 360) % 360);
  };

  const resetView = () => {
    setScale(1.5);
    setRotate(0);
  };

  // 处理画框点击
  const handleRectClick = useCallback((contentId: number, cellId?: string) => {
    if (onRectClick) {
      onRectClick(contentId, pageNumber, cellId);
    }
  }, [pageNumber, onRectClick]);

  // 获取当前页的DPI信息
  const getCurrentPageDpi = (): number => {
    if (!result || !result.pages) return 144;
    
    const currentPageData = result.pages[pageNumber - 1];
    if (currentPageData) {
      // 1. 如果有显式的 dpi/ppi 字段，直接使用
      if (currentPageData.ppi || currentPageData.dpi) {
        return currentPageData.ppi || currentPageData.dpi;
      }
      
      // 2. 如果有 width 字段，根据 JSON 尺寸与 PDF 基础尺寸的比例动态计算 DPI
      if (currentPageData.width && pageWidth) {
        const ratio = currentPageData.width / pageWidth;
        const calculatedDpi = 96 * ratio;
        console.log('💡 动态计算 DPI:', {
          jsonWidth: currentPageData.width,
          pdfBaseWidth: pageWidth,
          ratio,
          calculatedDpi,
          说明: `${currentPageData.width} / ${pageWidth} * 96 = ${calculatedDpi}`
        });
        return calculatedDpi;
      }
    }
    
    // 3. 检查 metrics
    if (result.metrics && Array.isArray(result.metrics)) {
      const metric = result.metrics.find((m: any) => m.page_id === pageNumber);
      if (metric) {
        return metric.dpi || metric.ppi || 144;
      }
    }
    
    return 144;
  };

  // 获取 DPI 缩放比例（关键！）
  const getDpiScale = (): number => {
    const pdfViewDpi = 96;   // PDF.js 渲染使用的 DPI
    const resultDpi = getCurrentPageDpi();  // TextIn 结果的 DPI (通常是 144)
    return pdfViewDpi / resultDpi;  // 例如: 96 / 144 = 0.667
  };

  // 渲染当前页的标识框
  const renderRects = (pageIndex: number) => {
    const pageRects = rects[pageIndex];
    if (!pageRects || !pageRects.length || !pageWidth || !pageHeight) return null;

    const dpiScale = getDpiScale();
    
    // 获取 JSON 中的页面尺寸（用于 ViewBox）
    const jsonPageWidth = result?.pages?.[pageIndex]?.width;
    const jsonPageHeight = result?.pages?.[pageIndex]?.height;

    console.log('🎯 Step 2: EnhancedPDFViewer 传递给 SvgRect:', { 
      focusId, 
      pageNumber, 
      rectsCount: pageRects.length,
      focusIdType: typeof focusId,
      dpiScale,
      jsonPageSize: { width: jsonPageWidth, height: jsonPageHeight },
      pdfBaseSize: { width: pageWidth, height: pageHeight }
    });

    return (
      <SvgRect
        rectList={pageRects}
        pageNumber={pageNumber}
        scale={scale}
        pageWidth={pageWidth}
        pageHeight={pageHeight}
        dpiScale={dpiScale}
        jsonPageWidth={jsonPageWidth}
        jsonPageHeight={jsonPageHeight}
        focusId={focusId}
        onRectClick={handleRectClick}
        autoLink={true}
      />
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
    <div className="flex flex-col h-full bg-gray-100">
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="上一页"
          >
            ← 上一页
          </button>
          <span className="px-3 py-1 bg-gray-50 border border-gray-300 rounded min-w-[100px] text-center">
            {pageNumber} / {numPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="下一页"
          >
            下一页 →
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={rotateLeft}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            title="逆时针旋转"
          >
            ↺ 90°
          </button>
          <button
            onClick={rotateRight}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            title="顺时针旋转"
          >
            ↻ 90°
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            title="缩小"
          >
            -
          </button>
          <span className="px-3 py-1 bg-gray-50 border border-gray-300 rounded min-w-[80px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            title="放大"
          >
            +
          </button>
          <button
            onClick={resetView}
            className="px-3 py-1.5 bg-blue-50 border border-blue-300 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            title="重置视图"
          >
            重置
          </button>
        </div>
      </div>

      {/* PDF 渲染区域 */}
      <div ref={viewerRef} className="flex-1 overflow-auto bg-gray-200 p-4">
        <div className="flex justify-center">
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">加载 PDF 中...</p>
                </div>
              </div>
            }
            error={
              <div className="flex items-center justify-center p-8 text-red-500">
                <div className="text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p className="font-medium">加载 PDF 失败</p>
                  <p className="text-sm text-gray-500 mt-2">请检查文件格式是否正确</p>
                </div>
              </div>
            }
          >
            {/* 关键改进：使用独立的容器包装每一页 */}
            <div 
              className="relative bg-white shadow-lg"
              data-page-number={pageNumber}
              style={{ display: 'inline-block' }}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotate}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              {/* SVG 覆盖层 - 关键：必须在 Page 之后渲染 */}
              {pageWidth > 0 && pageHeight > 0 && renderRects(pageNumber - 1)}
            </div>
          </Document>
        </div>
      </div>

      {/* 图例和信息栏 */}
      {rects.length > 0 && (
        <div className="p-4 bg-white border-t">
          <div className="flex flex-wrap items-center gap-6">
            {/* 图例 */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 opacity-75"></div>
                <span>段落</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-red-600 opacity-75"></div>
                <span>文本</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-green-600 opacity-75"></div>
                <span>表格</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2" style={{ borderColor: '#BD8D1C' }}></div>
                <span>图片</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-red-700 opacity-75"></div>
                <span>公式</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-purple-600 opacity-75"></div>
                <span>手写</span>
              </div>
            </div>
            
            {/* 统计信息 */}
            <div className="ml-auto flex gap-4 text-sm text-gray-600">
              <span>当前页元素: <strong className="text-gray-900">{rects[pageNumber - 1]?.length || 0}</strong></span>
              <span>总元素: <strong className="text-gray-900">{rects.reduce((sum, page) => sum + page.length, 0)}</strong></span>
              {result && result.pages && result.pages[pageNumber - 1] && (
                <span>DPI: <strong className="text-gray-900">{getCurrentPageDpi()}</strong></span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPDFViewer;
