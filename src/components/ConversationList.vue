<template>
  <div class="conversation-list">
    <div class="conversation-header">
      <h3>历史对话</h3>
    </div>
    <div class="conversation-items">
      <div v-for="conversation in conversations"
           :key="conversation.id"
           class="conversation-item"
           :class="{ active: isActive(conversation) }"
           @click="loadConversation(conversation)">
        <div class="conversation-title">{{ conversation.title }}</div>
        <div class="conversation-time">{{ conversation.timestamp }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConversationList',
  computed: {
    conversations() {
      return this.$store.getters.getConversations
    },
    currentConversation() {
      return this.$store.getters.getChatHistory
    },
  },
  methods: {
    isActive(conversation) {
      return (
        this.currentConversation.length > 0 &&
        conversation.messages[0].content === this.currentConversation[0].content
      )
    },
    loadConversation(conversation) {
      this.$store.dispatch('loadConversation', conversation)
    },
  },
}
</script>

<style scoped>
.conversation-list {
  width: 250px;
  height: 100%;
  background-color: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.conversation-header {
  padding: 16px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
}

.conversation-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.conversation-items {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conversation-item {
  padding: 12px;
  margin-bottom: 8px;
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.conversation-item:hover {
  background-color: #f0f0f0;
}

.conversation-item.active {
  background-color: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.conversation-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-time {
  font-size: 12px;
  color: #999;
}
</style>