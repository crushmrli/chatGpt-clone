<template>
  <div class="chat-window">
    <div class="chat-container">
      <history-sidebar @load-conversation="handleLoadConversation"
                       @conversation-deleted="handleConversationDeleted" />
      <div class="chat-main">
        <div class="chat-header">
          <h2><i class="el-icon-chat-line-round"></i> ChatGPT Clone</h2>
          <el-select v-model="selectedModel"
                     placeholder="选择模型"
                     class="model-select">
            <i slot="prefix"
               class="el-icon-cpu"></i>
            <el-option v-for="model in availableModels"
                       :key="model.value"
                       :label="model.label"
                       :value="model.value">
              <i class="el-icon-cpu"></i>
              {{ model.label }}
            </el-option>
          </el-select>
        </div>
        <div class="messages"
             ref="messagesContainer">
          <div v-for="(message, index) in displayMessages"
               :key="index"
               :class="['message', message.role]">
            <div class="message-content">
              <div v-if="message.role === 'assistant'"
                   class="message-header">
                <span class="model-name">
                  <i class="el-icon-cpu"></i>
                  {{ (availableModels.find(m => m.value === selectedModel) || {}).label || selectedModel }}
                </span>
              </div>
              <div v-if="message.role === 'assistant' && message.reasoning"
                   class="reasoning">
                <div class="reasoning-content">
                  <i class="el-icon-thinking"></i>
                  {{ message.reasoning }}
                </div>
              </div>
              <div class="content">
                <markdown-renderer :content="message.content || ''"
                                   :pre-rendered="message.renderedContent" />
              </div>
            </div>
          </div>
          <div v-if="isTyping && !displayMessages.some(msg => msg.isTemp)"
               class="message assistant">
            <div class="message-content">
              <div v-if="reasoningContent"
                   class="reasoning">
                <div class="reasoning-content">
                  <i class="el-icon-thinking"></i>
                  {{ reasoningContent }}
                </div>
              </div>
              <div class="content">
                <markdown-renderer :content="currentResponse || ''" />
              </div>
            </div>
          </div>
        </div>
        <div class="input-container">
          <el-input v-model="userInput"
                    type="textarea"
                    :rows="3"
                    placeholder="输入消息..."
                    @keyup.enter.native="handleSendMessage">
            <template slot="prefix">
              <i class="el-icon-edit"></i>
            </template>
          </el-input>
          <div class="button-container">
            <el-button type="primary"
                       :loading="isTyping"
                       @click="handleSendMessage">
              <i class="el-icon-s-promotion"></i>
              发送
            </el-button>
            <el-button v-if="isTyping || isStreaming"
                       type="danger"
                       @click="stopGeneration">
              <i class="el-icon-video-pause"></i>
              停止
            </el-button>
            <el-button @click="handleNewChat">
              <i class="el-icon-plus"></i>
              新对话
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HistorySidebar from './HistorySidebar.vue'
import MarkdownRenderer from './MarkdownRenderer.vue'
import { mapState, mapActions } from 'vuex'

