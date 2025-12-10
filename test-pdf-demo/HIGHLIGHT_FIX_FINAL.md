# 标识框显示问题 - 最终修复方案

## 🚨 问题诊断

通过控制台日志和 DOM 检查，我们发现了两个关键问题：

### 问题 1: CSS 样式未生效

**症状**：
```javascript
样式: {
  fill: "rgba(0, 0, 0, 0)",  ❌ 应该是 rgba(72, 119, 255, 0.15)
  stroke: "none",            ❌ 应该是 rgb(72, 119, 255)
  fillOpacity: "0.15",       ✅ 正确
  strokeWidth: "2px"         ✅ 正确
}
```

**原因**：SVG 内联 `<style>` 标签在 React 环境中可能不稳定

**解决方案**：
1. 创建外部 CSS 文件 `src/app/svg-rect.css`
2. 在 `SvgRect.tsx` 中导入：`import '@/app/svg-rect.css'`
3. 移除组件内的 `<style>` 标签

---

### 问题 2: 坐标位置偏移

**症状**：
- 手动添加样式后能看到标识框，但位置不对
- 坐标与 PDF 内容错位

**原因**：ViewBox 计算缺少 PDF 缩放级别 (`scale`)

**错误代码**：
```typescript
// ❌ 只考虑了 DPI 缩放，忽略了 PDF 缩放
const viewBoxWidth = Number((pageWidth / dpiScale).toFixed(2));
const viewBoxHeight = Number((pageHeight / dpiScale).toFixed(2));
```

**正确代码**：
```typescript
// ✅ 同时考虑 PDF 缩放 (scale=1.5) 和 DPI 缩放 (dpiScale=0.667)
const viewBoxWidth = Number((pageWidth / scale / dpiScale).toFixed(2));
const viewBoxHeight = Number((pageHeight / scale / dpiScale).toFixed(2));
```

**计算示例**：
```
pageWidth = 918 (scale=1.5 时的实际像素)
scale = 1.5
dpiScale = 0.667
viewBoxWidth = 918 / 1.5 / 0.667 = 918 (对应 144 DPI 坐标空间)
```

---

## 📐 坐标系统详解

### xparse-frontend-main 的完整流程

```typescript
// 1. PDF 页面基础尺寸 (scale=1 时)
const baseWidth = 612;   // 96 DPI
const baseHeight = 792;  // 96 DPI

// 2. PDF 缩放后的实际显示尺寸
const actualWidth = baseWidth * scale;   // 918 (scale=1.5)
const actualHeight = baseHeight * scale; // 1188

// 3. DPI 缩放比例
const pdfViewDpi = 96;      // PDF.js 默认 DPI
const resultDpi = 144;      // JSON 数据的 DPI
const dpiScale = 96 / 144;  // 0.667

// 4. ViewBox 计算 (映射到 144 DPI 坐标空间)
const viewBoxWidth = actualWidth / scale / dpiScale;
const viewBoxHeight = actualHeight / scale / dpiScale;
// = 612 / 0.667 = 918

// 5. 坐标直接使用 JSON 原始值 (144 DPI)
const points = rect.position;  // [308, 437, 385, 437, 385, 452, 308, 452]
```

### 关键理解

- **SVG 容器尺寸**：`actualWidth × actualHeight` (918 × 1188，受 scale 影响)
- **ViewBox 内部坐标系**：`viewBoxWidth × viewBoxHeight` (918 × 1188，144 DPI)
- **JSON 坐标**：直接对应 ViewBox 坐标系，无需转换

---

## 🔧 修复的文件

### 1. 新增文件：`src/app/svg-rect.css`
- 包含所有 SVG 元素的样式定义
- 支持不同类型元素（文本、表格、图片等）的颜色
- 支持 `.active` 状态的高亮样式

### 2. 修改文件：`src/components/SvgRect.tsx`

**改动 1：导入外部 CSS**
```typescript
import '@/app/svg-rect.css';
```

**改动 2：修复 ViewBox 计算**
```typescript
// 修改前
const viewBoxWidth = Number((pageWidth / dpiScale).toFixed(2));

// 修改后
const viewBoxWidth = Number((pageWidth / scale / dpiScale).toFixed(2));
```

**改动 3：修复按钮位置计算**
```typescript
// 修改前
const viewRate = 1 / dpiScale;

// 修改后
const viewRate = 1 / (scale * dpiScale);
```

**改动 4：移除内联 `<style>` 标签**
```typescript
// 修改前
<svg ...>
  <style>{`...`}</style>
  {rectList.map(...)}
</svg>

// 修改后
<svg ...>
  {/* 样式已移至外部 CSS 文件 */}
  {rectList.map(...)}
</svg>
```

---

## ✅ 验证步骤

### 1. 检查样式是否生效

在浏览器控制台执行：

```javascript
const target = document.querySelector('[data-content-id="5"]');
const styles = getComputedStyle(target);
console.log({
  fill: styles.fill,        // 应该是 rgba(72, 119, 255, 0.15) 或透明
  stroke: styles.stroke,    // 应该是 rgb(72, 119, 255)
  strokeWidth: styles.strokeWidth  // 应该是 2px (active) 或 1px
});
```

