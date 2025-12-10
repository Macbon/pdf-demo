# 点击流程和标识框显示分析

## 🔍 完整流程图

```
用户操作
  ↓
┌──────────────────────────────────────────────────────────┐
│ 方式1: 点击右侧结果列表                                    │
└──────────────────────────────────────────────────────────┘
  ↓
ResultViewer.tsx (Line 105)
  onClick={() => handleContentClick(contentId, pageNumber)}
  ↓
ResultViewer.tsx (Line 41-44)
  const handleContentClick = (contentId: number, pageNumber: number) => {
    onContentClick(contentId, pageNumber);  // 调用父组件的回调
  }
  ↓
page.tsx (Line 392)
  onContentClick={handleContentClick}  // 传递回调
  ↓
page.tsx (Line 205-208)
  const handleContentClick = (contentId, pageNumber) => {
    setFocusId(contentId);        // ✅ 设置 focusId 状态
    setCurrentPage(pageNumber);
  }
  ↓
page.tsx (Line 368)
  focusId={focusId}  // 传递给 EnhancedPDFViewer
  ↓
EnhancedPDFViewer.tsx (Line 29)
  focusId = null  // 接收 prop
  ↓
EnhancedPDFViewer.tsx (Line 144)
  focusId={focusId}  // 传递给 SvgRect
  ↓
SvgRect.tsx (Line 56)
  focusId  // 接收 prop
  ↓
SvgRect.tsx (Line 82-86) ⚠️ **关键点**
  useEffect(() => {
    if (focusId !== undefined && focusId !== null) {
      setActiveId(focusId);  // ✅ 设置内部状态
    }
  }, [focusId]);
  ↓
SvgRect.tsx (Line 156-157)
  const isActive = activeId === rect.content_id;  // ⚠️ **比较关键**
  ↓
SvgRect.tsx (Line 230)
  className={`svg-rect ${typeClass} ${isActive ? 'active' : ''}`}
  ↓
CSS (Line 300-398)
  .svg-rect.active {
    fill-opacity: 0.15;
    stroke-width: 2px;
  }
```

---

┌──────────────────────────────────────────────────────────┐
│ 方式2: 点击 PDF 上的标识框                                 │
└──────────────────────────────────────────────────────────┘
  ↓
SvgRect.tsx (Line 177 或 232)
  onClick={(e) => handleRectClick(e, rect)}
  ↓
SvgRect.tsx (Line 103-131)
  const handleRectClick = (e, rect) => {
    setActiveId(rect.content_id);  // ✅ 直接设置内部状态
    onRectClick(rect.content_id);  // 调用父组件回调
  }
  ↓
EnhancedPDFViewer.tsx (Line 145)
  onRectClick={handleRectClick}
  ↓
EnhancedPDFViewer.tsx (Line 97-101)
  const handleRectClick = (contentId, cellId) => {
    onRectClick(contentId, pageNumber, cellId);
  }
  ↓
page.tsx (Line 370)
  onRectClick={handleRectClick}
  ↓
page.tsx (Line 198-202)
  const handleRectClick = (contentId, pageNumber) => {
    setFocusId(contentId);  // ✅ 设置 focusId 状态
    setCurrentPage(pageNumber);
  }
```

## 🎯 关键数据流

### 1. State 管理层次

```
page.tsx
├─ focusId: number | null         ← 顶层状态
├─ currentPage: number             ← 页码状态
└─ rects: TextInPosition[][]       ← 标识框数据

EnhancedPDFViewer
├─ focusId (prop from page.tsx)   ← 只读
├─ pageNumber (local state)        ← 本地页码
└─ rects (prop from page.tsx)      ← 只读

SvgRect
├─ focusId (prop from EnhancedPDFViewer)  ← 只读
├─ activeId (local state)          ← 内部激活状态 ⚠️ **关键**
└─ rectList (prop)                  ← 当前页的 rects
```

### 2. ID 映射关系

```typescript
// JSON 数据结构
pages[0].structured = [
  {
    id: 0,           // ← structured 使用 'id' 字段
    pos: [x1,y1,x2,y2,x3,y3,x4,y4],
    type: "textblock",
    ...
  },
  {
    id: 1,           // ← 数字类型
    ...
  }
]

// 转换后 (textin-api.ts Line 122-132)
rects[0] = [
  {
    content_id: 0,   // ← 转换为 'content_id'
    position: [...],
    ...
  }
]

// ResultViewer (Line 88)
const contentId = item.id !== undefined ? item.id : ...;
// ↑ 读取 structured 的 id

