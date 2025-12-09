import { DetailItem, RectItem, ParseResult } from '../types';

/**
 * 将解析结果转换为按页分组的矩形框数据
 */
export function formatResult(result: ParseResult): RectItem[][] {
  if (!result?.detail || !Array.isArray(result.detail)) {
    return [];
  }

  const pageRects: RectItem[][] = [];
  const metrics: Record<number, { angle: number }> = {};

  // 构建 metrics 映射
  if (Array.isArray(result.metrics)) {
    result.metrics.forEach((m) => {
      metrics[m.page_id] = { angle: m.angle };
    });
  }

  // 遍历 detail 生成矩形数据
  result.detail.forEach((item, idx) => {
    const pageIndex = item.page_id - 1;

    if (!pageRects[pageIndex]) {
      pageRects[pageIndex] = [];
    }

    const rect: RectItem = {
      content_id: idx,
      position: item.position,
      text: item.text,
      type: item.type,
      page_id: item.page_id,
    };

    pageRects[pageIndex].push(rect);
  });

  return pageRects;
}

/**
 * 根据 content_id 查找对应的矩形
 */
export function findRectByContentId(
  rects: RectItem[][],
  contentId: number | string
): { rect: RectItem; pageIndex: number } | null {
  for (let pageIndex = 0; pageIndex < rects.length; pageIndex++) {
    const pageRects = rects[pageIndex];
    if (pageRects) {
      const rect = pageRects.find((r) => String(r.content_id) === String(contentId));
      if (rect) {
        return { rect, pageIndex };
      }
    }
  }
  return null;
}
