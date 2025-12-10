// 坐标转换和 DPI 缩放工具

/**
 * 计算 DPI 缩放比例
 * @param pdfViewDpi PDF 查看器的 DPI (通常是 96)
 * @param resultDpi 解析结果的 DPI (通常是 144)
 * @returns 缩放比例
 */
export function calculateDpiScale(pdfViewDpi: number = 96, resultDpi: number = 144): number {
  return pdfViewDpi / resultDpi;
}

/**
 * 将解析结果的坐标转换为 PDF 查看器坐标
 * @param position 原始坐标 [x1, y1, x2, y2, x3, y3, x4, y4]
 * @param scale 缩放比例
 * @param dpiScale DPI 缩放比例
 * @returns 转换后的坐标
 */
export function convertPosition(
  position: number[],
  scale: number = 1,
  dpiScale: number = 1
): number[] {
  return position.map((val) => val * scale * dpiScale);
}

/**
 * 计算旋转后的坐标
 * @param x 原始 x 坐标
 * @param y 原始 y 坐标
 * @param rotate 旋转角度 (0, 90, 180, 270)
 * @param width 页面宽度
 * @param height 页面高度
 * @returns 旋转后的坐标 {x, y}
 */
export function rotatePoint(
  x: number,
  y: number,
  rotate: number,
  width: number,
  height: number
): { x: number; y: number } {
  const normalizedRotate = ((rotate % 360) + 360) % 360;
  
  switch (normalizedRotate) {
    case 90:
      return { x: y, y: height - x };
    case 180:
      return { x: width - x, y: height - y };
    case 270:
      return { x: width - y, y: x };
    default:
      return { x, y };
  }
}

/**
 * 将点击坐标转换为 SVG 坐标
 * @param clickX 点击的 x 坐标
 * @param clickY 点击的 y 坐标
 * @param scale 当前缩放比例
 * @param dpiScale DPI 缩放比例
 * @param rotate 旋转角度
 * @param width SVG viewBox 宽度
 * @param height SVG viewBox 高度
 * @returns SVG 坐标 {x, y}
 */
export function clickToSvgPoint(
  clickX: number,
  clickY: number,
  scale: number,
  dpiScale: number,
  rotate: number,
  width: number,
  height: number
): { x: number; y: number } {
  // 1. 反向缩放
  let x = clickX / scale / dpiScale;
  let y = clickY / scale / dpiScale;
  
  // 2. 反向旋转
  const point = rotatePoint(x, y, -rotate, width, height);
  
  return point;
}

/**
 * 检查点是否在多边形内
 * @param point 点坐标 {x, y}
 * @param polygon 多边形顶点 [x1, y1, x2, y2, x3, y3, x4, y4]
 * @returns 是否在多边形内
 */
export function isPointInPolygon(point: { x: number; y: number }, polygon: number[]): boolean {
  const x = point.x;
  const y = point.y;
  
  let inside = false;
  const vertexCount = polygon.length / 2;
  
  for (let i = 0, j = vertexCount - 1; i < vertexCount; j = i++) {
    const xi = polygon[i * 2];
    const yi = polygon[i * 2 + 1];
    const xj = polygon[j * 2];
    const yj = polygon[j * 2 + 1];
    
    const intersect = ((yi > y) !== (yj > y)) &&
                      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * 计算两点之间的距离
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * 计算多边形的边界框
 * @param position 多边形顶点 [x1, y1, x2, y2, x3, y3, x4, y4]
 * @returns 边界框 {minX, minY, maxX, maxY, width, height}
 */
export function getBoundingBox(position: number[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  const xCoords: number[] = [];
  const yCoords: number[] = [];
  
  for (let i = 0; i < position.length; i += 2) {
    xCoords.push(position[i]);
    yCoords.push(position[i + 1]);
  }
  
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * 格式化坐标用于 SVG polygon points 属性
 * @param position 坐标数组 [x1, y1, x2, y2, x3, y3, x4, y4]
 * @returns "x1,y1 x2,y2 x3,y3 x4,y4"
 */
export function formatPolygonPoints(position: number[]): string {
  const points: string[] = [];
  for (let i = 0; i < position.length; i += 2) {
    points.push(`${position[i]},${position[i + 1]}`);
  }
  return points.join(' ');
}

/**
 * 格式化坐标用于 SVG path d 属性
 * @param position 坐标数组 [x1, y1, x2, y2, x3, y3, x4, y4]
 * @returns "M x1 y1 L x2 y2 L x3 y3 L x4 y4 Z"
 */
export function formatPathD(position: number[]): string {
  const commands: string[] = [];
  for (let i = 0; i < position.length; i += 2) {
    const command = i === 0 ? 'M' : 'L';
    commands.push(`${command} ${position[i]} ${position[i + 1]}`);
  }
  commands.push('Z');
  return commands.join(' ');
}

/**
 * 判断元素是否在视口内
 * @param element DOM 元素
 * @param container 容器元素
 * @returns 是否在视口内
 */
export function isElementInViewport(element: HTMLElement, container?: HTMLElement | null): boolean {
  const rect = element.getBoundingClientRect();
  
  if (container) {
    const containerRect = container.getBoundingClientRect();
    return (
      rect.top >= containerRect.top &&
      rect.left >= containerRect.left &&
      rect.bottom <= containerRect.bottom &&
      rect.right <= containerRect.right
    );
  }
  
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * 平滑滚动到指定元素（如果不在视口内）
 * @param element 目标元素
 * @param container 容器元素
 * @param options 滚动选项
 */
export function scrollIntoViewIfNeeded(
  element: HTMLElement,
  container?: HTMLElement | null,
  options?: ScrollIntoViewOptions
): void {
  if (!isElementInViewport(element, container)) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
      ...options,
    });
  }
}

