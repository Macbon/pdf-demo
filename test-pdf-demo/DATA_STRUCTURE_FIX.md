# 数据结构修复说明

## 🎯 问题描述

**现象**: 左边显示第一页19个元素，右边结果显示104个元素

**原因**: JSON数据结构有多层级，使用了错误的层级

## 📊 TextIn JSON 数据结构

### 1. 三种数据层级

```json
{
  "detail": [
    // 所有页的所有段落（paragraph）- 扁平列表
    // 第1页 + 第2页 = 共 42 个段落
    {"paragraph_id": 0, "page_id": 1, ...},
    {"paragraph_id": 1, "page_id": 1, ...},
    ...
  ],
  "pages": [
    {
      "page_id": 1,
      // ❌ content: 所有字行(line)级别 - 非常多 (104个)
      "content": [
        {"id": 0, "type": "line", "text": "DGP:A Dual..."},
        {"id": 1, "type": "line", "text": "Graph-Enhanced..."},
        ...  // 104 个 line
      ],
      // ✅ structured: 段落(block)级别 - 合理数量 (23个)
      "structured": [
        {"id": 0, "type": "textblock", "sub_type": "text_title", ...},
        {"id": 1, "type": "textblock", "sub_type": "text_title", ...},
        ...  // 23 个 textblock/image
      ]
    },
    {
      "page_id": 2,
      "content": [130个 line],
      "structured": [19个 textblock]
    }
  ]
}
```

### 2. 数据层级对比

| 层级 | 字段 | 粒度 | 第1页数量 | 第2页数量 | 用途 |
|------|------|------|----------|----------|------|
| **Detail** | `detail[]` | paragraph | 19个 | 23个 | 全局段落列表 |
| **Line** | `pages[].content[]` | line | **104个** | 130个 | OCR字行识别 |
| **Block** | `pages[].structured[]` | block | **23个** | **19个** | 结构化内容 |

## 🔍 问题分析

### 原来的逻辑（错误）：

```typescript
// ResultViewer.tsx - Line 65
const pageContent = page.content || page.rects || [];
```

- 优先读取 `content`（line级别）
- 导致显示 104 个字行，而不是 23 个段落
- 数据过于细碎，不适合结果展示

### 修复后的逻辑（正确）：

```typescript
// ResultViewer.tsx - Line 65
const pageContent = page.structured || page.rects || page.content || [];
```

- 优先读取 `structured`（block级别）
- 显示合理数量的结构化内容块
- 数据粒度适合用户阅读

### Content ID 映射修复：

```typescript
// 原来
const contentId = item.content_id || item.paragraph_id || itemIndex;

// 修复后
const contentId = item.id !== undefined ? item.id : 
                  (item.content_id || item.paragraph_id || itemIndex);
```

- `structured[]` 使用 `id` 字段
- `detail[]` 使用 `paragraph_id` 字段
- `content[]` 没有固定ID，使用 `id` 字段

## 📈 修复效果

### 修复前：

```
左侧 PDF: 显示第1页 19个元素（来自 structured，经过转换）
右侧结果: 显示第1页 104个元素（来自 content - line级别）❌
→ 数据不匹配，用户困惑
```

### 修复后：

```
左侧 PDF: 显示第1页 23个元素（来自 structured）✅
右侧结果: 显示第1页 23个元素（来自 structured）✅
→ 数据一致，双向联动正常
```

## 🎨 数据流程图

```
JSON File
  ├─ detail[] (42个paragraph)
  │    └─ 用于：全局段落索引
  │
  └─ pages[]
       ├─ page.content[] (104+130个line)
       │    └─ 用于：OCR原始识别结果
       │
       └─ page.structured[] (23+19个block) ✅
            ├─ 用于：PDF 标识框渲染
            ├─ 用于：结果展示面板
            └─ 用于：双向联动
```

## 🔧 相关文件修改

### 1. `test-pdf-demo/src/lib/textin-api.ts`

```typescript
export function convertTextInResultToRects(result: TextInResult): any[][] {
  return result.pages.map((page, pageIndex) => {
    // ✅ 优先从 structured 提取
    if (page.structured && Array.isArray(page.structured)) {
      return page.structured.map((item: any, index: number) => ({
        position: item.pos || item.position || [],
        content_id: item.id !== undefined ? item.id : index,
        uid: `page-${pageIndex + 1}-rect-${index}`,
        // ... 其他字段
      }));
    }
    return [];
  });
}
```

### 2. `test-pdf-demo/src/components/ResultViewer.tsx`

```typescript
// ✅ 优先读取 structured
const pageContent = page.structured || page.rects || page.content || [];

// ✅ 正确提取 ID
const contentId = item.id !== undefined ? item.id : 
                  (item.content_id || item.paragraph_id || itemIndex);
```

### 3. `test-pdf-demo/src/components/EnhancedPDFViewer.tsx`

```typescript
// 信息栏显示正确的元素数量
<span>当前页元素: {rects[pageNumber - 1]?.length || 0}</span>
// 现在会显示 23，而不是 104
```

## 📝 总结

**核心原则**: 
- 使用 **`structured`** 字段用于 UI 展示和交互
- 使用 **`content`** 字段用于底层 OCR 数据分析
- 使用 **`detail`** 字段用于全局内容索引

**数据一致性**:
- ✅ PDF 标识框数量 = 右侧结果数量
- ✅ 双向联动的 ID 匹配
- ✅ 用户体验统一

**为什么 structured 更好**:
1. **语义化**: 按文档结构（段落、标题、图片、表格）组织
2. **可读性**: 数量合理，便于浏览
3. **完整性**: 包含位置、类型、内容等所有信息
4. **层级化**: 保留文档的大纲层级（outline_level）

