# 快速开始指南

## 🚀 10 分钟上手

### 步骤 1: 安装依赖

```bash
cd test-pdf-demo
npm install
```

### 步骤 2: 启动开发服务器

```bash
npm run dev
```

### 步骤 3: 打开浏览器

访问 [http://localhost:3000](http://localhost:3000)

### 步骤 4: 测试功能

#### 选项 A：使用模拟数据（推荐新手）

1. 准备一个 PDF 文件（任意 PDF 都可以）
2. 点击"选择文件"上传 PDF
3. 点击 **"使用模拟数据测试"** 按钮
4. 查看右侧的 PDF 预览和彩色标识框

#### 选项 B：使用真实 API

1. 在 [TextIn 官网](https://www.textin.com/) 注册并获取 API Key
2. 在左侧输入框中输入你的 API Key
3. 上传 PDF 文件
4. 点击 **"调用 API 解析"** 按钮
5. 等待解析完成，查看结果

---

## 📦 项目结构

```
test-pdf-demo/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 主页面
│   │   ├── layout.tsx             # 应用布局
│   │   ├── globals.css            # 全局样式
│   │   └── pdf-viewer.css         # PDF 查看器样式
│   ├── components/
│   │   └── PDFViewer.tsx          # PDF 查看组件
│   ├── lib/
│   │   └── textin-api.ts          # API 调用函数
│   └── types/
│       └── textin.ts              # TypeScript 类型定义
├── docs/
│   ├── TEXTIN_API_GUIDE.md        # API 集成详细指南
│   └── DEMO_FEATURES.md           # 功能说明文档
├── package.json
├── README.md                       # 项目说明
└── QUICKSTART.md                   # 本文件
```

---

## 🎨 界面预览

### 左侧面板

- **API Key 输入框**：输入 TextIn API Key
- **文件上传按钮**：选择要解析的 PDF 文件
- **解析按钮**：
  - 蓝色按钮：调用真实 API
  - 绿色按钮：使用模拟数据
- **解析结果统计**：显示页数和元素数量
- **使用说明**：操作步骤指引

### 右侧预览区

- **工具栏**：翻页、缩放控制
- **PDF 预览**：显示 PDF 内容
- **标识框叠加层**：彩色矩形框标注元素位置
- **图例**：不同颜色代表不同元素类型

---

## 🎯 核心功能演示

### 1. PDF 上传与预览

```typescript
// 上传文件后，PDF 会自动在右侧预览
// 支持多页 PDF，可以使用翻页按钮浏览
```

### 2. 标识框可视化

不同类型的元素用不同颜色标识：

- 🟥 **红色** = 文本 (text)
- 🟩 **绿色** = 表格 (table)
- 🟦 **蓝色** = 图片 (image)
- 🟧 **橙色** = 标题 (title)
- 🟪 **紫色** = 段落 (paragraph)

### 3. 缩放与翻页

- **缩放**：50% - 300%
- **翻页**：支持上一页/下一页
- **页码显示**：当前页 / 总页数

---

## 🔧 配置说明

### 修改 API 端点

编辑 `src/lib/textin-api.ts`：

```typescript
const apiUrl = config.apiUrl || 'YOUR_API_ENDPOINT';
```

### 自定义标识框颜色

编辑 `src/components/PDFViewer.tsx`：

```typescript
const typeColors: Record<string, string> = {
  text: 'rgba(255, 0, 0, 0.3)',      // 红色
  table: 'rgba(0, 255, 0, 0.3)',     // 绿色
  // 添加更多自定义颜色...
};
```

### 调整默认缩放

编辑 `src/components/PDFViewer.tsx`：

```typescript
const [scale, setScale] = useState<number>(1.5); // 修改这里
```

---

## 📊 模拟数据说明

模拟数据用于快速测试 UI，无需调用真实 API。

### 模拟数据格式

```typescript
const mockRects = [
  [
    {
      position: [x1, y1, x2, y2, x3, y3, x4, y4], // 8 个坐标值
      type: 'title',                               // 元素类型
      content_id: 1,                               // 唯一 ID
    },
    // ... 更多标识框
  ],
];
```

### 自定义模拟数据

在 `src/app/page.tsx` 中找到 `handleMockParse` 函数：

```typescript
const mockRects: TextInPosition[][] = [
  [
    // 第一页的标识框
    {
      position: [50, 50, 300, 50, 300, 100, 50, 100],
      type: 'title',
      content_id: 1,
    },
    // 添加更多...
  ],
  // 第二页...
];
```

---

## 🐛 常见问题

### Q1: PDF 无法加载

**解决方法：**

1. 确认 PDF 文件未损坏
2. 检查浏览器控制台是否有错误
3. 尝试使用不同的 PDF 文件

### Q2: 标识框不显示

**解决方法：**

1. 确认已点击"解析"按钮
2. 检查控制台是否有错误信息
3. 确认 API 返回的数据格式正确

### Q3: API 调用失败

**解决方法：**

1. 确认 API Key 正确
2. 检查网络连接
3. 查看浏览器 Network 面板
4. 参考 `docs/TEXTIN_API_GUIDE.md`

### Q4: 页面加载慢

**原因：**

- PDF 文件较大
- Worker 加载需要时间

**解决方法：**

- 等待几秒钟
- 使用较小的 PDF 测试
- 检查网络连接

---

## 🚢 部署

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

### 部署到 Vercel

1. 安装 Vercel CLI

```bash
npm i -g vercel
```

2. 部署

```bash
vercel
```

3. 按照提示完成部署

---

## 📚 进阶学习

### 文档资源

- [README.md](./README.md) - 项目完整说明
- [docs/TEXTIN_API_GUIDE.md](./docs/TEXTIN_API_GUIDE.md) - API 集成指南
- [docs/DEMO_FEATURES.md](./docs/DEMO_FEATURES.md) - 功能详细说明

### 相关技术文档

- [Next.js 文档](https://nextjs.org/docs)
- [React-PDF 文档](https://github.com/wojtekmaj/react-pdf)
- [TextIn API 文档](https://www.textin.com/document)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

## 🎉 完成！

现在你已经成功运行了 PDF 解析 Demo。

**下一步：**

1. 尝试上传不同的 PDF 文件
2. 测试模拟数据功能
3. 配置真实的 TextIn API
4. 自定义界面和功能
5. 阅读进阶文档

如有问题，请参考 [README.md](./README.md) 或查看 `docs/` 目录中的详细文档。

