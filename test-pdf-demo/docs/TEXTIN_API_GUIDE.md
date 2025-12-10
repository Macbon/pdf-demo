# TextIn API 集成指南

本文档详细说明如何配置和使用 TextIn API 进行 PDF 文档解析。

## 1. 获取 API Key

### 步骤 1：注册账号

访问 [TextIn 官网](https://www.textin.com/) 注册账号

### 步骤 2：获取 API Key

1. 登录到 TextIn 控制台
2. 进入"应用管理"或"API 管理"
3. 创建新应用或使用已有应用
4. 复制 APP ID（即 API Key）

## 2. API 端点

根据你使用的 TextIn 服务，API 端点可能有所不同：

### 通用文档解析 API

```
POST https://api.textin.com/robot/v1.0/api/parse
```

### PDF 表格识别 API

```
POST https://api.textin.com/ai/service/v1/pdf_to_excel
```

### 其他服务

请参考 [TextIn API 文档](https://www.textin.com/document) 获取具体端点。

## 3. 请求配置

### Headers

```typescript
{
  'x-ti-app-id': 'YOUR_API_KEY',
  // 某些 API 可能还需要：
  // 'x-ti-secret-code': 'YOUR_SECRET'
}
```

### Body

使用 `FormData` 格式：

```typescript
const formData = new FormData();
formData.append('file', pdfFile);
// 可能还需要其他参数，如：
// formData.append('page_range', '1-5');
// formData.append('return_coords', 'true');
```

## 4. 响应数据格式

### 标准响应结构

```json
{
  "code": 200,
  "message": "success",
  "result": {
    "pages": [
      {
        "page_id": 0,
        "width": 595,
        "height": 842,
        "angle": 0,
        "elements": [
          {
            "type": "text",
            "content": "示例文本",
            "position": [x1, y1, x2, y2, x3, y3, x4, y4],
            "coords": {
              "left_top": [x1, y1],
              "right_top": [x2, y2],
              "right_bottom": [x3, y3],
              "left_bottom": [x4, y4]
            }
          }
        ]
      }
    ]
  }
}
```

## 5. 数据转换

不同的 TextIn API 可能返回不同的数据格式。你需要根据实际情况调整转换逻辑。

### 示例 1：转换坐标格式

如果 API 返回的是 `coords` 对象而不是 `position` 数组：

```typescript
function convertCoordsToPosition(coords: any): number[] {
  return [
    coords.left_top[0], coords.left_top[1],
    coords.right_top[0], coords.right_top[1],
    coords.right_bottom[0], coords.right_bottom[1],
    coords.left_bottom[0], coords.left_bottom[1],
  ];
}
```

### 示例 2：处理嵌套元素

```typescript
function flattenElements(page: any): TextInPosition[] {
  const rects: TextInPosition[] = [];
  let contentId = 0;

  function traverse(element: any) {
    if (element.position || element.coords) {
      rects.push({
        position: element.position || convertCoordsToPosition(element.coords),
        type: element.type,
        content_id: contentId++,
      });
    }

    // 递归处理子元素
    if (element.children && Array.isArray(element.children)) {
      element.children.forEach(traverse);
    }
  }

  if (page.elements) {
    page.elements.forEach(traverse);
  }

  return rects;
}
```

## 6. 修改 API 调用代码

根据实际的 API 格式，修改 `src/lib/textin-api.ts`：

```typescript
export async function parsePdfWithTextin(
  file: File,
  config: TextInApiConfig
): Promise<TextInResult> {
  const formData = new FormData();
  formData.append('file', file);
  
  // 添加其他参数
  formData.append('return_coords', 'true');

  const response = await fetch(config.apiUrl || 'YOUR_API_ENDPOINT', {
    method: 'POST',
    headers: {
      'x-ti-app-id': config.apiKey,
      // 如果需要密钥：
      // 'x-ti-secret-code': config.secretCode,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status}`);
  }

  const result = await response.json();
  
  // 根据实际返回格式调整
  if (result.code !== 200) {
    throw new Error(result.message || 'API 返回错误');
  }

  return result.result;
}
```

## 7. 调试技巧

### 查看原始响应

在调用 API 后，在控制台打印原始响应：

```typescript
const result = await parsePdfWithTextin(file, { apiKey });
console.log('原始 API 响应:', JSON.stringify(result, null, 2));
```

### 验证坐标数据

确保坐标值合理：

```typescript
function validatePosition(position: number[]): boolean {
  if (position.length !== 8) return false;
  
  // 检查是否所有值都是有效数字
  if (position.some(val => typeof val !== 'number' || isNaN(val))) {
    return false;
  }
  
  // 检查坐标是否在合理范围内
  const maxCoord = 10000; // 假设最大坐标
  if (position.some(val => val < 0 || val > maxCoord)) {
    return false;
  }
  
  return true;
}
```

## 8. 常见问题

### Q: 401 Unauthorized

**A:** 检查 API Key 是否正确，确认 header 名称是否正确（`x-ti-app-id` 或其他）。

### Q: 403 Forbidden

**A:** 可能是 API 配额用尽，或者账号权限不足。

### Q: 坐标显示不正确

**A:** 
1. 检查 API 返回的坐标系统（左上角为原点 vs 左下角为原点）
2. 检查 PDF 的实际尺寸和 API 返回的 width/height 是否匹配
3. 可能需要根据 DPI 进行缩放转换

### Q: 标识框超出 PDF 范围

**A:** 
1. 确认 API 返回的 page.width 和 page.height
2. 检查是否需要 DPI 转换
3. 考虑 PDF 旋转角度（angle 字段）

## 9. 完整示例

```typescript
// src/lib/textin-api.ts
export async function parsePdfWithTextin(
  file: File,
  config: TextInApiConfig
): Promise<ParsedPDFData> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://api.textin.com/robot/v1.0/api/parse', {
    method: 'POST',
    headers: {
      'x-ti-app-id': config.apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.code !== 200) {
    throw new Error(data.message || '解析失败');
  }

  // 转换数据格式
  const pages = data.result.pages.map((page: any) => {
    const rects = (page.elements || []).map((el: any, idx: number) => ({
      position: el.position || convertCoordsToPosition(el.coords),
      type: el.type || 'text',
      content_id: idx,
    }));

    return {
      width: page.width,
      height: page.height,
      angle: page.angle || 0,
      rects,
    };
  });

  return {
    pages,
    rects: pages.map((p: any) => p.rects),
  };
}
```

## 10. 参考资源

- [TextIn 官方文档](https://www.textin.com/document)
- [TextIn API 示例](https://www.textin.com/document/api_examples)
- [PDF.js 文档](https://mozilla.github.io/pdf.js/)
- [React-PDF 文档](https://github.com/wojtekmaj/react-pdf)

## 11. 技术支持

如果在集成过程中遇到问题：

1. 查看 TextIn 官方文档
2. 联系 TextIn 技术支持
3. 在浏览器开发者工具中检查网络请求
4. 查看控制台错误日志

