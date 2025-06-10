// API服务模块
import { apiConfig } from "../config/api";

// 模拟响应数据
const mockResponses = {
  gpt2: {
    content: `# GPT-2 模型回复

这是一个来自 GPT-2 的模拟回复。

## 功能特点
- 文本生成
- 对话交互
- 上下文理解

## 代码示例
\`\`\`python
def generate_text(prompt):
    return model.generate(prompt)
\`\`\`

> 注意：这是一个模拟响应，用于演示 Markdown 格式。

| 特性 | 描述 |
|------|------|
| 模型大小 | 基础版本 |
| 响应速度 | 快速 |
| 准确度 | 良好 |`,
    reasoning: "让我思考一下如何回答这个问题...",
  },
  "gpt2-medium": {
    content: `# GPT-2 Medium 模型回复

这是来自 GPT-2 Medium 的回复。

## 主要优势
- 更大的模型容量
- 更强的语言理解
- 更丰富的输出

## 示例代码
\`\`\`javascript
const response = await model.generate({
    prompt: "你的问题",
    maxLength: 100
});
\`\`\`

> 提示：这是 Medium 版本的模拟响应。

| 参数 | 值 |
|------|-----|
| 模型大小 | 中等 |
| 性能 | 优秀 |
| 资源消耗 | 中等 |`,
    reasoning: "这个问题需要从多个角度来分析...",
  },
  "gpt2-large": `# GPT-2 Large 模型回复

这是 GPT-2 Large 的回复。

## 核心特性
- 最强大的文本生成能力
- 最准确的语义理解
- 最丰富的知识库

## 使用示例
\`\`\`python
response = model.generate(
    prompt="输入文本",
    temperature=0.7,
    max_tokens=1000
)
\`\`\`

> 说明：这是 Large 版本的模拟响应。

| 指标 | 评分 |
|------|------|
| 准确性 | 95% |
| 响应时间 | 1.2s |
| 资源占用 | 高 |`,
  distilgpt2: `# DistilGPT-2 模型回复

这是 DistilGPT-2 的回复。

## 轻量级特性
- 快速响应
- 低资源占用
- 基础功能完整

## 代码示例
\`\`\`python
result = model.predict(
    text="输入文本",
    max_length=50
)
\`\`\`

> 备注：这是轻量级模型的模拟响应。

| 特点 | 说明 |
|------|------|
| 大小 | 小型 |
| 速度 | 极快 |
| 功能 | 基础 |`,
  "bigscience/bloom": `# BLOOM 模型回复

这是 BLOOM 模型的回复。

## 多语言支持
- 支持46种语言
- 跨语言理解
- 文化适应性

## 示例用法
\`\`\`python
response = bloom_model.generate(
    prompt="多语言输入",
    language="zh"
)
\`\`\`

> 提示：这是多语言模型的模拟响应。

| 语言 | 支持度 |
|------|--------|
| 中文 | 优秀 |
| 英文 | 优秀 |
| 其他 | 良好 |`,
  "google/flan-t5-base": `# T5 模型回复

这是 T5 模型的回复。

## 文本转换能力
- 文本生成
- 文本摘要
- 问答系统

## 代码示例
\`\`\`python
output = t5_model.generate(
    input_text="输入文本",
    task="text2text"
)
\`\`\`

> 说明：这是 T5 模型的模拟响应。

| 任务类型 | 准确率 |
|----------|--------|
| 生成 | 90% |
| 摘要 | 85% |
| 问答 | 88% |`,
  "facebook/bart-large": `# BART 模型回复

这是 BART 模型的回复。

## 主要功能
- 文本生成
- 文本摘要
- 对话生成

## 使用示例
\`\`\`python
result = bart_model.generate(
    text="输入文本",
    max_length=100
)
\`\`\`

> 注意：这是 BART 模型的模拟响应。

| 功能 | 效果 |
|------|------|
| 生成 | 优秀 |
| 摘要 | 优秀 |
| 对话 | 良好 |`,
};

// API服务类
class ApiService {
  constructor() {
    this.apiKey = process.env.VUE_APP_API_KEY;
    this.abortController = null;
  }

