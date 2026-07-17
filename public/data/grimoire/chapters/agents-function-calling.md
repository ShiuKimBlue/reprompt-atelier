# AI 智能体中的函数调用

函数调用（也称为工具调用）是驱动现代基于 LLM 的智能体的核心能力之一。理解函数调用在幕后的工作原理对于构建有效的 AI 智能体以及在出错时进行调试至关重要。

## 主题

* [什么是函数调用？](#什么是函数调用)
* [函数调用如何驱动 AI 智能体](#函数调用如何驱动-ai-智能体)
* [工具定义的作用](#工具定义的作用)
* [智能体循环：操作和观察](#智能体循环操作和观察)
* [调试函数调用](#调试函数调用)
* [工具定义的最佳实践](#工具定义的最佳实践)

## 什么是函数调用？

从本质上讲，函数调用使 LLM 能够与外部工具、API 和知识库交互。当 LLM 接收到需要其训练数据之外的信息或操作的查询时，它可以决定调用外部函数来检索该信息或执行该操作。

考虑一个简单的示例：如果您问 AI 智能体"巴黎的天气怎么样？"，LLM 本身无法准确回答这个问题，因为它没有访问实时天气数据的权限。但是，通过函数调用，LLM 可以识别它需要调用天气 API，生成带有正确参数（在本例中为城市"巴黎"）的适当函数调用，然后使用返回的数据来制定响应。

这种能力将基本的 LLM 从文本生成器转变为可以与现实世界交互的强大智能体。

## 函数调用如何驱动 AI 智能体

![function calling flow](/images/grimoire/function-calling-flow.png)

基于 LLM 的智能体依赖两个关键能力来解决复杂任务：工具调用和推理。这些能力允许智能体通过外部工具进行增强，连接到 MCP（模型上下文协议）服务器，并访问知识库。

函数调用流程如下：

1. **用户查询**：用户向智能体发送请求（例如"巴黎的天气怎么样？"）
2. **上下文组装**：系统消息、工具定义和用户消息组合形成发送给模型的完整上下文
3. **工具决策**：LLM 分析上下文并确定是否需要调用工具。如果是，它输出一个结构化响应，指示要调用哪个工具以及使用什么参数
4. **工具执行**：开发者的代码接收工具调用请求并执行实际函数（例如调用天气 API）
5. **观察**：工具返回其结果，这成为智能体术语中的"观察"
6. **响应生成**：观察与所有先前的消息一起传回模型，使其能够生成最终响应

这里的关键洞察是，模型始终保持对话中发生的所有事情的完整上下文。这种上下文感知使智能体能够做出关于下一步该做什么以及如何将工具结果整合到最终响应中的智能决策。

## 工具定义的作用

工具定义可以说是函数调用中最关键的组件。它们是 LLM 知道哪些工具可用以及何时使用它们的唯一方式。

工具定义通常包括：

* **名称**：函数的清晰标识符
* **描述**：工具功能的说明以及使用时机
* **参数**：函数接受的输入，包括类型和描述

以下是天气工具定义的示例：

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location. Use this when the user asks about weather conditions in a specific city or region.",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "The temperature unit to use"
                    }
                },
                "required": ["location"]
            }
        }
    }
]
```

描述字段尤其重要。它帮助模型理解的不仅是工具的功能，还有何时应该使用它。当您有多个可用工具时，清晰且具体的描述对于模型做出正确的工具选择变得更加关键。

> 💡 工具定义会成为每次 LLM 调用上下文的一部分。这意味着它们会消耗 token 并影响成本和延迟。在工具定义中要简洁但有描述性。

## 智能体循环：操作和观察

理解智能体循环对于调试和优化 AI 智能体至关重要。该循环由重复的周期组成：

1. **操作**：智能体决定采取行动（调用工具）
2. **环境响应**：外部工具或 API 返回结果
3. **观察**：智能体接收并处理结果
4. **决策**：智能体决定是否采取另一个操作或响应用户

让我们通过一个具体示例来追踪。当您问智能体"OpenAI 的最新新闻"时，会发生以下情况：

```
User: "Latest news from OpenAI"

