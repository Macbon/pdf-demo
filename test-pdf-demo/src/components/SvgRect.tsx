'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TextInPosition } from '@/types/textin';
import '@/app/svg-rect.css';

interface SvgRectProps {
  rectList: TextInPosition[];
  pageNumber: number;
  scale: number;
  pageWidth: number;
  pageHeight: number;
  dpiScale?: number;  // DPI 缩放比例 (pdfViewDpi / resultDpi)
  jsonPageWidth?: number;  // JSON 数据中的页面宽度（用于精确的 ViewBox）
  jsonPageHeight?: number; // JSON 数据中的页面高度（用于精确的 ViewBox）
  focusId?: number | null;
  onRectClick?: (contentId: number, cellId?: string) => void;
  autoLink?: boolean;
}

// 计算按钮位置（用于表格显示/隐藏单元格）
const calcBtnPosition = ({ viewRate, points }: { viewRate: number; points: number[] }) => {
  const size = 18 * viewRate;
  const position = { x: points[2] - size, y: points[3] - size, size };
  const boundSize = 30 * viewRate;
  if (position.y < boundSize) {
    Object.assign(position, { x: points[2] - size, y: points[3] });
  }
  return position;
};

// 获取单元格 ID 信息
const getCellId = (id?: string) => {
  if (!id) return undefined;
  try {
    if (id.includes('_skip_row_')) return undefined;
    const parts = id.split('_cell_').slice(1);
    if (parts.length < 3) return undefined;
    
    const [rowCol, rowSpan, colSpan] = parts;
    const [row_index, col_index] = rowCol.split('_').map(Number);
    const [row, row_span] = rowSpan.split('_').map(Number);
    const [col, col_span] = colSpan.split('_').map(Number);
    
    return { row_index, col_index, row, row_span, col, col_span };
  } catch (error) {
    console.log('getCellId error:', error, id);
  }
  return undefined;
};

