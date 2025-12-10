# PDF 解析位置溯源 Demo - 完成说明

## 📦 项目概述

已成功创建一个基于 TextIn API 的 PDF 文档解析和位置溯源演示项目。

**项目位置：** `test-pdf-demo/`

**参考项目：** `xparse-frontend-main/`

---

## ✅ 已完成的功能

### 核心功能

1. ✅ **PDF 文件上传**
   - 支持文件选择
   - 文件类型验证
   - 文件名显示

2. ✅ **PDF 渲染与预览**
   - 使用 `react-pdf` 库
   - 多页支持
   - 翻页控制
   - 缩放控制 (50% - 300%)

3. ✅ **TextIn API 集成**
   - API 调用函数
   - 错误处理
   - 数据格式转换

4. ✅ **位置标识框绘制**
   - SVG 叠加层
   - 坐标转换
   - 多种元素类型支持
   - 颜色区分

5. ✅ **模拟数据模式**
   - 快速测试 UI
   - 无需 API Key
   - 示例数据

### 技术实现

- ✅ Next.js 16 + React 19
- ✅ TypeScript 类型安全
- ✅ Tailwind CSS 样式
- ✅ 客户端渲染（避免 SSR 问题）
- ✅ 响应式布局
- ✅ 错误处理

### 文档

- ✅ README.md - 项目完整说明
- ✅ QUICKSTART.md - 快速开始指南
- ✅ docs/TEXTIN_API_GUIDE.md - API 集成详细指南
- ✅ docs/DEMO_FEATURES.md - 功能说明文档
- ✅ 代码注释完善

---

## 🎯 参考实现对比

### xparse-frontend-main 实现方式

```typescript
// 使用 pdf.js 的 PDFViewer
const pdfViewer = new window.pdfjsViewer.PDFViewer({
  container,
  eventBus,
});

// 使用 MutationObserver 监听页面加载
// 动态创建 SVG 元素绘制标识框
const svgDom = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
```

### test-pdf-demo 实现方式

```typescript
// 使用 react-pdf 组件
<Document file={file}>
  <Page pageNumber={pageNumber} scale={scale} />
</Document>

// 使用 React 组件绘制 SVG
<svg className="absolute">
  <polygon points={points} />
</svg>
```

### 实现差异

| 特性               | xparse-frontend | test-pdf-demo |
| ------------------ | --------------- | ------------- |
| PDF 渲染           | pdf.js 原生     | react-pdf     |
| 框架               | Umi             | Next.js       |
| 标识框绘制         | 原生 DOM 操作   | React 组件    |
| 复杂度             | 高              | 低            |
| 适合场景           | 生产环境        | Demo/学习     |

---

## 🚀 快速开始

### 1. 进入项目目录

```bash
cd test-pdf-demo
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 访问应用

打开浏览器访问：[http://localhost:3000](http://localhost:3000)

### 5. 测试功能

**方式 A：使用模拟数据**

1. 上传任意 PDF 文件
2. 点击"使用模拟数据测试"
3. 查看标识框效果

**方式 B：使用真实 API**

1. 输入 TextIn API Key
2. 上传 PDF 文件
3. 点击"调用 API 解析"
4. 查看解析结果

---

## 📁 项目结构

```
test-pdf-demo/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 主页面组件
│   │   ├── layout.tsx             # 应用布局
│   │   ├── globals.css            # 全局样式
│   │   └── pdf-viewer.css         # PDF 查看器样式
│   ├── components/
│   │   └── PDFViewer.tsx          # PDF 查看组件
│   │       - 渲染 PDF
│   │       - 绘制标识框
│   │       - 缩放和翻页控制
│   ├── lib/
│   │   └── textin-api.ts          # API 调用函数
│   │       - parsePdfWithTextin() - 调用 API
│   │       - convertTextInResultToRects() - 数据转换
│   └── types/
│       └── textin.ts              # TypeScript 类型定义
│           - TextInPosition
│           - TextInPage
│           - TextInResult
├── docs/
│   ├── TEXTIN_API_GUIDE.md        # API 集成详细指南
│   └── DEMO_FEATURES.md           # 功能说明文档
├── package.json                    # 依赖配置
├── README.md                       # 项目说明
├── QUICKSTART.md                   # 快速开始
└── tsconfig.json                   # TypeScript 配置
```

---

## 🔑 关键代码说明

### 1. 标识框数据格式

```typescript
interface TextInPosition {
  position: number[]; // [x1, y1, x2, y2, x3, y3, x4, y4]
  type: string;       // 'text' | 'table' | 'image' | 'title' | 'paragraph'
  content_id: number; // 唯一标识
}

// 按页组织
rects: TextInPosition[][] = [
  [rect1, rect2, ...], // 第 1 页
  [rect3, rect4, ...], // 第 2 页
  // ...
];
```

### 2. 坐标系统

```
(0,0) ──────────────► X
  │
  │    PDF 页面
  │
  ▼
  Y

标识框四个点：
(x1,y1) ─── (x2,y2)
  │           │
  │           │
(x4,y4) ─── (x3,y3)
```

### 3. SVG 绘制

```typescript
// 将 8 个坐标值转换为 SVG polygon points
const points = `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`;

<polygon
  points={points}
  fill="rgba(255, 0, 0, 0.3)"
  stroke="#4877FF"
  strokeWidth="2"
