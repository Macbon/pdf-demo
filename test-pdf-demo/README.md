# PDF 解析位置溯源 Demo

这是一个基于 TextIn API 的 PDF 文档解析和位置溯源演示项目。

## 功能特点

- ✅ PDF 文件上传
- ✅ 调用 TextIn API 进行文档解析
- ✅ 可视化显示元素位置标识框
- ✅ 支持多页 PDF
- ✅ 不同元素类型用不同颜色标识（文本、表格、图片等）
- ✅ PDF 缩放和翻页功能
- ✅ 包含模拟数据模式用于测试

## 技术栈

- **Next.js 16** - React 框架
- **React 19** - UI 库
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式
- **react-pdf** - PDF 渲染
- **pdfjs-dist** - PDF.js 核心库

## 项目结构

```
test-pdf-demo/
├── src/
│   ├── app/
│   │   ├── page.tsx          # 主页面
│   │   ├── layout.tsx         # 布局
│   │   └── globals.css        # 全局样式
│   ├── components/
│   │   └── PDFViewer.tsx      # PDF 预览组件
│   ├── lib/
│   │   └── textin-api.ts      # TextIn API 调用
│   └── types/
│       └── textin.ts          # 类型定义
├── package.json
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 访问应用

在浏览器中打开 [http://localhost:3000](http://localhost:3000)

## 使用方法

### 方式一：使用真实 API（已配置凭证）

1. 在左侧面板选择 API 端点：
   - **通用文档解析** - 支持多种格式
   - **PDF 转 Excel** - 专门处理表格
2. 上传 PDF 文件
3. 点击"调用 API 解析"按钮
4. 等待解析完成，查看右侧的 PDF 预览和标识框

> ✅ API 凭证已预配置，无需手动输入

### 方式二：使用模拟数据测试

1. 上传任意 PDF 文件
2. 点击"使用模拟数据测试"按钮
3. 立即看到带有模拟标识框的 PDF 预览

## API 配置

### 预配置的 API 凭证

Demo 中已内置 API 凭证：

```typescript
x-ti-app-id: 4ae172b2a17a1fddc02ba4c18fa80b18
x-ti-secret-code: 49fbc74f8810dc8f565538887b23576c
```

### 可选的 API 端点

在界面中可以选择：

1. **通用文档解析**
   - URL: `https://api.textin.com/robot/v1.0/api/parse`
   - 支持 PDF、图片等多种格式

2. **PDF 转 Excel**
   - URL: `https://api.textin.com/ai/service/v1/pdf_to_excel`
   - 专门处理表格转换

### 请求格式

```typescript
Headers:
  - x-ti-app-id: <app-id>
  - x-ti-secret-code: <secret-code>
  
Body:
  - file: <pdf-file>
```

### 响应格式

API 返回的 JSON 应包含以下结构：

```json
{
  "code": 200,
  "result": {
    "pages": [
      {
        "width": 595,
        "height": 842,
        "angle": 0,
        "rects": [
          {
            "position": [x1, y1, x2, y2, x3, y3, x4, y4],
            "type": "text|table|image|title|paragraph",
            "content_id": 1
          }
        ]
      }
    ]
  }
}
```

## 标识框说明

### position 数组格式

`[x1, y1, x2, y2, x3, y3, x4, y4]` - 表示矩形的四个顶点坐标

- `(x1, y1)` - 左上角
- `(x2, y2)` - 右上角
- `(x3, y3)` - 右下角
- `(x4, y4)` - 左下角

### 元素类型和颜色

- 🔴 **text** - 文本（红色）
- 🟢 **table** - 表格（绿色）
- 🔵 **image** - 图片（蓝色）
- 🟠 **title** - 标题（橙色）
- 🟣 **paragraph** - 段落（紫色）

## 参考项目

本项目参考了 [xparse-frontend](https://github.com/intsig-textin/xparse-frontend) 的实现方式：

- PDF 渲染方案
- SVG 标识框绘制
- 位置坐标转换

## 开发说明

### 修改标识框样式

编辑 `src/components/PDFViewer.tsx` 中的 `renderRects` 函数：

```typescript
const typeColors: Record<string, string> = {
  text: 'rgba(255, 0, 0, 0.3)',    // 红色
  table: 'rgba(0, 255, 0, 0.3)',   // 绿色
  // 添加更多类型...
};
```

### 添加新的元素类型

1. 在 `src/types/textin.ts` 中定义新类型
2. 在 `PDFViewer.tsx` 的 `typeColors` 中添加对应颜色
3. 在图例中添加说明

## 注意事项

1. **CORS 问题**：如果遇到跨域问题，需要配置 API 端点允许跨域请求
2. **文件大小限制**：大型 PDF 文件可能需要较长加载时间
3. **API 配额**：注意 TextIn API 的调用次数限制
4. **浏览器兼容性**：建议使用现代浏览器（Chrome、Firefox、Edge）

## 故障排查

### PDF 无法加载

- 确认 PDF 文件未损坏
- 检查浏览器控制台是否有错误信息
- 确认 PDF.js worker 加载成功

### API 调用失败

- 确认 API Key 正确
- 检查网络连接
- 查看浏览器 Network 面板中的请求详情
- 确认 API 端点地址正确

### 标识框显示异常

- 确认 API 返回的坐标数据格式正确
- 检查 `position` 数组是否包含 8 个数值
- 调整 PDF 缩放比例后重新加载

## License

MIT

## 致谢

感谢 TextIn 提供的文档解析 API 服务。

