<template>
  <div class="markdown-content"
       v-html="finalContent"></div>
</template>

<script>
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

// 配置 marked
marked.setOptions({
  highlight: function (code, lang) {
    // 如果是 markdown 语言，直接返回原始内容
    if (lang === 'markdown') {
      return code
    }

    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (e) {
        console.error(e)
      }
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true,
  tables: true,
  headerIds: false,
  mangle: false,
})

// 配置代码高亮
hljs.configure({
  languages: [
    'javascript',
    'python',
    'java',
    'cpp',
    'html',
    'css',
    'bash',
    'json',
  ],
})

export default {
  name: 'MarkdownRenderer',
  props: {
    content: {
      type: String,
      required: true,
    },
    preRendered: {
      type: String,
      default: null,
    },
  },
  computed: {
    finalContent() {
      if (this.preRendered) {
        return this.preRendered
      }

      if (!this.content || typeof this.content !== 'string') {
        return ''
      }

      try {
        // 处理特殊格式的 markdown 内容
        let processedContent = this.content
          .replace(/\\n/g, '\n') // 将 \n 转换为实际的换行符
          .replace(/```markdown\n([\s\S]*?)```/g, '$1') // 移除 markdown 代码块包裹

        // 预处理代码块
        processedContent = processedContent.replace(
          /```(\w+)?\n([\s\S]*?)```/g,
          (match, lang, code) => {
            const language = lang || 'plaintext'
            const highlightedCode = hljs.highlight(code.trim(), {
              language,
            }).value
            return `<div class="code-block">
              <div class="code-block-header">${language}</div>
              <pre><code class="hljs language-${language}">${highlightedCode}</code></pre>
            </div>`
          }
        )

        // 处理行内代码
        processedContent = processedContent.replace(
          /`([^`]+)`/g,
          '<code class="inline-code">$1</code>'
        )

        // 使用 marked 处理其他 Markdown 语法
        return marked(processedContent)
      } catch (e) {
        console.error('Markdown parsing error:', e)
        return this.content
      }
    },
  },
}
</script>

<style lang="less" scoped>
@import '@/styles/theme.less';

.markdown-content {
  font-size: 14px;
  line-height: 1.6;
  color: #374151;

  /deep/ table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;

    th,
    td {
      border: 1px solid #e5e7eb;
      padding: 0.5em 1em;
      text-align: left;
    }

    th {
      background: #f9fafb;
    }
  }

  /deep/ pre {
    margin: 1em 0;
    padding: 1em;
    overflow: auto;
    background: #f1f5f9;
    border-radius: 6px;

    code {
      background: none;
      padding: 0;
      font-size: 0.9em;
      color: #374151;
      text-shadow: none;
    }
  }

  /deep/ code {
    font-family: Consolas, Monaco, 'Andale Mono', monospace;
    background: #f1f5f9;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }

  /deep/ blockquote {
    margin: 1em 0;
    padding: 0.5em 1em;
    color: #6b7280;
    border-left: 4px solid #e5e7eb;
    background: #f9fafb;
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
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0.3em;
  }

  /deep/ h2 {
    font-size: 1.5em;
    border-bottom: 1px solid #e5e7eb;
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
    color: #3b82f6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  /deep/ hr {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 1em 0;
  }

  /deep/ input[type='checkbox'] {
    margin-right: 0.5em;
  }

  /deep/ .code-block {
    margin: 1em 0;
    border-radius: 6px;
    overflow: hidden;
    background: #f1f5f9;

    .code-block-header {
      padding: 0.5em 1em;
      background: #e5e7eb;
      color: #374151;
      font-size: 0.9em;
      font-family: Consolas, Monaco, 'Andale Mono', monospace;
    }

    pre {
      margin: 0;
      padding: 1em;
      background: none;
      border-radius: 0;

      code {
        background: none;
        padding: 0;
        font-size: 0.9em;
        color: #374151;
        text-shadow: none;
      }
    }
  }

  /deep/ .inline-code {
    font-family: Consolas, Monaco, 'Andale Mono', monospace;
    background: #f1f5f9;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }
}
</style>