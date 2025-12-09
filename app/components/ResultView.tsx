'use client';

import { useState } from 'react';
import { ParseResult, RectItem } from '../types';

interface ResultViewProps {
  result: ParseResult | null;
  rects: RectItem[][]; // 保留用于后续扩展
  activeId: string | number | null;
  onItemClick: (contentId: string | number, pageId: number) => void;
}

 

type TabType = 'markdown' | 'detail' | 'json';

export default function ResultView({ result, rects, activeId, onItemClick }: ResultViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('markdown');

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>上传 PDF 文件后查看解析结果</p>
        </div>
      </div>
    );
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'markdown', label: 'Markdown' },
    { key: 'detail', label: '结构化' },
    { key: 'json', label: 'JSON' },
  ];

  const typeLabels: Record<string, string> = {
    paragraph: '段落',
    title: '标题',
    table: '表格',
    image: '图片',
  };

  const typeColors: Record<string, string> = {
    paragraph: 'bg-green-100 text-green-800',
    title: 'bg-blue-100 text-blue-800',
    table: 'bg-orange-100 text-orange-800',
    image: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg overflow-hidden">
      {/* Tab 栏 */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'markdown' && (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
              {result.markdown || '无 Markdown 内容'}
            </pre>
          </div>
        )}

        {activeTab === 'detail' && (
          <div className="space-y-2">
            {result.detail?.map((item, idx) => {
              const isActive = String(activeId) === String(idx);
              return (
                <div
                  key={idx}
                  data-content-id={idx}
                  onClick={() => onItemClick(idx, item.page_id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs rounded ${typeColors[item.type] || 'bg-gray-100'}`}>
                      {typeLabels[item.type] || item.type}
                    </span>
                    <span className="text-xs text-gray-400">第 {item.page_id} 页</span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {item.text || '(无文本内容)'}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'json' && (
          <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
