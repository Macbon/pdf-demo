// TextIn API 相关类型定义

// 单元格定义
export interface TableCell {
  position: number[]; // [x1, y1, x2, y2, x3, y3, x4, y4]
  cell_id?: string;
  row_index?: number;
  col_index?: number;
  row?: number;
  col?: number;
  row_span?: number;
  col_span?: number;
  text?: string;
}

// 表格单元格容器
export interface TableCells {
  cells: TableCell[];
}

// 元素位置信息
export interface TextInPosition {
  position: number[]; // [x1, y1, x2, y2, x3, y3, x4, y4]
  type: string;
  content_id: number;
  angle?: number;
  text?: string;
  image_url?: string;
  render_text?: string;
  active?: number; // 0: 不可点击, 1: 可点击
  
  // 表格特有字段
  cells?: TableCells;
  
  // 跨页续接
  next_section?: {
    next_page?: boolean;
    position: number[];
  };
  split_section_page_ids?: number[];
  split_section_positions?: number[][];
}

// 页面信息
export interface TextInPage {
  width: number;
  height: number;
  angle?: number;
  ppi?: number;
  dpi?: number;
  page_id?: number;
  rects?: TextInPosition[];
  content?: TextInPosition[]; // 有些API返回的是content字段
}

// API 结果
export interface TextInResult {
  pages: TextInPage[];
  metrics?: Array<{
    page_id: number;
    angle: number;
    dpi?: number;
    ppi?: number;
  }>;
  markdown?: string;
  // 其他字段根据实际 API 返回添加
}

// 解析后的数据
export interface ParsedPDFData {
  pages: TextInPage[];
  rects: TextInPosition[][];
  dpi?: number;
  result?: TextInResult;
}

// 结果内容项（用于右侧结果展示）
export interface ResultContent {
  content_id: number;
  type: string;
  sub_type?: string;
  text?: string;
  image_url?: string;
  page_id: number;
  position: number[];
  cells?: TableCells;
  outline_level?: number;
}
