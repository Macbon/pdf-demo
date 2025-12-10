# 🔍 调试日志验证步骤

## 📋 准备工作

已添加的调试日志位置：

1. ✅ `page.tsx` Line 205: 点击事件触发
2. ✅ `EnhancedPDFViewer.tsx` Line 134: 传递 focusId 给 SvgRect
3. ✅ `SvgRect.tsx` Line 65-88: 渲染和查找目标 rect
4. ✅ `SvgRect.tsx` Line 99-110: useEffect 设置 activeId
5. ✅ `SvgRect.tsx` Line 161-175: renderRect 比较逻辑

---

## 🎬 验证步骤

### Step 1: 启动项目

```bash
cd test-pdf-demo
npm run dev
```

### Step 2: 打开浏览器开发者工具

1. 打开浏览器（建议使用 Chrome）
2. 按 `F12` 打开开发者工具
3. 切换到 **Console** 标签
4. 点击 **Clear console** 按钮（🚫图标）清空之前的日志

### Step 3: 加载测试数据

在页面上点击：**"📊 加载 public/论文.json + PDF"** 按钮

### Step 4: 清空日志，准备测试

在控制台点击 **Clear console** 按钮，清空加载时的日志

### Step 5: 点击一个结果项

在右侧 **"解析结果"** 面板中，点击任意一个内容项（建议点击第6个或第7个元素）

---

## 📊 预期的日志输出

如果一切正常，你应该按顺序看到以下日志：

```javascript
// ========== Step 1: 点击事件触发 ==========
🎯 Step 1: 结果被点击: {
  contentId: 6,           // 你点击的元素 ID
  pageNumber: 1,
  contentIdType: "number"
}

// ========== Step 2: 传递给 SvgRect ==========
🎯 Step 2: EnhancedPDFViewer 传递给 SvgRect: {
  focusId: 6,
  pageNumber: 1,
  rectsCount: 19,
  focusIdType: "number"
}

// ========== Step 3: SvgRect useEffect 触发 ==========
📥 Step 3: SvgRect useEffect 触发 {
  focusId: 6,
  currentActiveId: null,    // 之前是 null
  willUpdate: true
}

✅ Step 4: 设置 activeId = 6

// ========== Step 4: SvgRect 重新渲染 ==========
🎨 SvgRect 渲染: {
  pageNumber: 1,
  rectCount: 19,
  focusId: 6,
  ...
}

📦 第一个 rect 示例: { content_id: 0, ... }

🎯 寻找 content_id=6 的 rect: ✅ 找到 {
  content_id: 6,
  position: [124, 470, 568, 470, ...],
  type: "textblock",
  ...
}

📋 所有 content_id: [0, 1, 2, 3, 4, 5, 6, 7, 8, ...]

// ========== Step 5: 渲染比较 ==========
🎨 Step 5: renderRect [idx=0]: {
  content_id: 0,
  activeId: 6,              // ✅ activeId 已更新
  focusId: 6,
  isActive: false,          // 第一个元素不是目标
  strictMatch: false,
  looseMatch: false,
  types: {
    activeId: "number",
    contentId: "number",
    focusId: "number"
  }
}

🎨 Step 5: renderRect [idx=6]: {
  content_id: 6,
  activeId: 6,              // ✅ activeId 已更新
  focusId: 6,
  isActive: true,           // ✅ 匹配成功！
  strictMatch: true,        // ✅ 严格相等
  looseMatch: true,
  types: {
    activeId: "number",
    contentId: "number",
    focusId: "number"
  }
}
```

---

## 🔎 问题诊断矩阵

根据实际日志输出，对照下表快速定位问题：

### 场景 1: 没有看到 Step 1 日志

**问题**: 点击事件没有触发

**可能原因**:
- ResultViewer 的 onClick 没有绑定
- 事件冒泡被阻止

**解决**: 检查 `ResultViewer.tsx` Line 105

---

### 场景 2: 看到 Step 1，但没有 Step 2

**问题**: focusId 没有传递到 EnhancedPDFViewer

**可能原因**:
- `page.tsx` 的 prop 传递错误
- EnhancedPDFViewer 没有重新渲染

**解决**: 检查 `page.tsx` Line 368

---

### 场景 3: 看到 Step 2，但没有 Step 3

**问题**: SvgRect 的 useEffect 没有触发

**可能原因**:
- useEffect 依赖数组有问题
- focusId 值没有变化（仍然是旧值）

**解决**: 检查 `SvgRect.tsx` Line 99-110 的 useEffect

---

### 场景 4: 看到 Step 3，但 `willUpdate: false`

**问题**: focusId 是 `undefined` 或 `null`

**可能原因**:
- setFocusId 没有正确执行
- focusId 被重置了

**解决**: 检查 `page.tsx` 的 focusId state

---

### 场景 5: 看到 Step 4，但没有 Step 5

**问题**: setActiveId 后没有触发重新渲染

**可能原因**:
- React 批处理问题
- 组件被卸载重新挂载

**解决**: 检查组件的 key 是否稳定

---

### 场景 6: 看到 Step 5，但 `activeId: null`