// SvgRect (Line 156)
const isActive = activeId === rect.content_id;
// ↑ 比较 activeId 和 rect.content_id
```

## ⚠️ 潜在问题点分析

### 问题 1: ID 类型不匹配

**可能原因**:
```typescript
// ResultViewer 传递的 contentId
const contentId = item.id;  // 可能是 number

// SvgRect 的 rect.content_id
content_id: item.id !== undefined ? item.id : index;  // 可能是 number 或 string

// 比较时
activeId === rect.content_id  // 严格相等可能失败
```

**验证方法**:
```typescript
// 在 SvgRect.tsx Line 156 添加调试
console.log('🔍 比较:', {
  activeId,
  contentId: rect.content_id,
  isEqual: activeId === rect.content_id,
  activeIdType: typeof activeId,
  contentIdType: typeof rect.content_id
});
```

---

### 问题 2: focusId 传递中断

**检查点**:
1. `page.tsx` → `EnhancedPDFViewer`: focusId prop
2. `EnhancedPDFViewer` → `SvgRect`: focusId prop
3. `SvgRect` useEffect: 是否触发？

**验证方法**:
```typescript
// page.tsx Line 368 添加
console.log('📤 page.tsx → EnhancedPDFViewer:', { focusId });

// EnhancedPDFViewer.tsx Line 144 添加
console.log('📤 EnhancedPDFViewer → SvgRect:', { focusId });

// SvgRect.tsx Line 82-86 添加
useEffect(() => {
  console.log('📥 SvgRect 收到 focusId:', focusId);
  if (focusId !== undefined && focusId !== null) {
    console.log('✅ 设置 activeId:', focusId);
    setActiveId(focusId);
  }
}, [focusId]);
```

---

### 问题 3: SVG 没有渲染

**可能原因**:
- DPI 缩放导致坐标超出视图
- position 数据格式错误
- ViewBox 计算错误

**验证方法**:
```typescript
// SvgRect.tsx 在 renderRect 开头添加
console.log('🎨 渲染 rect:', {
  idx,
  content_id: rect.content_id,
  position: rect.position,
  isActive,
  activeId,
});
```

---

### 问题 4: CSS 样式不生效

**检查点**:
1. `<style>` 标签是否在 SVG 内部？
2. CSS 选择器是否正确？
3. 样式优先级是否被覆盖？

**验证方法**:
```typescript
// 在浏览器开发者工具中执行
document.querySelectorAll('.svg-rect.active')  // 查找激活的元素
document.querySelector('.svg-rect').classList  // 查看class列表
```

---

### 问题 5: 页面刷新/重渲染问题

**可能原因**:
- `pageNumber` 变化导致 SvgRect 重新创建
- `scale` 变化导致重渲染
- React 组件 key 不稳定

**验证方法**:
```typescript
// SvgRect.tsx 添加 mount/unmount 日志
useEffect(() => {
  console.log('🟢 SvgRect mounted');
  return () => console.log('🔴 SvgRect unmounted');
}, []);
```

## 🔧 调试建议

### Step 1: 添加完整的调试日志

在以下位置添加 `console.log`:

1. **page.tsx Line 205-208**:
```typescript
const handleContentClick = (contentId, pageNumber) => {
  console.log('🎯 Step 1: handleContentClick', { contentId, pageNumber });
  setFocusId(contentId);
  setCurrentPage(pageNumber);
};
```

2. **EnhancedPDFViewer.tsx Line 144**:
```typescript
console.log('🎯 Step 2: 传递给 SvgRect', { focusId, pageNumber, rectsCount: rects[pageNumber - 1]?.length });
```

3. **SvgRect.tsx Line 82-86**:
```typescript
useEffect(() => {
  console.log('🎯 Step 3: SvgRect useEffect', { focusId, activeId });
  if (focusId !== undefined && focusId !== null) {
    console.log('🎯 Step 4: 设置 activeId', focusId);
    setActiveId(focusId);
  }
}, [focusId]);
```

4. **SvgRect.tsx Line 156-157**:
```typescript
const isActive = activeId === rect.content_id;
if (idx === 0) {  // 只打印第一个 rect
  console.log('🎯 Step 5: renderRect', {
    idx,
    activeId,
    contentId: rect.content_id,
    isActive,
    typeCheck: {
      activeIdType: typeof activeId,
      contentIdType: typeof rect.content_id,
    }
  });
}
```

### Step 2: 在浏览器开发者工具中检查

1. **检查 DOM 结构**:
```javascript
// 查找所有 SVG 元素
document.querySelectorAll('svg[data-page-number]')

