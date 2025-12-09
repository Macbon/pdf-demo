// PDF 解析结果类型定义

export interface Position {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  x4: number;
  y4: number;
}

export interface DetailItem {
  content_id: number;
  type: 'paragraph' | 'table' | 'image' | 'title';
  text: string;
  position: number[]; // [x1,y1,x2,y2,x3,y3,x4,y4]
  page_id: number;
  outline_level?: number;
}

export interface PageInfo {
  page_id: number;
  width: number;
  height: number;
  angle?: number;
}

export interface ParseResult {
  markdown: string;
  detail: DetailItem[];
  pages: PageInfo[];
  metrics?: { page_id: number; angle: number }[];
}

export interface RectItem {
  content_id: number | string;
  position: number[];
  text: string;
  type: string;
  page_id: number;
  isActive?: boolean;
}

export interface FileState {
  file: File | null;
  url: string;
  status: 'idle' | 'uploading' | 'parsing' | 'complete' | 'error';
  result: ParseResult | null;
  rects: RectItem[][];
  error?: string;
}
