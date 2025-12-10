'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 动态导入 PDFViewer
const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">加载中...</div>,
});

interface DetailItem {
  paragraph_id: number;
  page_id: number;
  text: string;
  type: string;
  sub_type?: string;
  position: number[];
  outline_level?: number;
}

interface JsonData {
  detail: DetailItem[];
  total_page_number: number;
}

export default function DemoPage() {
  const [jsonData, setJsonData] = useState<JsonData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // 加载 JSON 和 PDF
  useEffect(() => {
    const loadData = async () => {
      try {
        // 加载 JSON
        const jsonResponse = await fetch('/论文.json');
        const data = await jsonResponse.json();
        setJsonData(data);

        // 加载 PDF
        const pdfResponse = await fetch('/论文.pdf');
        const blob = await pdfResponse.blob();
        const pdfFile = new File([blob], '论文.pdf', { type: 'application/pdf' });
        setFile(pdfFile);

        setLoading(false);
      } catch (error) {
        console.error('加载失败:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 按页组织标识框
  const getRectsByPage = () => {
    if (!jsonData) return [];
    
    const rectsByPage: any[][] = [];
    
    jsonData.detail.forEach((item) => {
      const pageIndex = item.page_id - 1;
      if (!rectsByPage[pageIndex]) {
        rectsByPage[pageIndex] = [];
      }
      
      if (item.position && item.position.length === 8) {
        rectsByPage[pageIndex].push({
          position: item.position,
          type: item.type,
          sub_type: item.sub_type,
          content_id: item.paragraph_id,
          text: item.text,
        });
      }
    });
    
    return rectsByPage;
  };

  // 过滤内容
  const filteredItems = jsonData?.detail.filter((item) =>
    item.text?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // 按页分组
  const itemsByPage = filteredItems.reduce((acc, item) => {
    if (!acc[item.page_id]) {
      acc[item.page_id] = [];
    }
    acc[item.page_id].push(item);
    return acc;
  }, {} as Record<number, DetailItem[]>);

  const handleItemClick = (item: DetailItem) => {
    setSelectedId(item.paragraph_id);
    setCurrentPage(item.page_id);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'paragraph':
        return '📄';
      case 'image':
        return '🖼️';
      case 'table':
        return '📊';
      default:
        return '📝';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'paragraph':
        return 'bg-blue-50 border-blue-200';
      case 'image':
        return 'bg-green-50 border-green-200';
      case 'table':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载文档数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧内容列表 */}
      <div className="w-96 bg-white border-r shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800 mb-2">📄 文档内容</h1>
          <p className="text-sm text-gray-500 mb-3">
            点击内容查看 PDF 对应位置
          </p>
          
          {/* 搜索框 */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索内容..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />

          {/* 统计信息 */}
          {jsonData && (
            <div className="mt-3 flex gap-4 text-xs text-gray-600">
              <span>总页数: {jsonData.total_page_number}</span>
              <span>内容项: {jsonData.detail.length}</span>
              <span>搜索结果: {filteredItems.length}</span>
            </div>
          )}
        </div>

        {/* 内容列表 */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {Object.entries(itemsByPage).map(([pageId, items]) => (
            <div key={pageId}>
              <div className="sticky top-0 bg-white py-2 mb-2 font-semibold text-sm text-gray-700 border-b">
                第 {pageId} 页 ({items.length} 项)
              </div>
              
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={`${item.page_id}-${item.paragraph_id}`}
                    onClick={() => handleItemClick(item)}
                    className={`p-3 border rounded-md cursor-pointer transition-all hover:shadow-md ${
                      selectedId === item.paragraph_id
                        ? 'ring-2 ring-blue-500 shadow-md'
                        : getTypeColor(item.type)
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">
                        {getTypeIcon(item.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                            {item.type}
                          </span>
                          {item.sub_type && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 rounded text-blue-600">
                              {item.sub_type}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 line-clamp-3">
                          {item.text || '(无文本内容)'}
                        </p>
                        {selectedId === item.paragraph_id && (
                          <p className="text-xs text-blue-600 mt-2">
                            ✓ 已选中 - 查看右侧 PDF
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧 PDF 预览 */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-white border-b">
          <h2 className="text-lg font-semibold text-gray-800">PDF 文档预览</h2>
          <p className="text-sm text-gray-500 mt-1">
            彩色框标注对应左侧内容，点击内容项高亮对应区域
          </p>
        </div>
        
        <div className="flex-1">
          <PDFViewer
            file={file}
            rects={getRectsByPage()}
            focusId={selectedId}
            initialPage={currentPage}
          />
        </div>
      </div>
    </div>
  );
}

