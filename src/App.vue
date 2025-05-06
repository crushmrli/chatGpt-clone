<template>
  <div id="app">
    <chat-window class="main-content" />
  </div>
</template>

<script>
import ChatWindow from './components/ChatWindow.vue'

export default {
  name: 'App',
  components: {
    ChatWindow,
  },
}
</script>

<style lang="less">
@import './styles/theme.less';

#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100vh;
  margin: 0;
  padding: 0;
}

/* 全局样式重置 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--background-color);
}

/* Element UI 样式覆盖 */
.el-button {
  font-weight: 500;
}

.el-input__inner {
  font-size: 14px;
}

.el-select {
  width: 100%;
}

/* 覆盖 Element UI 的默认颜色 */
.el-select-dropdown__item {
  &.selected {
    color: @primary-color !important;
  }
  &:hover,
  &.hover {
    background-color: @primary-light !important;
    color: @primary-color !important;
  }
}

.el-select {
  .el-input {
    &.is-focus .el-input__inner {
      border-color: @primary-color !important;
    }
    .el-input__inner {
      &:focus,
      &:hover {
        border-color: @primary-color !important;
      }
    }
  }
}

.el-select-dropdown {
  border-color: @border-color !important;
  .el-select-dropdown__item {
    &.selected {
      color: @primary-color !important;
      background-color: @primary-light !important;
    }
  }
}
</style>