// 查找所有标识框
document.querySelectorAll('.svg-rect')

// 查找激活的标识框
document.querySelectorAll('.svg-rect.active')
```

2. **检查元素属性**:
```javascript
// 查看第一个标识框的所有属性
const rect = document.querySelector('.svg-rect');
console.log({
  classList: rect.classList,
  contentId: rect.dataset.contentId,
  computedStyle: getComputedStyle(rect)
});
```

3. **手动设置 active class 测试**:
```javascript
// 手动添加 active class 看样式是否生效
document.querySelector('.svg-rect').classList.add('active');
```

### Step 3: 检查数据完整性

在浏览器控制台执行：
```javascript
// 检查 rects 数据
console.log('Rects 数据:', window.__NEXT_DATA__);

// 或者在组件中打印
console.log('第1页 rects:', rects[0]);
console.log('focusId:', focusId);
```

## ✅ 正常工作的标志

如果一切正常，你应该看到：

1. **控制台日志**:
```
🎯 Step 1: handleContentClick { contentId: 5, pageNumber: 1 }
🎯 Step 2: 传递给 SvgRect { focusId: 5, pageNumber: 1, rectsCount: 19 }
🎯 Step 3: SvgRect useEffect { focusId: 5, activeId: null }
🎯 Step 4: 设置 activeId 5
🎯 Step 5: renderRect { idx: 5, activeId: 5, contentId: 5, isActive: true }
```

2. **DOM 元素**:
```html
<polygon 
  data-content-id="5" 
  class="svg-rect paragraph active"
  style="fill: rgba(72, 119, 255, 0.15); stroke: rgb(72, 119, 255); stroke-width: 2px;"
/>
```

3. **视觉效果**:
- 标识框有淡蓝色填充（15% 不透明度）
- 边框变粗（2px）
- 边框颜色根据类型变化

## 🚨 常见问题和解决方案

### 问题: "点击后没有任何反应"

**可能原因**: SVG pointer-events 被禁用

**检查**: 
```javascript
document.querySelector('svg').style.pointerEvents  // 应该是 'none' (容器)
document.querySelector('.svg-rect').style.pointerEvents  // 应该是 'auto'
```

**解决**: 确保 `SvgRect.tsx` Line 260 设置了正确的 pointer-events

---

### 问题: "看到 console.log 但没有视觉变化"

**可能原因**: CSS 样式问题

**检查**:
1. `<style>` 标签是否在 `<svg>` 内部？ → 应该在
2. 浏览器是否支持 SVG 内嵌样式？ → 检查浏览器版本
3. 是否有其他 CSS 覆盖？ → 使用 `!important` 测试

---

### 问题: "ID 匹配但 isActive 是 false"

**可能原因**: 类型不匹配（number vs string）

**解决**:
```typescript
// SvgRect.tsx Line 156 改为宽松比较
const isActive = activeId == rect.content_id;  // 使用 == 而不是 ===
```

或者确保类型一致：
```typescript
// textin-api.ts Line 126 确保是 number
content_id: typeof item.id === 'number' ? item.id : parseInt(item.id) || index,
```

## 📊 完整的调试清单

- [ ] focusId 从 page.tsx 正确传递到 EnhancedPDFViewer
- [ ] focusId 从 EnhancedPDFViewer 正确传递到 SvgRect
- [ ] SvgRect useEffect 被触发并设置 activeId
- [ ] activeId 和 rect.content_id 类型一致
- [ ] activeId === rect.content_id 比较结果为 true
- [ ] isActive 为 true 时添加了 'active' class
- [ ] DOM 中的 polygon 元素有 'active' class
- [ ] CSS 样式 `.svg-rect.active` 被应用
- [ ] 视觉上可以看到高亮效果
- [ ] SVG 坐标在可视范围内（DPI 缩放正确）
- [ ] pointer-events 设置正确（SVG 容器 none，子元素 auto）

## 🎯 建议的调试顺序

1. **先验证数据流**: 从 page.tsx → SvgRect 的每一步都打印 focusId
2. **再验证状态更新**: 确认 activeId 被正确设置
3. **然后验证渲染**: 检查 isActive 计算结果
4. **最后验证 DOM**: 查看 class 是否添加，CSS 是否生效
5. **视觉检查**: 确认 SVG 坐标和 DPI 缩放正确

按照这个顺序逐步排查，可以快速定位问题所在！

