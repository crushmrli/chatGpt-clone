<template>
  <div class="history-sidebar">
    <div class="sidebar-header">
      <h3><i class="el-icon-chat-dot-round"></i> 历史记录</h3>
      <el-input v-model="searchQuery"
                placeholder="搜索对话..."
                prefix-icon="el-icon-search"
                clearable
                class="search-input" />
    </div>

    <div class="loading"
         v-if="loading">
      <el-skeleton :rows="3"
                   animated />
    </div>

    <div class="error"
         v-else-if="error">
      <el-alert :title="error"
                type="error"
                :closable="false"
                show-icon />
    </div>

    <div class="conversations-list"
         v-else>
      <div v-for="conversation in filteredConversations"
           :key="conversation.id"
           :class="['conversation-item', { active: isActive(conversation) }]"
           @click="handleSelectConversation(conversation)">
        <div class="conversation-title">
          <i class="el-icon-document"></i>
          {{ conversation.title }}
        </div>
        <div class="conversation-time">
          <i class="el-icon-time"></i>
          {{ formatTime(conversation.timestamp) }}
        </div>
        <el-button type="text"
                   class="delete-btn"
                   icon="el-icon-delete"
                   @click.stop="handleDeleteConversation(conversation)">
        </el-button>
      </div>
      <div v-if="filteredConversations.length === 0"
           class="no-results">
        <i class="el-icon-warning-outline"></i>
        没有找到相关对话
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import '@/styles/theme.less'

export default {
  name: 'HistorySidebar',
  data() {
    return {
      error: null,
      searchQuery: '',
    }
  },
  computed: {
    ...mapState('conversations', [
      'conversations',
      'currentConversation',
      'loading',
    ]),
    filteredConversations() {
      if (!this.searchQuery) {
        return this.conversations
      }
      const query = this.searchQuery.toLowerCase()
      return this.conversations.filter((conversation) => {
        return (
          conversation.title.toLowerCase().includes(query) ||
          (conversation.messages &&
            conversation.messages.some((msg) =>
              msg.content.toLowerCase().includes(query)
            ))
        )
      })
    },
  },
  methods: {
    ...mapActions('conversations', [
      'loadConversations',
      'loadConversation',
      'deleteConversation',
    ]),
    isActive(conversation) {
      return this.currentConversation?.id === conversation.id
    },
    formatTime(timestamp) {
      const date = new Date(timestamp)
      return date.toLocaleString()
    },
    async handleSelectConversation(conversation) {
      try {
        this.error = null
        await this.loadConversation(conversation.id)
      } catch (error) {
        this.error = '加载会话详情失败'
        console.error(error)
      }
    },
    async handleDeleteConversation(conversation) {
      try {
        this.error = null
        await this.deleteConversation(conversation.id)
        this.$emit('conversation-deleted')
      } catch (error) {
        this.error = '删除会话失败'
        console.error(error)
      }
    },
  },
  async created() {
    try {
      this.error = null
      await this.loadConversations()
    } catch (error) {
      this.error = '加载会话列表失败'
      console.error(error)
    }
  },
}
</script>

<style lang="less" scoped>
@import '@/styles/theme.less';

.history-sidebar {
  width: 300px;
  height: 100%;
  background: @bg-gradient;
  border-right: 1px solid @border-color;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C01C20' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.5;
    pointer-events: none;
  }

  .sidebar-header {
    padding: @spacing-lg;
    border-bottom: 1px solid @border-color;
    .glass-effect();

    h3 {
      color: @primary-color;
      margin: 0 0 @spacing-md 0;
      font-size: 1.25rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: @spacing-xs;

      i {
        font-size: 1.4rem;
      }
    }
  }

  .search-input {
    margin-top: @spacing-md;

    /deep/ .el-input__inner {
      height: 36px;
      line-height: 36px;
      border-radius: @radius-md;
      background: @bg-glass;
      border: 1px solid @border-color;
      color: @text-color;
      padding-left: 35px;

      &::placeholder {
        color: @text-secondary;
      }

      &:focus {
        border-color: @primary-color;
        box-shadow: 0 0 0 2px rgba(192, 28, 32, 0.1);
      }
    }

    /deep/ .el-input__prefix {
      left: 10px;
      height: 36px;
      line-height: 36px;
      color: @primary-color;

      i {
        font-size: 16px;
      }
    }
  }

  .loading {
    padding: @spacing-lg;
  }

  .error {
    padding: @spacing-lg;
  }

  .conversations-list {
    flex: 1;
    overflow-y: auto;
    padding: @spacing-md;

    .conversation-item {
      padding: @spacing-md;
      margin-bottom: @spacing-sm;
      border-radius: @radius-md;
      cursor: pointer;
      transition: @transition-base;
      .glass-effect();
      padding-right: 40px;
      display: flex;
      flex-direction: column;
      gap: @spacing-xs;

      &:hover {
        .hover-lift();
      }

      &.active {
        background: @primary-light;
        border: 1px solid @primary-color;
      }

      .conversation-title {
        color: @text-color;
        font-weight: 500;
        margin-bottom: @spacing-xs;
      }

      .conversation-time {
        color: @text-secondary;
        font-size: 0.875rem;
      }
    }
  }

  .no-results {
    text-align: center;
    color: #909399;
    padding: @spacing-xl;
    font-size: @text-sm;
    background: @bg-glass;
    border-radius: @radius-md;
    border: 1px dashed @border-color;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: @spacing-xs;
    animation: fadeIn 0.3s ease-out;

    i {
      font-size: 2rem;
      color: @primary-color;
      animation: float 3s ease-in-out infinite;
    }
  }
}

.conversation-item {
  padding: @spacing-md;
  border-radius: @radius-md;
  margin-bottom: @spacing-xs;
  cursor: pointer;
  transition: @transition;
  border: 1px solid @border-color;
  position: relative;
  background: @bg-glass;
  box-shadow: @shadow-sm;
  animation: itemAppear 0.3s ease-out;
  padding-right: 40px;
  display: flex;
  flex-direction: column;
  gap: @spacing-xs;

  &:hover {
    background-color: @primary-light;
    transform: translateY(-1px);
    box-shadow: @shadow-hover;

    .delete-btn {
      opacity: 1;
      visibility: visible;
    }
  }

  &.active {
    background: @bg-gradient-header;
    border-color: @primary-color;
    box-shadow: @shadow-md;
  }
}

@keyframes itemAppear {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.conversation-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: @spacing-xs;
  padding-right: 2rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: @spacing-xs;

  i {
    color: @primary-color;
    font-size: 1.1rem;
    transition: @transition;
  }
}

.conversation-item:hover .conversation-title i {
  transform: scale(1.2);
}

.conversation-time {
  font-size: @text-xs;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: @spacing-xs;

  i {
    font-size: @text-md;
    color: @primary-color;
    opacity: 0.7;
  }
}

.delete-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: @primary-color;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: @radius-sm;
  background: @bg-glass;
  border: 1px solid @border-color;
  z-index: 1;

  &:hover {
    color: @primary-dark;
    background-color: @primary-light;
    border-color: @primary-color;
  }

  i {
    font-size: 14px;
    line-height: 1;
  }
}

.conversation-item:hover .delete-btn {
  opacity: 1;
  visibility: visible;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 自定义滚动条样式 */
.conversations-list {
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