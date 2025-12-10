# 本地 JSON 交互式 Demo 使用说明

## 🎯 功能说明

这是一个基于本地 JSON 文件的交互式 PDF 标注查看器，**不需要调用 API**。

### 主要功能

✅ **自动加载本地文件**
- 自动加载 `public/论文.json`
- 自动加载 `public/论文.pdf`

✅ **内容列表展示**
- 显示所有文档内容
- 按页分组
- 搜索功能
- 点击高亮

✅ **PDF 位置溯源**
- 在 PDF 上绘制所有标识框
- 点击内容项高亮对应区域
- 红色高亮 + 脉冲动画

---

## 🚀 快速开始

### 1. 启动项目

```bash
cd test-pdf-demo
npm run dev
```

### 2. 访问 Demo 页面

打开浏览器访问：

```
http://localhost:3000/demo
```

---

## 💡 界面说明

### 左侧面板 - 内容列表

```
┌─────────────────────────────┐
│ 📄 文档内容                  │
│ 点击内容查看 PDF 对应位置   │
├─────────────────────────────┤
│ [搜索框]                     │
│ 总页数: 2  内容项: 30       │
├─────────────────────────────┤
│ ▼ 第 1 页 (15 项)           │
│                              │
│ ┌─────────────────────────┐ │
│ │ 📄 paragraph            │ │
│ │ text_title              │ │
│ │ DGP:A Dual-Granularity  │ │
│ │ Prompting Framework...  │ │
│ └─────────────────────────┘ │
│                              │
│ ┌─────────────────────────┐ │
│ │ 🖼️ image                │ │
│ │ chart                   │ │
│ │ (图表内容)              │ │
│ └─────────────────────────┘ │
│                              │
│ ▼ 第 2 页 (15 项)           │
│ ...                          │
└─────────────────────────────┘
```

### 右侧面板 - PDF 预览

```
┌─────────────────────────────┐
│ PDF 文档预览                │
│ 彩色框标注对应左侧内容      │
├─────────────────────────────┤
│                              │
│  ┌────────────────────┐     │
│  │ ┏━━━━━━━━━━━━┓     │     │
│  │ ┃ [标识框]  ┃  ← 点击左侧│
│  │ ┗━━━━━━━━━━━━┛  高亮显示│
│  │                    │     │
│  │ ┏━━━━━━━━━━━━┓     │     │
│  │ ┃ (闪烁红框) ┃  ← 选中 │
│  │ ┗━━━━━━━━━━━━┛     │     │
│  └────────────────────┘     │
│                              │
│  [上一页] 1/2 [下一页]      │
└─────────────────────────────┘
```

---

## 🎨 功能详解

### 1. 内容列表

**显示信息：**
- 📄 元素图标（paragraph, image, table）
- 🏷️ 类型标签（type, sub_type）
- 📝 文本内容（自动截断）
- ✓ 选中状态提示

**交互：**
- 点击任意内容项
- 自动跳转到对应 PDF 页面
- 高亮对应的标识框

### 2. 搜索功能

```typescript
// 实时搜索
输入: "Graph"
结果: 只显示包含 "Graph" 的内容项
```

**搜索范围：**
- 文本内容
- 不区分大小写
- 实时过滤

### 3. 标识框高亮

**普通状态：**
- 蓝色边框 (2px)
- 半透明填充
- 悬停变暗

**选中状态：**
- **红色边框 (4px)**
- **红色半透明填充**
- **脉冲动画效果**

---

## 📊 数据格式

### JSON 文件结构

```json
{
  "detail": [
    {
      "paragraph_id": 0,
      "page_id": 1,
      "text": "内容文本",
      "type": "paragraph",
      "sub_type": "text_title",
      "position": [x1, y1, x2, y2, x3, y3, x4, y4]
    }
  ],
  "total_page_number": 2
}
```

### 关键字段

| 字段 | 说明 | 示例 |
|------|------|------|
| `paragraph_id` | 唯一标识符 | 0, 1, 2... |
| `page_id` | 页码 | 1, 2, 3... |
| `text` | 文本内容 | "DGP: A Dual..." |
| `type` | 元素类型 | paragraph, image, table |
| `sub_type` | 子类型 | text_title, chart, etc |
| `position` | 位置坐标 | [x1,y1,x2,y2,...] |

---

## 🎯 使用场景

### 场景 1: 文档内容浏览

1. 打开页面
2. 滚动左侧列表查看所有内容
3. 使用搜索快速定位

### 场景 2: 位置溯源

1. 在左侧找到感兴趣的内容
2. 点击该内容项
3. 右侧 PDF 自动跳转到对应页面
4. 对应区域用红框高亮显示

### 场景 3: 内容搜索

1. 在搜索框输入关键词
2. 查看过滤后的结果
3. 点击搜索结果查看 PDF 位置

---

## 🎨 颜色说明

### 元素类型颜色

