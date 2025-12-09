import { NextRequest, NextResponse } from 'next/server';

// 模拟 API 配置 - 实际使用时替换为真实的 API 地址和密钥
const API_CONFIG = {
  url: process.env.TEXTIN_API_URL || 'https://api.textin.com/ai/service/v1/pdf_to_markdown',
  appId: process.env.TEXTIN_APP_ID || '',
  secretCode: process.env.TEXTIN_SECRET_CODE || '',
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ code: 400, message: '请上传文件' }, { status: 400 });
    }

    // 如果配置了真实 API，则调用
    if (API_CONFIG.appId && API_CONFIG.secretCode) {
      const fileBuffer = await file.arrayBuffer();

      const response = await fetch(API_CONFIG.url, {
        method: 'POST',
        headers: {
          'x-ti-app-id': API_CONFIG.appId,
          'x-ti-secret-code': API_CONFIG.secretCode,
          'Content-Type': 'application/octet-stream',
        },
        body: fileBuffer,
      });

      const result = await response.json();
      return NextResponse.json(result);
    }

    // 没有配置 API 时，返回模拟数据
    const mockResult = generateMockResult();
    
    // 模拟延迟
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return NextResponse.json({
      code: 200,
      message: 'success',
      data: {
        result: mockResult,
      },
    });
  } catch (error) {
    console.error('解析失败:', error);
    return NextResponse.json(
      { code: 500, message: '解析失败', error: String(error) },
      { status: 500 }
    );
  }
}

// 生成模拟数据
function generateMockResult() {
  return {
    markdown: `# 文档标题

这是第一段正文内容，演示 PDF 解析功能。文档解析可以识别段落、标题、表格、图片等多种元素。

## 第一章 概述

本章节介绍文档解析的基本概念和应用场景。文档解析技术广泛应用于：

- 企业文档数字化
- 知识库构建
- 智能问答系统

### 1.1 技术原理

文档解析基于深度学习技术，能够准确识别文档结构。

## 第二章 功能特性

| 功能 | 描述 |
|------|------|
| 段落识别 | 准确识别文档段落 |
| 表格提取 | 支持复杂表格 |
| 图片识别 | 提取文档图片 |

这是文档的结尾部分。`,
    detail: [
      {
        type: 'title',
        text: '文档标题',
        position: [50, 50, 300, 50, 300, 90, 50, 90],
        page_id: 1,
        outline_level: 0,
      },
      {
        type: 'paragraph',
        text: '这是第一段正文内容，演示 PDF 解析功能。文档解析可以识别段落、标题、表格、图片等多种元素。',
        position: [50, 110, 550, 110, 550, 160, 50, 160],
        page_id: 1,
      },
      {
        type: 'title',
        text: '第一章 概述',
        position: [50, 180, 250, 180, 250, 220, 50, 220],
        page_id: 1,
        outline_level: 1,
      },
      {
        type: 'paragraph',
        text: '本章节介绍文档解析的基本概念和应用场景。',
        position: [50, 240, 500, 240, 500, 280, 50, 280],
        page_id: 1,
      },
      {
        type: 'paragraph',
        text: '文档解析技术广泛应用于企业文档数字化、知识库构建、智能问答系统等领域。',
        position: [50, 300, 550, 300, 550, 380, 50, 380],
        page_id: 1,
      },
      {
        type: 'title',
        text: '1.1 技术原理',
        position: [50, 400, 220, 400, 220, 440, 50, 440],
        page_id: 1,
        outline_level: 2,
      },
      {
        type: 'paragraph',
        text: '文档解析基于深度学习技术，能够准确识别文档结构。',
        position: [50, 460, 500, 460, 500, 500, 50, 500],
        page_id: 1,
      },
      {
        type: 'title',
        text: '第二章 功能特性',
        position: [50, 540, 280, 540, 280, 580, 50, 580],
        page_id: 1,
        outline_level: 1,
      },
      {
        type: 'table',
        text: '| 功能 | 描述 |\n|------|------|\n| 段落识别 | 准确识别文档段落 |\n| 表格提取 | 支持复杂表格 |\n| 图片识别 | 提取文档图片 |',
        position: [50, 600, 450, 600, 450, 750, 50, 750],
        page_id: 1,
      },
      {
        type: 'paragraph',
        text: '这是文档的结尾部分。',
        position: [50, 780, 300, 780, 300, 820, 50, 820],
        page_id: 1,
      },
    ],
    pages: [
      {
        page_id: 1,
        width: 612,
        height: 892,
        angle: 0,
      },
    ],
    metrics: [
      {
        page_id: 1,
        angle: 0,
      },
    ],
  };
}