**预期结果**：
- `fill`: 有颜色值（非 `rgba(0, 0, 0, 0)`）
- `stroke`: 有颜色值（非 `none`）
- `strokeWidth`: `2px` (active 状态)

### 2. 检查坐标是否正确

```javascript
const svg = document.querySelector('svg[data-page-number="1"]');
const target = document.querySelector('[data-content-id="5"]');
console.log({
  viewBox: svg.getAttribute('viewBox'),
  points: target.getAttribute('points'),
  scale: svg.dataset.scale,
  dpiScale: svg.dataset.dpiScale
});
```

**预期结果**：
- ViewBox 应该反映正确的坐标空间（考虑了 scale 和 dpiScale）
- 标识框应该精确覆盖 PDF 内容

### 3. 测试点击交互

1. 点击右侧结果列表中的任意元素
2. 观察左侧 PDF 是否出现**蓝色高亮框**
3. 高亮框是否**精确覆盖**对应的文本区域
4. 控制台是否输出完整的日志（Step 1-5）

---

## 🎯 关键学习点

### 1. ViewBox 的作用

ViewBox 定义了 SVG 内部的坐标系统：

```html
<svg width="918" height="1188" viewBox="0 0 918 1188">
  <!-- width/height: SVG 容器的实际显示尺寸 -->
  <!-- viewBox: SVG 内部坐标系统 (可以与实际尺寸不同) -->
  <!-- 浏览器会自动将 viewBox 坐标映射到实际尺寸 -->
</svg>
```

### 2. 多重缩放的叠加

在 PDF 查看器中，有三层缩放：

1. **PDF 缩放** (`scale`): 用户的缩放级别（1.0, 1.5, 2.0...）
2. **DPI 缩放** (`dpiScale`): JSON 数据 DPI 与 PDF.js DPI 的比率
3. **SVG 自动缩放**: ViewBox 到实际尺寸的映射（由浏览器自动处理）

**关键公式**：
```typescript
viewBoxSize = actualSize / scale / dpiScale
```

### 3. CSS 作用域问题

- ✅ 推荐：外部 CSS 文件或 styled-components
- ⚠️ 谨慎：SVG 内联 `<style>` 标签（在 React 中可能不稳定）
- ❌ 避免：在 React 组件中直接操作 DOM 添加样式

---

## 📊 修复前后对比

| 方面 | 修复前 | 修复后 |
|------|--------|--------|
| **CSS 样式** | 内联 `<style>` 不生效 | 外部 CSS 正确应用 |
| **ViewBox** | `pageWidth / dpiScale` | `pageWidth / scale / dpiScale` |
| **坐标位置** | 偏离内容 | 精确对齐 |
| **按钮位置** | `1 / dpiScale` | `1 / (scale * dpiScale)` |
| **交互效果** | 无高亮 | 正确显示蓝色高亮框 |

---

## 🔍 调试日志说明

修复后，点击元素会看到以下日志：

```
🎯 Step 1: 结果被点击 {contentId: 5, pageNumber: 1, ...}
🎯 Step 2: EnhancedPDFViewer 传递给 SvgRect {focusId: 5, ...}
🎨 SvgRect 渲染 {scale: 1.5, dpiScale: 0.667, viewBoxWidth: 918, ...}
📥 Step 3: SvgRect useEffect 触发 {focusId: 5, willUpdate: true}
✅ Step 4: 设置 activeId = 5
🎨 Step 5: renderRect [idx=5] {isActive: true, strictMatch: true, ...}
```

**关键检查点**：
- Step 4 后 `activeId` 应该被设置
- Step 5 中 `isActive` 应该为 `true`
- 此时 DOM 元素应该有 `active` class
- 浏览器应该应用了 `.svg-rect.textblock.active` 的样式

---

## 📝 代码参考

### 完整的 ViewBox 计算

```typescript
interface SvgRectProps {
  pageWidth: number;    // PDF 页面实际显示宽度 (受 scale 影响)
  pageHeight: number;   // PDF 页面实际显示高度 (受 scale 影响)
  scale: number;        // PDF 缩放级别 (1.0, 1.5, 2.0...)
  dpiScale: number;     // DPI 缩放比例 (pdfViewDpi / resultDpi)
  // ...
}

// 计算 ViewBox
const viewBoxWidth = Number((pageWidth / scale / dpiScale).toFixed(2));
const viewBoxHeight = Number((pageHeight / scale / dpiScale).toFixed(2));

// 渲染 SVG
<svg
  width={pageWidth}
  height={pageHeight}
  viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
  style={{ pointerEvents: 'none' }}
>
  {/* 坐标直接使用 JSON 原始值，无需转换 */}
  <polygon
    points={`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`}
    className={`svg-rect ${type} ${isActive ? 'active' : ''}`}
  />
</svg>
```

---

## 🎉 总结

这次修复解决了两个核心问题：

1. **样式问题**：通过外部 CSS 文件确保样式正确应用
2. **坐标问题**：通过完整的缩放计算（PDF 缩放 + DPI 缩放）确保位置精确

修复后，标识框功能应该完全正常，实现了与 xparse-frontend-main 相同的效果！

