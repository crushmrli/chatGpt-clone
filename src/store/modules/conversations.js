import apiService from "@/services/api";

const state = {
  conversations: [],
  currentConversation: null,
  loading: false,
};

const mutations = {
  SET_CONVERSATIONS(state, conversations) {
    state.conversations = conversations;
  },
  SET_CURRENT_CONVERSATION(state, conversation) {
    state.currentConversation = conversation;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
};

const actions = {
  async loadConversations({ commit }) {
    try {
      commit("SET_LOADING", true);
      const conversations = await apiService.getConversations();
      commit("SET_CONVERSATIONS", conversations);
    } catch (error) {
      console.error("加载会话列表失败:", error);
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async loadConversation({ commit, dispatch }, conversationId) {
    try {
      commit("SET_LOADING", true);
      const conversation = await apiService.getConversationDetail(
        conversationId
      );
      commit("SET_CURRENT_CONVERSATION", conversation);
      await dispatch("chat/SET_MESSAGES", conversation.messages, {
        root: true,
      });
      return conversation;
    } catch (error) {
      console.error("加载会话详情失败:", error);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async deleteConversation({ commit }, conversationId) {
    try {
      commit("SET_LOADING", true);
      await apiService.deleteConversation(conversationId);
      // 重新加载会话列表
      await this.dispatch("conversations/loadConversations");
    } catch (error) {
      console.error("删除会话失败:", error);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  startNewChat({ commit }) {
    commit("SET_CURRENT_CONVERSATION", null);
    commit("chat/CLEAR_MESSAGES", null, { root: true });
  },
};

const getters = {
  conversations: (state) => state.conversations,
  currentConversation: (state) => state.currentConversation,
  loading: (state) => state.loading,
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