/>
```

### 4. 缩放处理

```typescript
// 根据 PDF 缩放比例调整标识框坐标
const scaledPosition = position.map((val) => val * scale);
```

---

## 🎨 界面效果

### 布局

```
┌────────────────┬─────────────────────────────┐
│                │  ◄  1/3  ►      - 150% +   │
│  控制面板      ├─────────────────────────────┤
│                │                             │
│  [API Key]     │   ┌─────────────────────┐  │
│                │   │  ┏━━━━━━━━━━━┓      │  │
│  [上传文件]    │   │  ┃ ① 标题   ┃      │  │
│                │   │  ┗━━━━━━━━━━━┛      │  │
│  [解析按钮]    │   │                     │  │
│                │   │  ┏━━━━━━━━━━━━━━┓  │  │
│  [结果统计]    │   │  ┃ ② 段落      ┃  │  │
│                │   │  ┗━━━━━━━━━━━━━━┛  │  │
│                │   │                     │  │
│  [使用说明]    │   │  ┏━━━━━━━━━━━┓    │  │
│                │   │  ┃ ③ 表格   ┃    │  │
│                │   │  ┗━━━━━━━━━━━┛    │  │
│                │   └─────────────────────┘  │
│                │                             │
│                │  🟥文本 🟩表格 🟦图片       │
└────────────────┴─────────────────────────────┘
```

---

## 📖 使用文档

### 快速开始

详见：[QUICKSTART.md](./test-pdf-demo/QUICKSTART.md)

### API 集成指南

详见：[docs/TEXTIN_API_GUIDE.md](./test-pdf-demo/docs/TEXTIN_API_GUIDE.md)

包含：
- 如何获取 API Key
- API 端点配置
- 请求格式说明
- 响应数据处理
- 常见问题解决

### 功能说明

详见：[docs/DEMO_FEATURES.md](./test-pdf-demo/docs/DEMO_FEATURES.md)

包含：
- 界面布局说明
- 核心功能详解
- 数据流程图
- 坐标系统说明
- 扩展功能建议

---

## 🔧 自定义配置

### 修改 API 端点

编辑 `src/lib/textin-api.ts` 第 17 行：

```typescript
const apiUrl = config.apiUrl || 'YOUR_CUSTOM_API_ENDPOINT';
```

### 修改标识框颜色

编辑 `src/components/PDFViewer.tsx` 第 69-75 行：

```typescript
const typeColors: Record<string, string> = {
  text: 'rgba(255, 0, 0, 0.3)',      // 红色
  table: 'rgba(0, 255, 0, 0.3)',     // 绿色
  image: 'rgba(0, 0, 255, 0.3)',     // 蓝色
  title: 'rgba(255, 165, 0, 0.3)',   // 橙色
  paragraph: 'rgba(255, 0, 255, 0.3)', // 紫色
};
```

### 添加新的元素类型

1. 在 `src/types/textin.ts` 中添加类型
2. 在 `PDFViewer.tsx` 的 `typeColors` 中添加颜色
3. 在图例中添加说明（第 201-225 行）

---

## 🐛 已知问题和解决方案

### 1. PDF.js Worker 加载

**问题：** 从 CDN 加载 worker 可能较慢

**解决方案：** 可以本地安装 worker

```bash
npm install pdfjs-dist
```

然后修改 `PDFViewer.tsx`：

```typescript
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;
```

### 2. 大文件处理

**问题：** 大型 PDF 可能加载慢

**解决方案：** 添加进度条或使用分页加载

### 3. CORS 问题

**问题：** 调用 API 时可能遇到跨域问题

**解决方案：** 
- 使用 Next.js API Routes 作为代理
- 配置 API 服务器允许跨域

---

## 📊 构建和部署

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

### 部署到 Vercel

```bash
vercel
```

---

## 🎓 学习价值

这个 Demo 展示了：

1. **PDF 处理**
   - react-pdf 使用
   - PDF.js 配置
   - Canvas 渲染

2. **数据可视化**
   - SVG 绘制
   - 坐标转换
   - 叠加层实现

3. **API 集成**
   - 文件上传
   - 异步处理
   - 错误处理

4. **React 最佳实践**
   - 组件化
   - Hooks 使用
   - 动态导入

5. **Next.js 特性**
   - 客户端渲染
   - TypeScript 集成
   - Tailwind CSS

---

## 🚀 扩展方向

### 短期改进

- [ ] 添加拖拽上传
- [ ] 改进错误提示
- [ ] 添加加载进度
- [ ] 优化移动端显示

### 中期功能

- [ ] 标识框点击显示详情
- [ ] 支持导出标注结果
- [ ] 添加搜索定位功能
- [ ] 批量处理多个文件

### 长期规划

- [ ] 结果编辑功能
- [ ] 准确率统计
- [ ] 对比功能
- [ ] 数据库存储

---

## 📞 技术支持

### 相关资源

- [TextIn 官网](https://www.textin.com/)
- [React-PDF GitHub](https://github.com/wojtekmaj/react-pdf)
- [Next.js 文档](https://nextjs.org/docs)
- [PDF.js 文档](https://mozilla.github.io/pdf.js/)

### 参考项目

- [xparse-frontend](https://github.com/intsig-textin/xparse-frontend) - 完整的生产级实现

---

## ✨ 总结

本 Demo 成功实现了：

1. ✅ PDF 上传和预览
2. ✅ TextIn API 集成
3. ✅ 位置标识框可视化
4. ✅ 多页支持和交互控制
5. ✅ 完整的文档和示例

**主要特点：**

- 代码简洁易懂
- 文档完善
- 易于扩展
- 适合学习和演示

**与 xparse-frontend 的区别：**

- 更轻量级
- 更易上手
- 专注核心功能
- 适合快速原型开发

---

## 📝 License

MIT

---

**祝使用愉快！🎉**