| 类型 | 背景色 | 说明 |
|------|--------|------|
| paragraph | 蓝色 | 段落内容 |
| image | 绿色 | 图片/图表 |
| table | 紫色 | 表格 |
| 其他 | 灰色 | 默认 |

### 标识框颜色

| 状态 | 边框 | 填充 | 效果 |
|------|------|------|------|
| 普通 | 蓝色 #4877FF | 半透明 | - |
| 选中 | 红色 #FF0000 | 红色半透明 | 脉冲动画 |

---

## 🔧 技术实现

### 数据加载

```typescript
// 自动加载本地文件
const jsonResponse = await fetch('/论文.json');
const data = await jsonResponse.json();

const pdfResponse = await fetch('/论文.pdf');
const blob = await pdfResponse.blob();
const pdfFile = new File([blob], '论文.pdf', { type: 'application/pdf' });
```

### 标识框组织

```typescript
// 按页组织标识框
const getRectsByPage = () => {
  const rectsByPage: any[][] = [];
  
  jsonData.detail.forEach((item) => {
    const pageIndex = item.page_id - 1;
    if (!rectsByPage[pageIndex]) {
      rectsByPage[pageIndex] = [];
    }
    
    rectsByPage[pageIndex].push({
      position: item.position,
      type: item.type,
      content_id: item.paragraph_id,
      text: item.text,
    });
  });
  
  return rectsByPage;
};
```

### 高亮效果

```typescript
// 选中时的样式
const isFocused = focusId !== null && rect.content_id === focusId;

<polygon
  stroke={isFocused ? '#FF0000' : '#4877FF'}
  strokeWidth={isFocused ? '4' : '2'}
  className={isFocused ? 'animate-pulse' : ''}
  style={isFocused ? { fill: 'rgba(255, 0, 0, 0.4)' } : {}}
/>
```

---

## 🎓 代码位置

### 新建文件

- `src/app/demo/page.tsx` - Demo 主页面
  - 加载 JSON 数据
  - 内容列表
  - 搜索功能
  - 点击交互

### 修改文件

- `src/components/PDFViewer.tsx` - PDF 查看器
  - 添加 `focusId` 支持
  - 添加 `initialPage` 支持
  - 高亮效果

---

## 📋 与原页面对比

| 特性 | 原页面 (`/`) | Demo 页面 (`/demo`) |
|------|-------------|---------------------|
| API 调用 | ✅ 需要 | ❌ 不需要 |
| 数据来源 | API | 本地 JSON |
| 文件上传 | ✅ | ❌ 自动加载 |
| 内容列表 | ❌ | ✅ |
| 搜索功能 | ❌ | ✅ |
| 点击高亮 | ❌ | ✅ |
| 下载结果 | ✅ | ❌ |

---

## 🚀 扩展功能建议

### 短期改进

- [ ] 支持上传自己的 JSON
- [ ] 支持上传自己的 PDF
- [ ] 添加高亮历史记录
- [ ] 支持多选高亮

### 中期功能

- [ ] 导出标注结果
- [ ] 编辑标识框
- [ ] 添加注释功能
- [ ] 侧边栏缩放

### 长期规划

- [ ] 支持多文档对比
- [ ] 标注统计分析
- [ ] 协作标注
- [ ] 版本历史

---

## 🎯 最佳实践

### 1. JSON 文件准备

确保 JSON 文件包含：
- `detail` 数组
- 每项有 `position` (8个坐标)
- 每项有 `page_id`
- 每项有 `text` 内容

### 2. PDF 文件准备

- 与 JSON 对应的 PDF
- 放在 `public/` 目录
- 文件名保持一致

### 3. 使用技巧

- 使用搜索快速定位
- 点击内容查看位置
- 注意选中项的红色高亮

---

## 🎉 开始使用

1. ✅ 确保文件存在：
   - `public/论文.json`
   - `public/论文.pdf`

2. ✅ 启动项目：
   ```bash
   npm run dev
   ```

3. ✅ 访问页面：
   ```
   http://localhost:3000/demo
   ```

4. ✅ 开始体验：
   - 浏览内容列表
   - 搜索关键词
   - 点击查看位置
   - 观察高亮效果

---

## 📝 注意事项

### 文件要求

- JSON 文件必须包含 `detail` 数组
- position 必须是 8 个数字的数组
- page_id 从 1 开始
- PDF 和 JSON 必须对应

### 性能考虑

- 大文件可能加载较慢
- 内容项过多时考虑虚拟滚动
- 搜索实时过滤可能影响性能

### 浏览器兼容

- 推荐使用 Chrome/Firefox/Edge
- 需要支持 ES6+
- 需要支持 Fetch API

---

**完成！现在你有一个完全基于本地文件的交互式 PDF 标注查看器了！** 🎉

不需要 API，不需要上传，直接加载本地文件，点击内容查看 PDF 位置！

