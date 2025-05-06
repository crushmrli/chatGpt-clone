import Vue from "vue";
import Vuex from "vuex";
import chat from "./modules/chat";
import conversations from "./modules/conversations";

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    chat,
    conversations,
  },
});

// 初始化时加载会话历史
store.dispatch("conversations/loadConversations");

export default store;
