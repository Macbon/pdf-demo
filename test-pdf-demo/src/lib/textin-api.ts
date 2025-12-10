// TextIn API 调用函数

import type { TextInResult } from '@/types/textin';

export interface TextInApiConfig {
  appId: string;
  secretCode: string;
  apiUrl?: string;
  options?: {
    dpi?: number;
    get_image?: string;
    markdown_details?: number;
    page_count?: number;
    parse_mode?: string;
    table_flavor?: string;
  };
}

/**
 * 调用 TextIn API 解析 PDF
 * @param file PDF 文件
 * @param config API 配置
 * @returns 解析结果
 */
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
    const queryString = params.toString();
    if (queryString) {
      apiUrl += `?${queryString}`;
    }
  }

  try {
    console.log('调用 TextIn API:', {
      url: apiUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      options: config.options,
    });

    // 按照 Python 代码的方式发送请求
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-ti-app-id': config.appId,
        'x-ti-secret-code': config.secretCode,
        'Content-Type': 'application/octet-stream',
      },
      body: fileContent,
    });

    console.log('API 响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 错误响应:', errorText);
      throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('API 原始响应:', responseText);
    
    const result = JSON.parse(responseText);
    console.log('API 返回结果:', result);
    
    // 检查 API 返回的状态
    if (result.code !== 200 && result.code !== 0) {
      const errorMsg = result.message || 'API 返回错误';
      console.error('API 业务错误:', {
        code: result.code,
        message: result.message,
        fullResult: result,
      });
      throw new Error(`${errorMsg} (错误码: ${result.code})`);
    }

    return result;
  } catch (error) {
    console.error('TextIn API 调用失败:', error);
    throw error;
  }
}

/**
 * 将 TextIn 返回的结果转换为标识框数据格式
 * @param result TextIn API 返回结果
 * @returns 按页组织的标识框数组
 */
export function convertTextInResultToRects(result: TextInResult): any[][] {
  if (!result.pages || !Array.isArray(result.pages)) {
    console.warn('❌ convertTextInResultToRects: 没有找到 pages 数组');
    return [];
  }

  console.log(`✅ convertTextInResultToRects: 发现 ${result.pages.length} 页`);

  return result.pages.map((page, pageIndex) => {
    // 1. 如果页面有 rects 字段，直接返回
    if (page.rects && Array.isArray(page.rects)) {
      return page.rects;
    }
    
    // 2. 如果页面有 structured 字段，从中提取位置信息
    if (page.structured && Array.isArray(page.structured)) {
      console.log(`✅ 第 ${pageIndex + 1} 页: 从 structured 字段解析到 ${page.structured.length} 个元素`);
      return page.structured.map((item: any, index: number) => ({
        position: item.pos || item.position || [],
        type: item.type || 'textblock',
        rect_type: item.sub_type || item.type || 'text',
        content_id: item.id !== undefined ? item.id : index,
        uid: `page-${pageIndex + 1}-rect-${index}`,
        text: item.text || '',
        cells: item.cells, // 表格单元格
        image_url: item.image_url, // 图片 URL
        caption_id: item.caption_id, // 图片标题
      })).filter((rect: any) => rect.position && rect.position.length === 8);
    }
    
    // 3. 如果页面有 content 字段（TextIn 旧格式）
    if (page.content && Array.isArray(page.content)) {
      console.log(`✅ 第 ${pageIndex + 1} 页: 从 content 字段解析到 ${page.content.length} 个元素`);
      return page.content.map((item: any, index: number) => ({
        position: item.pos || item.position || [],
        type: item.type || 'textblock',
        rect_type: item.sub_type || item.type || 'text',
        content_id: item.id !== undefined ? item.id : index,
        uid: `page-${pageIndex + 1}-rect-${index}`,
        text: item.text || '',
      })).filter((rect: any) => rect.position && rect.position.length === 8);
    }
    
    // 4. 否则返回空数组
    console.warn(`⚠️ 第 ${pageIndex + 1} 页: 没有找到 rects/structured/content 字段`);
    return [];
  });
}

