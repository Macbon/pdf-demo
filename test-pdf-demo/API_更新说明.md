# API 调用方式更新说明

## 🔄 更新内容

根据 Python 示例代码，已更新为正确的 TextIn API 调用方式。

---

## 📋 Python vs Next.js 对比

### Python 代码 (原始)

```python
class OCRClient:
    def __init__(self, app_id: str, secret_code: str):
        self.app_id = app_id
        self.secret_code = secret_code

    def recognize(self, file_content: bytes, options: dict) -> str:
        # 构建请求参数
        params = {}
        for key, value in options.items():
            params[key] = str(value)

        # 设置请求头
        headers = {
            "x-ti-app-id": self.app_id,
            "x-ti-secret-code": self.secret_code,
            "Content-Type": "application/octet-stream"
        }

        # 发送请求
        response = requests.post(
            f"https://api.textin.com/ai/service/v1/pdf_to_markdown",
            params=params,
            headers=headers,
            data=file_content
        )

        response.raise_for_status()
        return response.text
```

### Next.js 实现 (对应)

```typescript
export async function parsePdfWithTextin(
  file: File,
  config: TextInApiConfig
): Promise<TextInResult> {
  // 读取文件内容为 bytes
  const fileContent = await file.arrayBuffer();

  // 构建 URL 参数
  let apiUrl = config.apiUrl || 'https://api.textin.com/ai/service/v1/pdf_to_markdown';
  
  if (config.options) {
    const params = new URLSearchParams();
    Object.entries(config.options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    apiUrl += `?${params.toString()}`;
  }

  // 按照 Python 代码的方式发送请求
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'x-ti-app-id': config.appId,
      'x-ti-secret-code': config.secretCode,
      'Content-Type': 'application/octet-stream',
    },
    body: fileContent,  // 直接发送文件字节内容
  });

  const responseText = await response.text();
  return JSON.parse(responseText);
}
```

---

## 🔑 关键变化

### 1. **请求方式**

**之前（错误）：**
```typescript
// 使用 FormData
const formData = new FormData();
formData.append('file', file);
formData.append('dpi', '144');
// ...
body: formData
```

**现在（正确）：**
```typescript
// 直接发送文件字节内容
const fileContent = await file.arrayBuffer();
body: fileContent

// 参数通过 URL query string 传递
?dpi=144&markdown_details=1&...
```

### 2. **Content-Type**

**之前：**
```typescript
headers: {
  'x-ti-app-id': ...,
  'x-ti-secret-code': ...,
  // FormData 自动设置 Content-Type
}
```

**现在：**
```typescript
headers: {
  'x-ti-app-id': ...,
  'x-ti-secret-code': ...,
  'Content-Type': 'application/octet-stream',  // ✅ 明确指定
}
```

### 3. **参数传递**

**之前（错误）：**
```typescript
// 参数作为 FormData 的一部分
formData.append('dpi', '144');
```

**现在（正确）：**
```typescript
// 参数作为 URL query parameters
?dpi=144&get_image=objects&markdown_details=1...
```

### 4. **API 端点顺序**

**现在默认使用：**
```typescript
'https://api.textin.com/ai/service/v1/pdf_to_markdown'  // 首选
```

界面上的端点选项顺序：
1. ✅ **PDF 转 Markdown**（推荐）
2. PDF 转 Excel
3. 通用文档解析

---

## 📊 完整的请求示例

### HTTP 请求格式

```http
POST https://api.textin.com/ai/service/v1/pdf_to_markdown?dpi=144&get_image=objects&markdown_details=1&page_count=10&parse_mode=auto&table_flavor=html HTTP/1.1
Host: api.textin.com
x-ti-app-id: 4ae172b2a17a1fddc02ba4c18fa80b18
x-ti-secret-code: 49fbc74f8810dc8f565538887b23576c
Content-Type: application/octet-stream
Content-Length: [文件大小]

[PDF 文件的二进制内容]
```

### 响应格式

```json
{
  "code": 200,
  "message": "success",
  "result": {
    "markdown": "# 文档标题\n\n## 章节1\n...",
    "pages": [
      {
        "page_id": 0,
        "width": 595,
        "height": 842,
        "rects": [...]
      }
    ]
  }
}
```