  // 中断当前请求
  abortRequest() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // 生成新的 chat_id
  generateChatId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  // 发送消息到API并处理流式响应
  async sendMessageWithStream(message, model, onProgress, signal, chatId) {
    try {
      // 如果存在之前的请求，先中断它
      this.abortRequest();

      // 创建新的 AbortController
      this.abortController = new AbortController();

      const requestBody = {
        model: model,
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
        chat_id: chatId, // 使用传入的 chatId
      };

      console.log("发送请求参数:", {
        url: `${apiConfig.baseUrl}${apiConfig.endpoints.stream}`,
        body: requestBody,
        chatId,
      });

      const response = await fetch(
        `${apiConfig.baseUrl}${apiConfig.endpoints.stream}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            ...apiConfig.headers,
            ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
          },
          body: JSON.stringify(requestBody),
          signal: signal || this.abortController.signal,
        }
      );

      console.log("收到响应状态:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("服务器响应错误:", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });

        if (response.status === 404) {
          throw new Error("无法连接到服务器，请检查网络连接");
        } else if (response.status === 401) {
          throw new Error("认证失败，请检查API密钥是否正确");
        } else if (response.status === 429) {
          throw new Error("请求过于频繁，请稍后再试");
        } else {
          throw new Error(
            `请求失败: ${response.status} ${response.statusText}\n${errorText}`
          );
        }
      }

      if (!response.body) {
        throw new Error("响应中没有数据流");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let reading = true;
      let lastProcessedLine = null; // 用于跟踪上一次处理的行

      while (reading) {
        const { done, value } = await reader.read();
        if (done) {
          reading = false;
          break;
        }

        const chunk = decoder.decode(value);
        console.log("收到的原始块:", chunk);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.trim() === "") continue;

          console.log("处理前的行:", line);

          // 移除 data: 前缀，并清理空格
          const cleanedLine = line.replace(/^data:\s*/, "").trim();

          // 如果这行数据和上一行完全一样，跳过处理
          if (cleanedLine === lastProcessedLine) {
            console.log("跳过重复行:", cleanedLine);
            continue;
          }

          console.log("清理后的数据:", cleanedLine);

          if (cleanedLine === "[DONE]") {
            reading = false;
            break;
          }

          // 处理数据
          if (cleanedLine && cleanedLine !== "[DONE]") {
            try {
              // 尝试解析为 JSON
              const data = JSON.parse(cleanedLine);
              console.log("成功解析为 JSON 数据:", data);

              if (data.choices && data.choices[0] && data.choices[0].delta) {
                const delta = data.choices[0].delta;
                if (delta.content) {
                  buffer += delta.content;
                  onProgress({
                    choices: [
                      {
                        delta: {
                          content: delta.content,
                        },
                      },
                    ],
                  });
                }
                if (delta.reasoning_content) {
                  onProgress({
                    choices: [
                      {
                        delta: {
                          reasoning_content: delta.reasoning_content,
                        },
                      },
                    ],
                  });
                }
              }
            } catch (e) {
              // 如果不是 JSON，说明是纯文本数据
              const textContent = cleanedLine;
              if (textContent && textContent !== "[DONE]") {
                console.log("作为纯文本处理:", textContent);
                buffer += textContent;
                onProgress({
                  choices: [
                    {
                      delta: {
                        content: textContent,
                      },
                    },
                  ],
                });
              }
            }

            // 记录这行数据，用于下次去重
            lastProcessedLine = cleanedLine;
          }
        }
      }

      return buffer;
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        return null;
      }
      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        throw new Error("无法连接到服务器，请检查网络连接或服务器状态");
      }
      // 处理其他错误
      if (
        error.name === "TypeError" &&
        error.message.includes("Cannot read properties")
      ) {
        throw new Error("数据格式错误，请稍后重试");
      }
      console.error("API Error:", error);
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  // 发送普通消息（非流式）
  async sendMessage(model, message) {
    try {
      // 如果存在之前的请求，先中断它
      this.abortRequest();

      // 创建新的 AbortController
      this.abortController = new AbortController();

      const response = await fetch(
        `${apiConfig.baseUrl}${apiConfig.endpoints.chat}`,
        {
          method: "POST",
          headers: {
            ...apiConfig.headers,
            ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
          },
          body: JSON.stringify({
            message,
            model,
            chat_id: this.generateChatId(),
            question: message,
            messages: [{ role: "user", content: message }],
          }),
          signal: this.abortController.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // 根据您的 API 响应格式进行调整
      if (data.choices && data.choices[0] && data.choices[0].delta) {
        return data.choices[0].delta.content || "";
      }
      throw new Error("Invalid response format from API");
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request was aborted");
        return null;
      }
      console.error("API Error:", error);
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  async chatService(message, onProgress) {
    try {
      // 模拟流式响应
      const response = mockResponses.gpt2;
      const contentChunks = response.content.split(" ");
      const reasoningChunks = response.reasoning.split(" ");

      // 先发送推理过程
      for (const chunk of reasoningChunks) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        onProgress({
          choices: [
            {
              delta: {
                reasoning_content: chunk + " ",
              },
            },
          ],
        });
      }

      // 然后发送主要内容
      for (const chunk of contentChunks) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        onProgress({
          choices: [
            {
              delta: {
                content: chunk + " ",
              },
            },
          ],
        });
      }
    } catch (error) {
      console.error("Error in chat service:", error);
      throw error;
    }
  }

  // 获取会话列表
  async getConversations() {
    try {
      const response = await this.axios.get("/api/conversations");
      return response.data;
    } catch (error) {
      console.error("获取会话列表失败:", error);
      throw error;
    }
  }

  // 获取会话详情
  async getConversationDetail(conversationId) {
    try {
      const response = await this.axios.get(
        `/api/conversations/${conversationId}`
      );
      return response.data;
    } catch (error) {
      console.error("获取会话详情失败:", error);
      throw error;
    }
  }

  // 保存会话
  async saveConversation({ title, messages }) {
    try {
      const response = await this.axios.post("/api/conversations", {
        title,
        messages,
      });
      return response.data;
    } catch (error) {
      console.error("保存会话失败:", error);
      throw error;
    }
  }

  // 删除会话
  async deleteConversation(conversationId) {
    try {
      await this.axios.delete(`/api/conversations/${conversationId}`);
    } catch (error) {
      console.error("删除会话失败:", error);
      throw error;
    }
  }

  // 获取建议列表
  async getSuggestions(query) {
    try {
      // 模拟数据
      const mockSuggestions = {
        你好: [
          "你好，有什么我可以帮你的吗？",
          "你好，很高兴见到你！",
          "你好，我是AI助手，请问有什么问题？",
          "你好，今天天气真不错！",
          "你好，需要我为你做些什么？",
          "你好，我们可以开始聊天了",
          "你好，有什么想聊的吗？",
          "你好，我是你的AI助手",
          "你好，有什么我可以帮助你的？",
          "你好，让我们开始愉快的对话吧",
          "你好，有什么问题想问吗？",
          "你好，我是你的智能助手",
          "你好，有什么我可以为你效劳的？",
          "你好，让我们开始交流吧",
          "你好，有什么想了解的吗？",
          "你好，我是你的AI伙伴",
          "你好，有什么我可以协助你的？",
          "你好，让我们开始对话吧",
          "你好，有什么想讨论的吗？",
          "你好，我是你的智能伙伴",
        ],
        帮我: ["帮你写代码", "帮你分析问题", "帮你优化方案", "帮你解决bug"],
        如何: [
          "如何提高代码质量？",
          "如何优化性能？",
          "如何学习编程？",
          "如何解决这个问题？",
        ],
        为什么: [
          "为什么会出现这个错误？",
          "为什么要这样设计？",
          "为什么选择这个方案？",
          "为什么性能会下降？",
        ],
        请: [
          "请帮我分析一下这个问题",
          "请解释一下这段代码",
          "请给我一些建议",
          "请帮我优化这个方案",
        ],
      };

      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 根据输入内容匹配建议
      const suggestions = [];
      for (const [key, values] of Object.entries(mockSuggestions)) {
        if (query.includes(key)) {
          suggestions.push(...values);
        }
      }

      // 如果没有匹配到任何建议，返回一些通用建议
      if (suggestions.length === 0) {
        return [
          "你可以问我任何问题",
          "我可以帮你解决技术问题",
          "需要我为你做些什么？",
          "有什么我可以帮你的吗？",
        ];
      }

      return suggestions;
    } catch (error) {
      console.error("获取建议失败:", error);
      return [];
    }
  }
}

export default new ApiService();