const SvgRect: React.FC<SvgRectProps> = ({
  rectList,
  pageNumber,
  scale,
  pageWidth,
  pageHeight,
  dpiScale = 1,  // 默认值为 1 (无缩放)
  jsonPageWidth,
  jsonPageHeight,
  focusId,
  onRectClick,
  autoLink = false,
}) => {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [hiddenTables, setHiddenTables] = useState<Set<number>>(new Set());
  const svgRef = useRef<SVGSVGElement>(null);

  // 调试日志
  useEffect(() => {
    // 计算 ViewBox（用于日志）
    const calculatedViewBoxWidth = jsonPageWidth || Number((pageWidth / scale / dpiScale).toFixed(2));
    const calculatedViewBoxHeight = jsonPageHeight || Number((pageHeight / scale / dpiScale).toFixed(2));
    
    console.log('🎨 SvgRect 渲染:', {
      pageNumber,
      rectCount: rectList.length,
      focusId,
      pageWidth,
      pageHeight,
      scale,
      dpiScale,
      jsonPageSize: jsonPageWidth ? `${jsonPageWidth} x ${jsonPageHeight}` : '无',
      viewBoxWidth: calculatedViewBoxWidth,
      viewBoxHeight: calculatedViewBoxHeight,
      计算说明: jsonPageWidth 
        ? `直接使用 JSON 尺寸: ${jsonPageWidth} x ${jsonPageHeight}`
        : `计算: (${pageWidth} / ${scale} / ${dpiScale}) = ${calculatedViewBoxWidth}`,
    });
    
    if (rectList.length > 0) {
      console.log('📦 第一个 rect 示例:', rectList[0]);
      
      // 检查坐标范围是否在 ViewBox 内
      const firstRect = rectList[0];
      if (firstRect.position && firstRect.position.length === 8) {
        const maxX = Math.max(firstRect.position[0], firstRect.position[2], firstRect.position[4], firstRect.position[6]);
        const maxY = Math.max(firstRect.position[1], firstRect.position[3], firstRect.position[5], firstRect.position[7]);
        const vbWidth = jsonPageWidth || Number((pageWidth / scale / dpiScale).toFixed(2));
        const vbHeight = jsonPageHeight || Number((pageHeight / scale / dpiScale).toFixed(2));
        
        console.log('📏 坐标范围检查:', {
          坐标最大值: { x: maxX, y: maxY },
          ViewBox尺寸: { width: vbWidth, height: vbHeight },
          是否超出: { 
            x: maxX > vbWidth ? `❌ ${maxX} > ${vbWidth}` : `✅ ${maxX} <= ${vbWidth}`,
            y: maxY > vbHeight ? `❌ ${maxY} > ${vbHeight}` : `✅ ${maxY} <= ${vbHeight}`
          }
        });
      }
      
      // 🔍 新增：查找 focusId 对应的 rect
      if (focusId !== null && focusId !== undefined) {
        const targetRect = rectList.find(r => r.content_id === focusId);
        console.log(`🎯 寻找 content_id=${focusId} 的 rect:`, 
          targetRect ? '✅ 找到' : '❌ 未找到', 
          targetRect
        );
      }
      
      // 🔍 新增：打印所有 content_id
      console.log('📋 所有 content_id:', rectList.map(r => r.content_id));
    }
  }, [pageNumber, rectList.length, focusId, pageWidth, pageHeight, scale, dpiScale]);

  useEffect(() => {
    console.log('📥 Step 3: SvgRect useEffect 触发', { 
      focusId, 
      currentActiveId: activeId,
      willUpdate: focusId !== undefined && focusId !== null 
    });
    
    if (focusId !== undefined && focusId !== null) {
      console.log('✅ Step 4: 设置 activeId =', focusId);
      setActiveId(focusId);
    }
  }, [focusId]);

  // 切换表格单元格显示/隐藏
  const toggleTableCells = useCallback((contentId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setHiddenTables(prev => {
      const next = new Set(prev);
      if (next.has(contentId)) {
        next.delete(contentId);
      } else {
        next.add(contentId);
      }
      return next;
    });
  }, []);

  // 点击画框处理
  const handleRectClick = useCallback((e: React.MouseEvent, rect: TextInPosition) => {
    e.stopPropagation();
    
    if (rect.active === 0) return;

    // 清除旧的激活状态
    const oldActivePolygons = document.querySelectorAll('.svg-rect.active');
    oldActivePolygons.forEach(item => item.classList.remove('active'));

    // 激活当前 polygon
    const newActivePolygons = document.querySelectorAll(
      `.svg-rect[data-content-id="${rect.content_id}"]`
    );
    newActivePolygons.forEach(item => item.classList.add('active'));

    setActiveId(rect.content_id);

    if (onRectClick) {
      onRectClick(rect.content_id);
    }

    if (autoLink) {
      // 滚动到结果区域（如果有）
      const resultElement = document.querySelector(`[data-result-id="${rect.content_id}"]`);
      if (resultElement) {
        resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [autoLink, onRectClick]);

  // 点击单元格处理
  const handleCellClick = useCallback((e: React.MouseEvent, contentId: number, cellId: string) => {
    e.stopPropagation();
    
    // 清除旧的激活单元格
    const oldActiveCells = document.querySelectorAll('.svg-cell.active');
    oldActiveCells.forEach(item => item.classList.remove('active'));

    // 激活当前单元格
    e.currentTarget.classList.add('active');

    if (onRectClick) {
      onRectClick(contentId, cellId);
    }
  }, [onRectClick]);

  // 渲染矩形
  const renderRect = (rect: TextInPosition, idx: number) => {
    if (!rect.position || rect.position.length !== 8) return null;

    const [x1, y1, x2, y2, x3, y3, x4, y4] = rect.position;
    const points = `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`;

    const isActive = activeId === rect.content_id;
    const typeClass = rect.type || rect.sub_type || 'paragraph';
    const isTableHidden = hiddenTables.has(rect.content_id);
    
    // 🔍 新增：打印比较信息（只打印目标元素或第一个元素）
    if (rect.content_id === focusId || idx === 0) {
      console.log(`🎨 Step 5: renderRect [idx=${idx}]:`, {
        content_id: rect.content_id,
        activeId,
        focusId,
        isActive,
        strictMatch: activeId === rect.content_id,
        looseMatch: activeId == rect.content_id,
        types: {
          activeId: typeof activeId,
          contentId: typeof rect.content_id,
          focusId: typeof focusId
        }
      });
    }

    // 如果有单元格，渲染表格
    if (rect.cells && Array.isArray(rect.cells.cells) && rect.cells.cells.length > 0) {
      const viewRate = 1 / (scale * dpiScale);  // 按钮大小的缩放比例（包含 PDF 缩放 和 DPI 缩放）
      const btnPosition = calcBtnPosition({ viewRate, points: rect.position });

      return (
        <g 
          key={`rect-${pageNumber}-${idx}`} 
          className={`cell-g-wrapper ${isTableHidden ? 'cell-g-hidden' : ''}`}
          data-content-id={rect.content_id}
        >
          {/* 整表外框 */}
          <polygon
            data-content-id={rect.content_id}
            points={points}
            className={`svg-rect table ${isActive ? 'active' : ''}`}
            vectorEffect="non-scaling-stroke"
            onClick={(e) => handleRectClick(e, rect)}
          />
          
          {/* 单元格 */}
          {rect.cells.cells.map((cell: any, cellIdx: number) => {
            if (!cell.position || cell.position.length !== 8) return null;
            
            const [cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4] = cell.position;
            const cellId = `${rect.content_id}_cell_${cell.cell_id || `${cell.row_index}_${cell.col_index}_cell_${cell.row}_${cell.row_span}_cell_${cell.col}_${cell.col_span}`}`;
            
            return (
              <path
                key={`cell-${cellIdx}`}
                data-content-id={cellId}
                d={`M ${cx1} ${cy1} L ${cx2} ${cy2} L ${cx3} ${cy3} L ${cx4} ${cy4} Z`}
                className="svg-cell table"
                vectorEffect="non-scaling-stroke"
                onClick={(e) => handleCellClick(e, rect.content_id, cellId)}
              />
            );
          })}

          {/* 显示/隐藏按钮 */}
          <image
            className="cell-toggle cell-toggle-hidden"
            href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAJ1JREFUeNpi/P//PwMlgImBQsACxO+BmJ2UgD4D8X8g5iFnEBBUAbErEH8gZtAvIP4MxIxkGwTE/ED8n0yXPADi/0DMQpZBYKALxP/JdEk7EP8nyyAgaAFiFjJd8gCIBUg2CAhagPgTmS55AMRaJBsEBP+AWItEl+gRNQiI/wOxFgn+1CLaICBYhcT/NCjyBzGD/gOxEBmDQIABIMAAtM82sG+0ZTQAAAAASUVORK5CYII="
            x={btnPosition.x}
            y={btnPosition.y}
            width={btnPosition.size}
            height={btnPosition.size}
            onClick={(e) => toggleTableCells(rect.content_id, e)}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          />
          <image
            className="cell-toggle cell-toggle-show"
            href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAKtJREFUeNpi/P//PwMlgImBQsACxO+BmJ2UgD4D8X8g5iFnEBBUAbErEH8gZtAvIP4MxIxkGwTE/ED8n0yXPADi/0DMQpZBYKALxP/JdEk7EP8nyyAgaAFiFjJd8gCIBUg2CAhagPgTmS55AMRaJBsEBP+AWItEl+gRNQiI/wOxFgn+1CLaICBYhcT/NCjyBzGD/gOxEBmDQIABIMAA0pU4gDPd9GsAAAAASUVORK5CYII="
            x={btnPosition.x}
            y={btnPosition.y}
            width={btnPosition.size}
            height={btnPosition.size}
            onClick={(e) => toggleTableCells(rect.content_id, e)}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          />
        </g>
      );
    }

    // 普通矩形
    return (
      <g key={`rect-${pageNumber}-${idx}`}>
        <polygon
          data-content-id={rect.content_id}
          points={points}
          className={`svg-rect ${typeClass} ${isActive ? 'active' : ''}`}
          vectorEffect="non-scaling-stroke"
          onClick={(e) => handleRectClick(e, rect)}
        />
        
        {/* 序号标签 */}
        {rect.render_text && (
          <g transform={`translate(${x1}, ${y1})`}>
            <rect
              x="0"
              y="0"
              width="24"
              height="20"
              fill="#4877FF"
              rx="2"
              className="rect-label-bg"
            />
            <text
              x="12"
              y="14"
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
              className="rect-label-text"
            >
              {rect.render_text}
            </text>
          </g>
        )}
      </g>
    );
  };

  // 计算 ViewBox
  // 优先使用 JSON 中的页面尺寸（最准确），如果没有则通过缩放计算
  let viewBoxWidth: number;
  let viewBoxHeight: number;
  
  if (jsonPageWidth && jsonPageHeight) {
    // 方案1: 直接使用 JSON 的尺寸作为 ViewBox（最准确）
    viewBoxWidth = jsonPageWidth;
    viewBoxHeight = jsonPageHeight;
    console.log('✅ 使用 JSON 页面尺寸作为 ViewBox:', { 
      viewBoxWidth, 
      viewBoxHeight,
      来源: 'JSON 数据'
    });
  } else {
    // 方案2: 通过缩放计算（兼容没有尺寸信息的情况）
    viewBoxWidth = Number((pageWidth / scale / dpiScale).toFixed(2));
    viewBoxHeight = Number((pageHeight / scale / dpiScale).toFixed(2));
    console.log('⚠️ 通过缩放计算 ViewBox:', { 
      viewBoxWidth, 
      viewBoxHeight,
      计算: `(${pageWidth} / ${scale} / ${dpiScale})`,
      来源: '动态计算'
    });
  }

  return (
    <svg
      ref={svgRef}
      data-page-number={pageNumber}
      data-dpi-scale={dpiScale}
      className="absolute top-0 left-0 w-full h-full"
      style={{ 
        zIndex: 10,
        pointerEvents: 'none'
      }}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* 样式已移至外部 CSS 文件: @/app/svg-rect.css */}
      {rectList.map((rect, idx) => renderRect(rect, idx))}
    </svg>
  );
};

export default SvgRect;
