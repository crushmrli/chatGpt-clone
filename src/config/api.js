// API配置
export const apiConfig = {
  baseUrl: process.env.VUE_APP_API_BASE_URL || "http://localhost:3000", // 使用本地开发服务器
  timeout: 30000, // 30秒超时
  retryTimes: 3, // 重试次数
  retryDelay: 1000, // 重试延迟（毫秒）
  endpoints: {
    chat: "/v1/chat/completions", // OpenAI 聊天接口
    stream: "/v1/chat/completions", // OpenAI 流式响应接口
  },
  headers: {
    "Content-Type": "application/json",
    // 如果需要其他请求头，可以在这里添加
    // "Authorization": "Bearer your-token",
  },
};
