'use client';

import React, { useEffect, useRef } from 'react';
import { ResultContent } from '@/types/textin';

interface ResultViewerProps {
  result: any; // 完整的解析结果
  focusId?: number | null;
  onContentClick?: (contentId: number, pageNumber: number) => void;
}

const ResultViewer: React.FC<ResultViewerProps> = ({ 
  result, 
  focusId,
  onContentClick 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 当 focusId 变化时滚动到对应元素
  useEffect(() => {
    if (focusId !== null && focusId !== undefined) {
      setTimeout(() => {
        const element = document.querySelector(`[data-result-id="${focusId}"]`);
        if (element) {
          element.classList.add('result-active');
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // 移除其他元素的激活状态
          const allActive = document.querySelectorAll('.result-active');
          allActive.forEach(el => {
            if (el !== element) {
              el.classList.remove('result-active');
            }
          });
        }
      }, 100);
    }
  }, [focusId]);

  // 处理内容点击
  const handleContentClick = (contentId: number, pageNumber: number) => {
    if (onContentClick) {
      onContentClick(contentId, pageNumber);
    }
  };

  // 渲染内容
  const renderContent = () => {
    if (!result || !result.pages) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-4">📄</div>
            <p>暂无解析结果</p>
            <p className="text-sm mt-2">请先上传并解析 PDF 文件</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {result.pages.map((page: any, pageIndex: number) => {
          const pageNumber = pageIndex + 1;
          // 优先使用 structured（段落级别），而不是 content（字行级别）
          const pageContent = page.structured || page.rects || page.content || [];
          
          if (!pageContent || pageContent.length === 0) {
            return null;
          }

          return (
            <div key={pageIndex} className="page-section">
              {/* 页码标题 */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-t-lg shadow-md">
                <h3 className="font-bold flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <span>第 {pageNumber} 页</span>
                  <span className="text-xs opacity-75 ml-2">({pageContent.length} 个元素)</span>
                </h3>
              </div>

              {/* 页面内容 */}
              <div className="bg-white border border-gray-200 rounded-b-lg shadow-sm">
                {pageContent.map((item: any, itemIndex: number) => {
                  // structured 使用 id，detail 使用 paragraph_id
                  const contentId = item.id !== undefined ? item.id : (item.content_id || item.paragraph_id || itemIndex);
                  const type = item.type || 'text';
                  const subType = item.sub_type || '';
                  const text = item.text || '';
                  
                  // 跳过空内容
                  if (!text && !item.image_url && type !== 'table') {
                    return null;
                  }

                  return (
                    <div
                      key={itemIndex}
                      data-result-id={contentId}
                      data-page-number={pageNumber}
                      className={`content-item p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                        focusId === contentId ? 'result-active' : ''
                      }`}
                      onClick={() => handleContentClick(contentId, pageNumber)}
                    >
                      {/* 内容头部 */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(type, subType)}`}>
                            {getTypeLabel(type, subType)}
                          </span>
                          <span className="text-xs text-gray-500">ID: {contentId}</span>
                        </div>
                        {item.outline_level !== undefined && item.outline_level >= 0 && (
                          <span className="text-xs text-blue-600 font-medium">
                            标题级别 {item.outline_level}
                          </span>
                        )}
                      </div>

                      {/* 内容主体 */}
                      {type === 'image' && item.image_url ? (
                        <div className="mt-2">
                          <img 
                            src={item.image_url} 
                            alt="extracted" 
                            className="max-w-full h-auto border border-gray-300 rounded"
                          />
                        </div>
                      ) : type === 'table' && item.cells ? (
                        <div className="mt-2 overflow-x-auto">
                          <div className="inline-block min-w-full">
                            <div className="text-sm text-gray-600 mb-2">
                              表格: {item.cells.cells?.length || 0} 个单元格
                            </div>
                            <div className="border border-gray-300 rounded p-2 bg-gray-50">
                              <pre className="text-xs overflow-x-auto">
                                {JSON.stringify(item.cells, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ) : text ? (
                        <div className={`mt-2 ${getTextStyle(type, subType)}`}>
                          {text}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="h-full overflow-auto p-4 bg-gray-50">
      <style>{`
        .result-active {
          background-color: #EFF6FF !important;
          border-left: 4px solid #3B82F6 !important;
          animation: highlight 0.3s ease-in-out;
        }
        
        @keyframes highlight {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        
        .content-item {
          position: relative;
        }
        
        .content-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: transparent;
          transition: background-color 0.2s;
        }
        
        .content-item:hover::before {
          background-color: #93C5FD;
        }
      `}</style>
      
      {renderContent()}
    </div>
  );
};

// 获取类型颜色
const getTypeColor = (type: string, subType?: string): string => {
  const typeKey = subType || type;
  const colors: Record<string, string> = {
    'text_title': 'bg-purple-100 text-purple-800 border border-purple-300',
    'title': 'bg-orange-100 text-orange-800 border border-orange-300',
    'paragraph': 'bg-blue-100 text-blue-800 border border-blue-300',
    'text': 'bg-red-100 text-red-800 border border-red-300',
    'table': 'bg-green-100 text-green-800 border border-green-300',
    'image': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    'formula': 'bg-purple-100 text-purple-800 border border-purple-300',
    'handwriting': 'bg-pink-100 text-pink-800 border border-pink-300',
    'image_title': 'bg-indigo-100 text-indigo-800 border border-indigo-300',
  };
  return colors[typeKey] || 'bg-gray-100 text-gray-800 border border-gray-300';
};

// 获取类型标签
const getTypeLabel = (type: string, subType?: string): string => {
  const typeKey = subType || type;
  const labels: Record<string, string> = {
    'text_title': '标题',
    'title': '标题',
    'paragraph': '段落',
    'text': '文本',
    'table': '表格',
    'image': '图片',
    'formula': '公式',
    'handwriting': '手写',
    'image_title': '图片标题',
    'textblock': '文本块',
  };
  return labels[typeKey] || type;
};

// 获取文本样式
const getTextStyle = (type: string, subType?: string): string => {
  const typeKey = subType || type;
  const styles: Record<string, string> = {
    'text_title': 'text-xl font-bold text-gray-900',
    'title': 'text-lg font-semibold text-gray-800',
    'paragraph': 'text-base text-gray-700 leading-relaxed',
    'text': 'text-sm text-gray-600',
    'formula': 'font-mono text-sm text-purple-700 bg-purple-50 p-2 rounded',
    'handwriting': 'italic text-pink-700',
  };
  return styles[typeKey] || 'text-sm text-gray-600';
};

export default ResultViewer;

