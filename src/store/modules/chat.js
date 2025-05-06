import apiService from "@/services/api";
import { models, defaultModel } from "@/config/models";
import marked from "marked";

const state = {
  messages: [],
  currentResponse: "",
  isTyping: false,
  selectedModel: defaultModel,
  availableModels: models,
  abortController: null,
  currentChatId: null,
};

const mutations = {
  ADD_MESSAGE(state, message) {
    console.log("添加消息:", message);
    state.messages.push(message);
  },
  UPDATE_MESSAGE(state, { index, message }) {
    console.log("更新消息:", { index, message });
    state.messages.splice(index, index >= 0 ? 1 : 0, message);
  },
  SET_CURRENT_RESPONSE(state, response) {
    console.log("设置当前响应:", response);
    state.currentResponse = response;
  },
  SET_IS_TYPING(state, isTyping) {
    console.log("设置输入状态:", isTyping);
    state.isTyping = isTyping;
  },
  SET_SELECTED_MODEL(state, model) {
    state.selectedModel = model;
  },
  CLEAR_MESSAGES(state) {
    state.messages = [];
  },
  SET_MESSAGES(state, messages) {
    state.messages = messages;
  },
  setAbortController(state, controller) {
    if (state.abortController) {
      state.abortController.abort();
    }
    state.abortController = controller;
    if (!controller) {
      state.isTyping = false;
      state.currentResponse = "";
      // 清理临时消息
      const tempIndex = state.messages.findIndex((msg) => msg.isTemp);
      if (tempIndex !== -1) {
        state.messages.splice(tempIndex, 1);
      }
    }
  },
  SET_CURRENT_CHAT_ID(state, chatId) {
    state.currentChatId = chatId;
  },
};

const actions = {
  async sendMessage({ commit, state }, { message, onProgress }) {
    // 添加用户消息
    commit("ADD_MESSAGE", {
      role: "user",
      content: message,
    });

    // 设置正在输入状态
    commit("SET_IS_TYPING", true);
    commit("SET_CURRENT_RESPONSE", "");

    try {
      const abortController = new AbortController();
      commit("setAbortController", abortController);

      // 添加一个临时的助手消息
      const tempMessage = {
        role: "assistant",
        content: "",
        isTemp: true,
      };
      commit("ADD_MESSAGE", tempMessage);

      // 获取或生成新的 chatId
      let chatId = state.currentChatId;
      if (!chatId) {
        chatId = apiService.generateChatId();
        commit("SET_CURRENT_CHAT_ID", chatId);
      }

      await apiService.sendMessageWithStream(
        message,
        state.selectedModel,
        (data) => {
          if (!state.messages) return;

          console.log("Vuex 收到的数据:", data);

          // 调用传入的 onProgress 回调
          if (onProgress) {
            onProgress(data);
          }

          // 确保数据格式正确
          if (!data.choices || !data.choices[0] || !data.choices[0].delta) {
            console.warn("Invalid data format:", data);
            return;
          }

          const delta = data.choices[0].delta;

          if (delta.content) {
            const content = delta.content;
            tempMessage.content += content;
            commit("SET_CURRENT_RESPONSE", tempMessage.content);

            // 更新临时消息
            const messageIndex = state.messages.findIndex((msg) => msg.isTemp);
            if (messageIndex !== -1) {
              commit("UPDATE_MESSAGE", {
                index: messageIndex,
                message: { ...tempMessage },
              });
            }
          }

          if (delta.reasoning_content) {
            const reasoning = delta.reasoning_content;
            if (!tempMessage.reasoning) {
              tempMessage.reasoning = "";
            }
            tempMessage.reasoning += reasoning;

            // 更新临时消息
            const messageIndex = state.messages.findIndex((msg) => msg.isTemp);
            if (messageIndex !== -1) {
              commit("UPDATE_MESSAGE", {
                index: messageIndex,
                message: { ...tempMessage },
              });
            }
          }
        },
        abortController.signal,
        chatId
      );

      // 移除临时标记
      if (state.messages) {
        const finalMessage = {
          ...tempMessage,
          content: tempMessage.content.trim(), // 确保内容被正确处理
          isTemp: false,
          // 确保 Markdown 内容被正确保存
          rawContent: tempMessage.content.trim(), // 保存原始内容
          renderedContent: marked(tempMessage.content.trim()), // 预渲染 Markdown
        };

        console.log("最终保存的消息:", finalMessage);

        const messageIndex = state.messages.findIndex((msg) => msg.isTemp);
        if (messageIndex !== -1) {
          commit("UPDATE_MESSAGE", {
            index: messageIndex,
            message: finalMessage,
          });
        }
      }
    } catch (error) {
      console.error("发送消息时出错:", error);
      // 如果是中止请求，则移除临时消息
      if (error.name === "AbortError") {
        const messageIndex = state.messages.findIndex((msg) => msg.isTemp);
        if (messageIndex !== -1) {
          state.messages.splice(messageIndex, 1);
        }
        return; // 中止请求不需要显示错误消息
      }
      // 添加错误消息
      const errorMessage = {
        role: "assistant",
        content: error.message || "抱歉，发生了错误。请重试。",
        error: true,
      };

      // 更新或添加错误消息
      const tempIndex = state.messages.findIndex((msg) => msg.isTemp);
      if (tempIndex !== -1) {
        commit("UPDATE_MESSAGE", {
          index: tempIndex,
          message: errorMessage,
        });
      } else {
        commit("ADD_MESSAGE", errorMessage);
      }

      throw error;
    } finally {
      commit("SET_IS_TYPING", false);
      commit("SET_CURRENT_RESPONSE", "");
      commit("setAbortController", null);
    }
  },

  startNewChat({ commit }) {
    commit("CLEAR_MESSAGES");
    const newChatId = apiService.generateChatId();
    commit("SET_CURRENT_CHAT_ID", newChatId);
  },
};

const getters = {
  displayMessages: (state) => {
    // 过滤掉临时消息，只显示最新的临时消息
    const messages = state.messages.filter((msg) => !msg.isTemp);
    const lastTempMessage = state.messages.find((msg) => msg.isTemp);
    if (lastTempMessage) {
      messages.push(lastTempMessage);
    }
    return messages;
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
