# DPI 缩放修复说明

## 🎯 核心问题

**问题**: PDF 上的标识框无法显示或位置不正确

**根本原因**: **缺少 DPI 缩放转换**

## 📊 技术背景

### xparse-frontend-main 的坐标系统

1. **PDF.js 渲染 DPI**: 96
2. **TextIn API 返回 DPI**: 144 (从 JSON 的 `metrics[].dpi` 字段)
3. **缩放比例**: `pdfViewDpi / resultDpi = 96 / 144 = 0.667`

### 坐标转换逻辑

```typescript
// 1. PDF.js 渲染的实际尺寸 (基于 96 DPI)
const pageWidth = 1224;   // 实际渲染宽度
const pageHeight = 1584;  // 实际渲染高度

// 2. DPI 缩放比例
const dpiScale = 96 / 144 = 0.667;

// 3. ViewBox 尺寸（坐标空间）
const viewBoxWidth = pageWidth / dpiScale = 1224 / 0.667 = 1835;
const viewBoxHeight = pageHeight / dpiScale = 1584 / 0.667 = 2375;

// 4. JSON 中的 position 坐标直接使用 ViewBox 坐标系
// 例如: position = [146, 193, 1076, 196, ...]
// 这些坐标基于 144 DPI，匹配 viewBox 尺寸
```

## 🔧 修复内容

### 1. EnhancedPDFViewer.tsx

添加 DPI 缩放计算：

```typescript
// 获取 DPI 缩放比例
const getDpiScale = (): number => {
  const pdfViewDpi = 96;   // PDF.js 渲染使用的 DPI
  const resultDpi = getCurrentPageDpi();  // TextIn 结果的 DPI (通常是 144)
  return pdfViewDpi / resultDpi;  // 96 / 144 = 0.667
};

// 传递给 SvgRect
<SvgRect
  dpiScale={getDpiScale()}
  // ... 其他 props
/>
```

### 2. SvgRect.tsx

应用 DPI 缩放到 ViewBox：

```typescript
interface SvgRectProps {
  // ... 其他 props
  dpiScale?: number;  // DPI 缩放比例
}

// 计算 ViewBox（关键修复！）
const viewBoxWidth = Number((pageWidth / dpiScale).toFixed(2));
const viewBoxHeight = Number((pageHeight / dpiScale).toFixed(2));

<svg
  viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
  data-dpi-scale={dpiScale}
  // ... 其他属性
>
```

### 3. textin-api.ts

改进 JSON 数据解析，支持 `structured` 字段：

```typescript
export function convertTextInResultToRects(result: TextInResult): any[][] {
  return result.pages.map((page, pageIndex) => {
    // 支持从 structured 字段提取
    if (page.structured && Array.isArray(page.structured)) {
      return page.structured.map((item: any, index: number) => ({
        position: item.pos || item.position || [],
        type: item.type || 'textblock',
        rect_type: item.sub_type || item.type || 'text',
        content_id: item.id !== undefined ? item.id : index,
        uid: `page-${pageIndex + 1}-rect-${index}`,
        // ... 其他字段
      }));
    }
    return [];
  });
}
```

## 📐 坐标系统对比

### 修复前（错误）：

```
SVG ViewBox: 0 0 1224 1584        ← 直接使用 PDF 渲染尺寸 (96 DPI)
JSON Position: [146, 193, ...]    ← 基于 144 DPI
结果: 坐标不匹配，画框错位或不显示
```

### 修复后（正确）：

```
SVG ViewBox: 0 0 1835 2375        ← 转换到 144 DPI 空间 (1224/0.667)
JSON Position: [146, 193, ...]    ← 基于 144 DPI
结果: 坐标匹配，画框正确显示 ✅
```

## 🔍 调试输出

修复后，浏览器控制台会显示：

```
✅ convertTextInResultToRects: 发现 2 页
✅ 第 1 页: 从 structured 字段解析到 23 个元素
🎨 SvgRect 渲染: {
  pageNumber: 1,
  rectCount: 23,
  scale: 1.5,
  dpiScale: 0.667,
  pageWidth: 1224,
  pageHeight: 1584,
  viewBoxWidth: 1835,
  viewBoxHeight: 2375
}
```

## 🎉 修复效果

- ✅ 标识框正确显示在 PDF 上
- ✅ 点击标识框可以高亮
- ✅ 双向联动正常工作
- ✅ 表格单元格正确渲染
- ✅ 支持缩放和旋转

## 📝 参考

- **xparse-frontend-main**: `src/pages/DashboardCommon/components/RobotMainView/PDFViewer/observe.ts` (Line 226-301)
- **DPI 标准**: 
  - PDF.js 默认 DPI: 96
  - TextIn 默认 DPI: 144
  - 图像处理标准 DPI: 72, 96, 144, 300