Agent thinks: I need current information about OpenAI news.
              I should use the web_search tool.

Action: web_search(query="OpenAI latest news announcements")

Observation: [Search results with recent OpenAI articles...]

Agent thinks: I now have the information needed to answer.
              Let me summarize these results for the user.

Response: "Here are the latest updates from OpenAI..."
```

观察就是环境（在本例中为搜索引擎或 API）在智能体操作后返回的内容。此观察成为下一次迭代上下文的一部分，使智能体能够在其所学到的基础上继续构建。

在更复杂的场景中，智能体可能需要多次工具调用才能回答问题。每次调用都会增加上下文，智能体使用这些累积的知识来决定下一步该做什么。

## 调试函数调用

构建 AI 智能体时，您不可避免地会遇到智能体行为不符合预期的情况。也许它调用了错误的工具、传递了不正确的参数，或者在应该调用工具时未能调用。这就是理解函数调用内部原理变得非常有价值的地方。

在 n8n 等工作流自动化工具中，您可以启用"返回中间步骤"来查看幕后发生的情况。这将显示：

* **调用了哪些工具**：工具调用的顺序
* **传递的参数**：发送给每个工具的确切参数
* **收到的观察**：每个工具返回的内容
* **Token 使用量**：每一步消耗了多少 token

以下是研究查询的中间步骤示例：

```json
{
  "intermediateSteps": [
    {
      "action": {
        "tool": "web_search",
        "toolInput": {
          "query": "OpenAI latest announcements 2025"
        }
      },
      "observation": "1. OpenAI announces new reasoning model... 2. GPT-5 rumors surface..."
    },
    {
      "action": {
        "tool": "update_task_status",
        "toolInput": {
          "taskId": "search_1",
          "status": "completed"
        }
      },
      "observation": "Task updated successfully"
    }
  ]
}
```

这种可见性对于调试至关重要。如果您的智能体产生了不正确的结果，您可以追踪每一步以识别问题出在哪里。常见问题包括：

* **不正确的工具选择**：模型为任务选择了错误的工具
* **错误的参数**：模型传递了不正确或不完整的参数
* **缺少上下文**：工具定义没有提供足够的指导
* **观察处理**：模型误解了工具的响应

> ⚠️ 某些平台可能由于抽象层而不暴露完整的提示上下文。调试时，尝试尽可能接近原始 API 调用，以准确了解模型接收到的上下文。

## 工具定义的最佳实践

基于构建智能体的实践经验，以下是有效工具定义的关键建议：

**描述要具体**

不要使用"搜索网络"，而使用"搜索网络获取当前信息。当用户询问可能自训练以来已更改的近期事件、新闻或数据时使用此工具。"

**在系统提示词中包含使用上下文**

虽然工具定义包含描述，但在系统提示词中添加关于何时以及如何使用工具的显式指导可提供额外的上下文。这看似重复，但它有助于 LLM 做出更好的决策，特别是在有多个工具的情况下。

```
You have access to the following tools:
- web_search: Use this for any questions about current events or recent information
- calculator: Use this for mathematical calculations
- knowledge_base: Use this to search internal documentation

Always prefer the knowledge_base for company-specific questions before using web_search.
```

**定义清晰的参数约束**

尽可能使用枚举来约束参数值。在描述中提供示例以指导模型。

```json
"unit": {
    "type": "string",
    "enum": ["celsius", "fahrenheit"],
    "description": "Temperature unit. Use 'celsius' for most countries, 'fahrenheit' for US."
}
```

**优雅地处理工具故障**

您的工具应返回信息丰富的错误消息，帮助智能体恢复或尝试替代方法。

```python
def search_database(query: str) -> str:
    results = db.search(query)
    if not results:
        return "No results found for this query. Try broadening your search terms or using alternative keywords."
    return format_results(results)
```

---

函数调用是 LLM 推理和现实世界操作之间的桥梁。通过理解工具定义如何影响模型的决策、智能体循环如何处理操作和观察，以及如何调试整个流程，您将能够构建稳健的 AI 智能体，有效利用外部工具来解决复杂问题。