---

## ✅ 已配置的参数

```typescript
const DEFAULT_OPTIONS = {
  dpi: 144,                  // 解析精度 (144 DPI)
  get_image: 'objects',      // 图片提取方式
  markdown_details: 1,       // Markdown 详细程度
  page_count: 10,            // 处理的页数
  parse_mode: 'auto',        // 自动解析模式
  table_flavor: 'html',      // 表格格式 (HTML)
};
```

这些参数会自动添加到每个 API 请求中。

---

## 🎯 使用方式

### 1. 选择端点

在界面上选择：
- **PDF 转 Markdown** - 获取 Markdown 格式的文档内容
- **PDF 转 Excel** - 提取表格数据
- **通用文档解析** - 获取文档结构和元素位置

### 2. 加载文件

```typescript
// 方式 A: 加载本地文件
点击 "📄 加载 public/论文.pdf"

// 方式 B: 上传文件
选择文件上传
```

### 3. 调用 API

```typescript
// 自动发送正确格式的请求
// 包含所有配置的参数
// 使用 application/octet-stream
```

### 4. 获取结果

```typescript
// 完整的 JSON 响应
{
  code: 200,
  result: {
    markdown: "...",  // Markdown 内容
    pages: [...],     // 页面信息
    // ...
  }
}

// 可以下载：
// - result.json (完整响应)
// - result.md (Markdown 内容)
```

---

## 🔍 调试信息

浏览器控制台会显示：

```javascript
调用 TextIn API: {
  url: "https://api.textin.com/ai/service/v1/pdf_to_markdown?dpi=144&...",
  fileName: "论文.pdf",
  fileType: "application/pdf",
  fileSize: "2.50 MB",
  options: {
    dpi: 144,
    get_image: "objects",
    ...
  }
}

API 响应状态: 200 OK

API 返回结果: {
  code: 200,
  result: { ... }
}

Markdown 内容预览: # 论文标题...
```

---

## 🆚 与 Python 代码的对应关系

| Python | Next.js | 说明 |
|--------|---------|------|
| `file_content: bytes` | `file.arrayBuffer()` | 文件字节内容 |
| `params=params` | URL query string | 参数传递方式 |
| `headers['Content-Type']` | `'application/octet-stream'` | 内容类型 |
| `data=file_content` | `body: fileContent` | 请求体 |
| `response.text()` | `response.text()` | 响应文本 |
| `json.loads(response)` | `JSON.parse(responseText)` | 解析 JSON |
| `with open("result.json")` | `downloadJson()` | 保存 JSON |
| `with open("result.md")` | `downloadMarkdown()` | 保存 Markdown |

---

## ✨ 新增功能

### 1. 多端点支持
- PDF 转 Markdown（主推）
- PDF 转 Excel
- 通用文档解析

### 2. 本地文件加载
- 一键加载 `public/论文.pdf`
- 无需手动上传

### 3. 结果下载
- 💾 下载 JSON 结果
- 📝 下载 Markdown 结果

### 4. 详细日志
- 完整的请求信息
- API 响应状态
- Markdown 内容预览

---

## 🎉 测试流程

1. ✅ 启动项目：`npm run dev`
2. ✅ 打开浏览器：http://localhost:3000
3. ✅ 点击 "📄 加载 public/论文.pdf"
4. ✅ 选择 "PDF 转 Markdown"
5. ✅ 点击 "调用 API 解析"
6. ✅ 查看控制台日志
7. ✅ 下载 JSON 和 Markdown 结果
8. ✅ 在右侧查看 PDF 和标识框

---

## 📝 注意事项

### 文件大小
- 建议 < 10MB
- 大文件处理时间较长

### 页数限制
- 当前设置：`page_count=10`
- 可在代码中调整

### Markdown 输出
- 仅 `pdf_to_markdown` 端点返回 markdown 字段
- 其他端点可能返回不同的数据结构

### 标识框显示
- 取决于 API 返回的 rects 数据
- 不同端点返回的数据格式可能不同
- 如果没有 rects，标识框不会显示

---

## 🚀 完成！

所有功能都已按照 Python 示例代码更新完毕，现在可以正确调用 TextIn API 了！

