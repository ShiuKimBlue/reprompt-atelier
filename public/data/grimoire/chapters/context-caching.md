# 上下文缓存（Context Caching）

Google 推出了上下文缓存功能，可通过 Gemini API 在 Gemini 1.5 Pro 和 Gemini 1.5 Flash 模型中使用。

## 应用场景：分析一年的 ML 论文

以下示例展示了如何将上下文缓存应用于分析过去一年的 ML 论文摘要。这些摘要记录在 [ML-Papers-of-the-Week](https://github.com/dair-ai/ML-Papers-of-the-Week) GitHub 仓库中。摘要存储在文本文件中，通过 Gemini 1.5 Flash 进行高效查询。

相关视频教程：[Context Caching with Gemini](https://youtu.be/987Pd89EDPs?si=j43isgNb0uwH5AeI)

## 流程：上传、缓存和查询

### 1. 数据准备

将包含摘要的 readme 文件转换为纯文本格式。

### 2. 使用 Gemini API 上传

使用 Google `generativeai` 库上传文本文件。

### 3. 实现上下文缓存

通过 `caching.CachedContent.create()` 创建缓存，需要以下组件：

- 指定 Gemini Flash 1.5 模型
- 提供缓存名称
- 定义系统指令（例如："你是一位专业的 AI 研究员..."）
- 设置 TTL（例如 15 分钟）

### 4. 创建模型实例

使用缓存内容构建生成模型实例。

### 5. 查询

可以使用自然语言提问，例如：

- "你能告诉我本周最新的 AI 论文吗？"
- "你能列出提到 Mamba 的论文吗？"
- "关于长上下文 LLM 有哪些创新？"

结果表明模型能够"准确地从文本文件中检索和摘要信息"。上下文缓存消除了每次查询都需要重新发送整个文本文件的问题。

## 对研究人员的好处

- 快速分析和查询大型研究数据集
- 无需手动搜索文档即可检索特定发现
- 进行交互式会话而不浪费提示 tokens

上下文缓存的进一步应用场景令人期待，特别是在更复杂的场景中，如智能体工作流。

## 相关资源

- [Gemini API 缓存文档](https://ai.google.dev/gemini-api/docs/caching?lang=python)
- [Context Caching Notebook](https://github.com/dair-ai/Prompt-Engineering-Guide/blob/main/notebooks/gemini-context-caching.ipynb)