**问题**: activeId 没有被正确设置

**可能原因**:
- setActiveId 没有执行
- activeId 被其他代码重置

**解决**: 在 Step 4 和 Step 5 之间添加更多日志

---

### 场景 7: 看到 Step 5，`isActive: false` 但 ID 看起来相同

**问题**: 类型不匹配

**检查**:
```javascript
types: {
  activeId: "number",    // 应该相同
  contentId: "string"    // ⚠️ 不同！
}
```

**解决**:
- 如果类型不同，修改 `textin-api.ts` Line 126 确保类型一致
- 或者在比较时使用宽松相等 `==` 而不是 `===`

---

### 场景 8: 🎯 寻找结果显示 "❌ 未找到"

**问题**: rectList 中没有对应的 content_id

**可能原因**:
- 点击的元素不在当前页
- content_id 映射错误
- 数据转换时丢失了元素

**解决**:
1. 检查 `📋 所有 content_id` 列表中是否有目标 ID
2. 如果没有，检查 `textin-api.ts` 的转换逻辑
3. 检查 ResultViewer 中显示的 content_id 是否正确

---

### 场景 9: 所有日志都正常，但没有视觉高亮

**问题**: CSS 样式没有应用

**验证方法**:

1. 在控制台执行：
```javascript
// 查找应该被激活的元素
document.querySelectorAll('[data-content-id="6"]')

// 检查是否有 active class
document.querySelector('[data-content-id="6"]').classList

// 检查计算后的样式
getComputedStyle(document.querySelector('[data-content-id="6"]'))
```

2. 手动添加 active class 测试：
```javascript
document.querySelector('[data-content-id="6"]').classList.add('active')
```

**如果手动添加有效**:
- 问题在 React 没有正确更新 DOM
- 检查 `className` 的拼接逻辑

**如果手动添加也无效**:
- 问题在 CSS 样式
- 检查 `<style>` 标签是否在 SVG 内
- 检查 CSS 选择器是否正确

---

## 📸 截图收集清单

如果遇到问题，请收集以下信息：

### 1. 完整的控制台日志
- [ ] 从点击开始的所有日志
- [ ] 特别注意红色错误信息

### 2. DOM 结构检查
```javascript
// 在控制台执行并截图结果
console.log('SVG 元素:', document.querySelectorAll('svg[data-page-number]'));
console.log('所有 rect:', document.querySelectorAll('.svg-rect'));
console.log('active rect:', document.querySelectorAll('.svg-rect.active'));
```

### 3. 元素属性
```javascript
// 找到目标元素（假设 content_id 是 6）
const target = document.querySelector('[data-content-id="6"]');
console.log('目标元素:', target);
console.log('classList:', target?.classList);
console.log('计算样式:', target ? getComputedStyle(target) : null);
```

### 4. React DevTools
- [ ] 打开 React DevTools
- [ ] 找到 `SvgRect` 组件
- [ ] 查看 props（focusId）和 state（activeId）

---

## ✅ 成功标志

如果一切正常工作，你应该：

1. **看到完整的 Step 1-5 日志** ✅
2. **`isActive: true` 出现在正确的元素上** ✅
3. **`strictMatch: true` 和 `looseMatch: true`** ✅
4. **所有类型都是 `"number"`** ✅
5. **PDF 上对应的区域有蓝色高亮** ✅
6. **DOM 中对应的 polygon 有 `active` class** ✅

---

## 🚀 快速测试脚本

复制以下代码到控制台，快速验证状态：

```javascript
// 快速诊断脚本
console.log('========== 快速诊断 ==========');

// 1. 检查 SVG 元素
const svgs = document.querySelectorAll('svg[data-page-number]');
console.log('✅ SVG 元素数量:', svgs.length);

// 2. 检查所有标识框
const rects = document.querySelectorAll('.svg-rect');
console.log('✅ 标识框数量:', rects.length);

// 3. 检查激活的标识框
const activeRects = document.querySelectorAll('.svg-rect.active');
console.log('✅ 激活的标识框:', activeRects.length);
if (activeRects.length > 0) {
  console.log('   - content_id:', activeRects[0].dataset.contentId);
  console.log('   - classList:', activeRects[0].classList.toString());
}

// 4. 列出所有 content_id
const allIds = Array.from(rects).map(r => r.dataset.contentId);
console.log('✅ 所有 content_id:', allIds);

// 5. 检查 pointer-events
const svg = svgs[0];
if (svg) {
  console.log('✅ SVG pointer-events:', window.getComputedStyle(svg).pointerEvents);
  if (rects[0]) {
    console.log('✅ Rect pointer-events:', window.getComputedStyle(rects[0]).pointerEvents);
  }
}

console.log('========== 诊断完成 ==========');
```

---

## 📝 下一步行动

完成验证后：

1. **如果所有日志正常** → 问题在 CSS，检查样式
2. **如果某个 Step 缺失** → 参考"问题诊断矩阵"
3. **如果类型不匹配** → 修改类型转换逻辑
4. **如果找不到 rect** → 检查数据转换

准备好了吗？开始验证吧！🚀