export default {
  name: 'ChatWindow',
  components: {
    HistorySidebar,
    MarkdownRenderer,
  },
  data() {
    return {
      userInput: '',
      reasoningContent: '',
      isStreaming: false,
    }
  },
  computed: {
    ...mapState({
      messages: (state) => state.chat.messages,
      isTyping: (state) => state.chat.isTyping,
      currentResponse: (state) => state.chat.currentResponse,
      availableModels: (state) => state.chat.availableModels,
      conversations: (state) => state.conversations.conversations,
    }),
    selectedModel: {
      get() {
        return this.$store.state.chat.selectedModel
      },
      set(value) {
        this.$store.commit('chat/SET_SELECTED_MODEL', value)
      },
    },
    displayMessages() {
      console.log('当前所有消息:', this.$store.state.chat.messages)
      console.log('当前响应:', this.currentResponse)
      console.log('是否正在输入:', this.isTyping)
      return this.$store.getters['chat/displayMessages']
    },
  },
  methods: {
    ...mapActions('chat', ['sendMessage']),
    ...mapActions('conversations', [
      'loadConversation',
      'loadConversations',
      'startNewChat',
    ]),
    async handleSendMessage() {
      if (!this.userInput.trim() || this.isTyping) return
      const message = this.userInput.trim()
      this.userInput = ''
      this.reasoningContent = ''
      this.isStreaming = true
      this.$store.commit('chat/SET_IS_TYPING', true)

      try {
        await this.sendMessage({
          message,
          onProgress: this.handleProgress,
        })
        // 发送消息后重新加载会话列表
        await this.loadConversations()
      } catch (error) {
        console.error('发送消息失败:', error)
      } finally {
        this.isStreaming = false
        this.$store.commit('chat/SET_IS_TYPING', false)
      }
    },
    async handleNewChat() {
      await this.startNewChat()
      this.userInput = ''
      this.reasoningContent = ''
    },
    async handleLoadConversation(id) {
      await this.loadConversation(id)
    },
    async handleConversationDeleted() {
      await this.loadConversations()
      await this.startNewChat()
    },
    handleProgress(data) {
      console.log('收到进度更新:', data)
      if (!data || !data.choices || !data.choices[0]) return

      const delta = data.choices[0].delta
      if (!delta) return

      if (delta.content === 'finish') return

      if (delta.reasoning_content) {
        this.reasoningContent += delta.reasoning_content
        console.log('更新推理内容:', this.reasoningContent)
        this.scrollToBottom()
      }

      if (delta.content) {
        this.$store.commit(
          'chat/SET_CURRENT_RESPONSE',
          this.currentResponse + delta.content
        )
        console.log('更新当前响应:', this.currentResponse)
        this.scrollToBottom()
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    },
    stopGeneration() {
      if (this.$store.state.chat.abortController) {
        this.$store.state.chat.abortController.abort()
        this.$store.commit('chat/setAbortController', null)
        this.isStreaming = false
        this.$store.commit('chat/SET_IS_TYPING', false)
      }
    },
  },
  watch: {
    messages: {
      handler() {
        // 自动滚动到底部
        this.scrollToBottom()
      },
      deep: true,
    },
  },
  async created() {
    await this.loadConversations()
    await this.startNewChat()
  },
}
</script>

<style lang="less" scoped>
@import '../styles/theme.less';

.chat-window {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: @bg-gradient;

  .chat-container {
    flex: 1;
    display: flex;
    margin: @spacing-md;
    border-radius: @radius-lg;
    box-shadow: @shadow-lg;
    background: @bg-color;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fb7185' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      opacity: 0.5;
      pointer-events: none;
    }
  }

  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .chat-header {
    padding: @spacing-lg;
    border-bottom: 1px solid @border-color;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: @bg-gradient-header;
    position: relative;
    z-index: 1;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        45deg,
        transparent 0%,
        rgba(255, 255, 255, 0.1) 100%
      );
      pointer-events: none;
    }

    h2 {
      margin: 0;
      font-size: @text-xl;
      color: @primary-color;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: @spacing-xs;
      text-shadow: 0 2px 4px rgba(251, 113, 133, 0.1);

      i {
        font-size: 1.8rem;
        animation: float 3s ease-in-out infinite;
      }
    }
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: @spacing-lg;
    display: flex;
    flex-direction: column;
    gap: @spacing-sm;
    background: radial-gradient(
        circle at 50% 0%,
        rgba(192, 28, 32, 0.05) 0%,
        transparent 50%
      ),
      linear-gradient(
        180deg,
        rgba(249, 225, 225, 0.3) 0%,
        rgba(255, 255, 255, 1) 100%
      );
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C01C20' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      opacity: 0.5;
      pointer-events: none;
    }

    .message {
      max-width: 80%;
      padding: @spacing-md @spacing-lg;
      border-radius: @radius-md;
      word-break: break-word;
      box-shadow: @shadow-sm;
      transition: @transition;
      display: flex;
      gap: @spacing-sm;
      align-items: flex-start;
      position: relative;
      backdrop-filter: blur(5px);
      animation: messageAppear 0.3s ease-out;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: inherit;
        border-radius: inherit;
        z-index: -1;
        filter: blur(10px);
        opacity: 0.5;
      }

      &-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: @transition;

        i {
          font-size: 1.2rem;
        }
      }

      &-content {
        flex: 1;
        min-width: 0;
        overflow-x: auto;

        .reasoning {
          margin-bottom: @spacing-md;
          padding: @spacing-sm;
          background: rgba(251, 113, 133, 0.1);
          border-radius: @radius-sm;
          color: @primary-color;
          font-style: italic;

          .reasoning-content {
            display: flex;
            align-items: center;
            gap: @spacing-xs;

            i {
              font-size: 1.2rem;
            }
          }
        }

        .content {
          margin-top: @spacing-md;
        }

        /deep/ pre {
          margin: @spacing-sm 0;
          padding: @spacing-md;
          background: rgba(0, 0, 0, 0.05);
          border-radius: @radius-sm;
          overflow-x: auto;
          max-width: 100%;
        }

        /deep/ code {
          font-family: 'Fira Code', monospace;
          font-size: 0.9em;
          padding: 0.2em 0.4em;
          background: rgba(0, 0, 0, 0.05);
          border-radius: @radius-sm;
        }

        /deep/ p {
          margin: @spacing-sm 0;
        }

        /deep/ ul,
        /deep/ ol {
          margin: @spacing-sm 0;
          padding-left: @spacing-lg;
        }

        /deep/ blockquote {
          margin: @spacing-sm 0;
          padding: @spacing-sm @spacing-md;
          border-left: 4px solid @primary-color;
          background: rgba(251, 113, 133, 0.05);
        }

        /deep/ table {
          width: 100%;
          border-collapse: collapse;
          margin: @spacing-sm 0;

          th,
          td {
            border: 1px solid @border-color;
            padding: @spacing-xs @spacing-sm;
            text-align: left;
          }

          th {
            background: rgba(251, 113, 133, 0.05);
          }
        }

        /deep/ img {
          max-width: 100%;
          height: auto;
          border-radius: @radius-md;
          margin: @spacing-sm 0;
        }
      }

      &.user {
        align-self: flex-end;
        background: @bg-gradient-button;
        color: white;
        margin-left: 2rem;
        transform-origin: right bottom;
        max-width: 70%;
        padding: @spacing-xs @spacing-sm;
        margin-bottom: @spacing-xs;
        font-size: 0.95em;

        &:hover {
          transform: scale(1.005);
        }

        .message-icon {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .message-content {
          /deep/ pre,
          /deep/ code,
          /deep/ blockquote {
            background: rgba(255, 255, 255, 0.1);
            color: white;
          }
        }
      }

      &.assistant {
        align-self: flex-start;
        background: @bg-glass;
        color: #303133;
        margin-right: 2rem;
        border: 1px solid @border-color-light;
        transform-origin: left bottom;

        &:hover {
          transform: scale(1.005);
        }

        .message-icon {
          background-color: @primary-light;
          color: @primary-color;
        }

        .message-header {
          .model-name {
            font-size: 0.85em;
            color: @primary-color;
            background: rgba(251, 113, 133, 0.1);
            padding: 2px 8px;
            border-radius: @radius-sm;
            display: inline-flex;
            align-items: center;
            height: 20px;
            line-height: 20px;
          }
        }

        .message-content {
          /deep/ .markdown-content {
            color: #303133;
            font-size: 14px;
            line-height: 1.6;

            /deep/ table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;

              th,
              td {
                border: 1px solid @border-color;
                padding: 0.5em 1em;
                text-align: left;
              }

              th {
                background: rgba(251, 113, 133, 0.05);
              }
            }

            /deep/ pre {
              margin: 1em 0;
              padding: 1em;
              overflow: auto;
              background: #1e293b;
              border-radius: 6px;

              code {
                background: none;
                padding: 0;
                font-size: 0.9em;
                color: #e2e8f0;
                text-shadow: none;
              }
            }

            /deep/ code {
              font-family: 'Fira Code', monospace;
              background: rgba(0, 0, 0, 0.05);
              padding: 0.2em 0.4em;
              border-radius: 3px;
              font-size: 0.9em;
            }

            /deep/ blockquote {
              margin: 1em 0;
              padding: 0.5em 1em;
              color: #6b7280;
              border-left: 4px solid @border-color;
              background: rgba(251, 113, 133, 0.05);
            }

            /deep/ ul,
            /deep/ ol {
              margin: 1em 0;
              padding-left: 2em;
            }

            /deep/ li {
              margin: 0.5em 0;
            }

            /deep/ p {
              margin: 1em 0;
            }

            /deep/ h1,
            /deep/ h2,
            /deep/ h3,
            /deep/ h4,
            /deep/ h5,
            /deep/ h6 {
              margin: 1em 0;
              font-weight: 600;
            }

            /deep/ h1 {
              font-size: 2em;
              border-bottom: 1px solid @border-color;
              padding-bottom: 0.3em;
            }

            /deep/ h2 {
              font-size: 1.5em;
              border-bottom: 1px solid @border-color;
              padding-bottom: 0.3em;
            }

            /deep/ h3 {
              font-size: 1.17em;
            }

            /deep/ img {
              max-width: 100%;
              height: auto;
              border-radius: 6px;
              margin: 1em 0;
            }

            /deep/ a {
              color: @primary-color;
              text-decoration: none;

              &:hover {
                text-decoration: underline;
              }
            }

            /deep/ hr {
              border: none;
              border-top: 1px solid @border-color;
              margin: 1em 0;
            }
          }
        }
      }
    }
  }

  .input-container {
    padding: @spacing-lg;
    border-top: 1px solid @border-color;
    background: @bg-gradient-header;
    position: relative;
    z-index: 1;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(
        to right,
        transparent,
        @primary-color,
        transparent
      );
      opacity: 0.3;
    }

    .el-input {
      margin-bottom: @spacing-lg;
    }
  }

  .button-container {
    display: flex;
    gap: @spacing-md;
    justify-content: flex-end;
    padding: 0 @spacing-sm;
    margin-top: @spacing-md;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/deep/ .el-input__inner {
  border-radius: @radius-md;
  padding: @spacing-md;
  font-size: @text-md;
  line-height: 1.6;
  transition: @transition;
  border: 1px solid @border-color;
  background: @bg-glass;

  &:hover,
  &:focus {
    border-color: @primary-color !important;
    box-shadow: 0 0 0 2px rgba(192, 28, 32, 0.1) !important;
    transform: translateY(-1px);
  }
}

/deep/ .el-textarea__inner {
  border-radius: @radius-md;
  padding: @spacing-md;
  font-size: @text-md;
  line-height: 1.6;
  transition: @transition;
  border: 1px solid @border-color;
  background: @bg-glass;

  &:hover,
  &:focus {
    border-color: @primary-color !important;
    box-shadow: 0 0 0 2px rgba(192, 28, 32, 0.1) !important;
    transform: translateY(-1px);
  }
}

/deep/ .el-button {
  padding: @spacing-md @spacing-lg;
  font-weight: 500;
  border-radius: @radius-md;
  transition: @transition-bounce;
  display: flex;
  align-items: center;
  gap: @spacing-xs;
  min-width: 100px;
  justify-content: center;

  &:hover {
    transform: translateY(-1px);
    box-shadow: @shadow-sm;
  }

  &:active {
    transform: translateY(0);
  }

  &.el-button--primary {
    background: @bg-gradient-button;
    border: none;

    &:hover {
      background: linear-gradient(
        135deg,
        darken(@primary-color, 5%) 0%,
        darken(@primary-dark, 5%) 100%
      );
    }
  }

  &.el-button--danger {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    border: none;

    &:hover {
      background: linear-gradient(
        135deg,
        darken(#ef4444, 5%) 0%,
        darken(#dc2626, 5%) 100%
      );
    }
  }

  &.el-button--default {
    border: 1px solid @border-color;
    background: @bg-glass;
    color: @primary-color;

    &:hover {
      border-color: @primary-color;
      color: @primary-color;
      background: @primary-light;
    }
  }
}

/deep/ .el-select {
  width: 180px;

  .el-input {
    display: flex;
    align-items: center;
  }

  .el-input__prefix {
    display: flex;
    align-items: center;
    height: 100%;
    left: 10px;
  }

  .el-input__inner {
    padding-left: 35px;
    background: @bg-glass;

    &:focus {
      border-color: @primary-color !important;
      box-shadow: 0 0 0 2px rgba(192, 28, 32, 0.1) !important;
    }
  }
}

/deep/ .el-select-dropdown {
  border: 1px solid @border-color !important;
  background: @bg-glass !important;
  backdrop-filter: blur(8px);

  .el-select-dropdown__item {
    display: flex !important;
    align-items: center !important;
    gap: @spacing-xs;
    padding: @spacing-xs @spacing-md !important;
    transition: @transition !important;
    color: @text-color !important;

    &.hover,
    &:hover {
      background: @primary-light !important;
      color: @primary-color !important;
    }

    &.selected {
      background: @primary-light !important;
      color: @primary-color !important;
      font-weight: bold !important;
    }

    i {
      color: @primary-color !important;
      margin-right: @spacing-xs;
    }
  }
}

.model-select {
  /deep/ .el-input__prefix {
    color: @primary-color;
  }
}

/* 自定义滚动条样式 */
.messages {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: @primary-light;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: @border-color;
    border-radius: 3px;
    transition: @transition;

    &:hover {
      background: @primary-color;
    }
  }
}
</style>