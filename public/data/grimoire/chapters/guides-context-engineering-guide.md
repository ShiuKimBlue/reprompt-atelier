# 上下文工程指南

## 目录

- [什么是上下文工程？](#什么是上下文工程)
- [上下文工程实战](#上下文工程实战)
  - [系统提示词](#系统提示词)
  - [指令](#指令)
  - [用户输入](#用户输入)
  - [结构化输入和输出](#结构化输入和输出)
  - [工具](#工具)
  - [RAG 和记忆](#rag-和记忆)
  - [状态和历史上下文](#状态和历史上下文)
- [高级上下文工程](#高级上下文工程)
- [资源](#资源)

## 什么是上下文工程？

几年前，许多人，甚至顶级 AI 研究人员，都声称提示工程到现在已经死了。

显然，他们大错特错了，事实上，提示工程现在比以往任何时候都更加重要。它如此重要，以至于现在被重新品牌化为 _**上下文工程**_。

是的，又一个花哨的术语来描述调整指令和相关上下文的重要过程，这些指令和上下文是 LLM 有效执行任务所需的。

已经有很多关于上下文工程的文章（[Ankur Goyal](https://x.com/ankrgyl/status/1913766591910842619)、[Walden Yan](https://cognition.ai/blog/dont-build-multi-agents)、[Tobi Lutke](https://x.com/tobi/status/1935533422589399127) 和 [Andrej Karpathy](https://x.com/karpathy/status/1937902205765607626)），但我想写一下我对这个主题的看法，并向您展示一个具体的分步指南，将上下文工程付诸实践。

我不完全确定是谁创造了上下文工程，但我们将基于 [Dex Horthy](https://x.com/dexhorthy/status/1933283008863482067) 的这张图表来构建，该图表简要解释了上下文工程是什么。

![context engineering diagram](/images/grimoire/context-engineering-diagram.jpg)

我喜欢上下文工程这个术语，因为它感觉是一个更广泛的术语，更好地解释了提示工程中的大部分工作，包括其他相关任务。

对提示工程是否是一项严肃技能的质疑在于，许多人将其与盲目提示（您在 ChatGPT 等 LLM 中使用的简短任务描述）混淆。在盲目提示中，您只是向系统提问。在提示工程中，您必须更仔细地思考提示的上下文和结构。也许它从一开始就应该被称为上下文工程。

上下文工程是下一个阶段，在这个阶段您构建完整的上下文，在许多情况下需要超越简单提示，进入更严格的方法来获取、增强和优化系统的知识。

从开发者的角度来看，上下文工程涉及一个迭代过程，用于优化指令和您提供给 LLM 的上下文以达到期望的结果。这包括有正式流程（例如评估管道）来衡量您的策略是否有效。

鉴于 AI 领域的快速发展，我建议一个更广泛的上下文工程定义：_**设计和优化 LLM 和高级 AI 模型的指令和相关上下文以有效执行任务的过程。**_ 这不仅涵盖基于文本的 LLM，还包括为多模态模型优化上下文，后者正变得越来越普遍。这可以包括所有提示工程工作和相关流程，例如：

- 设计和管理提示链（适用时）
- 调优指令/系统提示词
- 管理提示的动态元素（例如用户输入、日期/时间等）
- 搜索和准备相关知识（即 RAG）
- 查询增强
- 工具定义和指令（在智能体系统的情况下）
- 准备和优化少样本演示
- 结构化输入和输出（例如分隔符、JSON 模式）
- 短期记忆（即管理状态/历史上下文）和长期记忆（例如从向量存储检索相关知识）
- 以及许多其他有助于优化 LLM 系统提示词以实现期望任务的技巧。

换句话说，上下文工程的目标是优化您在 LLM 上下文窗口中提供的信息。这也意味着过滤掉噪声信息，这本身就是一门科学，因为它需要系统地衡量 LLM 的性能。

每个人都在写上下文工程，但在这里我们将通过一个具体示例来展示构建 AI 智能体时上下文工程的实际样子。

## 上下文工程实战

让我们看一个我最近为个人使用的多智能体深度研究应用进行的上下文工程工作的具体示例。

我在 n8n 中构建了智能体工作流，但工具并不重要。我构建的完整智能体架构如下：

![context engineering workflow](/images/grimoire/context-engineering-workflow.jpg)

我工作流中的搜索规划器智能体负责根据用户查询生成搜索计划。

### 系统提示词

以下是我为这个子智能体编写的系统提示词：

```
You are an expert research planner. Your task is to break down a complex research query (delimited by <user_query></user_query>) into specific search subtasks, each focusing on a different aspect or source type.
        
The current date and time is: {{ $now.toISO() }}

For each subtask, provide:
1. A unique string ID for the subtask (e.g., 'subtask_1', 'news_update')
2. A specific search query that focuses on one aspect of the main query
3. The source type to search (web, news, academic, specialized)
4. Time period relevance (today, last week, recent, past_year, all_time)
5. Domain focus if applicable (technology, science, health, etc.)
6. Priority level (1-highest to 5-lowest)
        
All fields (id, query, source_type, time_period, domain_focus, priority) are required for each subtask, except time_period and domain_focus which can be null if not applicable.
        
Create 2 subtasks that together will provide comprehensive coverage of the topic. Focus on different aspects, perspectives, or sources of information.

Each substask will include the following information:

id: str
query: str
source_type: str  # e.g., "web", "news", "academic", "specialized"
time_period: Optional[str] = None  # e.g., "today", "last week", "recent", "past_year", "all_time"
domain_focus: Optional[str] = None  # e.g., "technology", "science", "health"
priority: int  # 1 (highest) to 5 (lowest)

After obtaining the above subtasks information, you will add two extra fields. Those correspond to start_date and end_date. Infer this information given the current date and the time_period selected. start_date and end_date should use the format as in the example below:

"start_date": "2024-06-03T06:00:00.000Z",
"end_date": "2024-06-11T05:59:59.999Z",
```

这个提示词有许多部分需要仔细考虑，关于我们到底提供什么上下文给规划智能体以有效执行任务。正如您所看到的，这不仅仅是设计一个简单的提示词或指令；这个过程需要实验并为模型提供重要的上下文以最优地执行任务。

让我们将问题分解为对有效上下文工程至关重要的核心组件。

### 指令

指令是提供给系统的高级指令，准确地告诉它做什么。

```
You are an expert research planner. Your task is to break down a complex research query (delimited by <user_query></user_query>) into specific search subtasks, each focusing on a different aspect or source type.
```

许多初学者甚至有经验的 AI 开发者会在此停止。鉴于我分享了上面的完整提示词，您可以理解我们需要给系统多少额外的上下文才能使其按我们的意愿工作。这就是上下文工程的意义所在；它告知系统更多关于问题范围和我们具体期望的内容。

### 用户输入

用户输入没有显示在系统提示词中，但以下是它的示例：

```
<user_query> What's the latest dev news from OpenAI? </user_query>
```

注意分隔符的使用，这是为了更好地结构化提示词。这很重要，可以避免混淆，并增加清晰度，说明什么是用户输入以及我们希望系统生成什么。有时，我们输入的信息类型与我们希望模型输出的内容相关（例如查询是输入，子查询是输出）。

### 结构化输入和输出

除了高级指令和用户输入，您可能注意到我在规划智能体需要生成的子任务相关细节上花了大量精力。以下是我提供给规划智能体的详细说明，用于根据用户查询创建子任务：

```
For each subtask, provide:
1. A unique string ID for the subtask (e.g., 'subtask_1', 'news_update')
2. A specific search query that focuses on one aspect of the main query
3. The source type to search (web, news, academic, specialized)
4. Time period relevance (today, last week, recent, past_year, all_time)
5. Domain focus if applicable (technology, science, health, etc.)
6. Priority level (1-highest to 5-lowest)
        
All fields (id, query, source_type, time_period, domain_focus, priority) are required for each subtask, except time_period and domain_focus which can be null if not applicable.
        
Create 2 subtasks that together will provide comprehensive coverage of the topic. Focus on different aspects, perspectives, or sources of information.
```

如果您仔细看上面的指令，我已经决定结构化我想要规划智能体生成的所需信息列表，附带一些提示/示例来更好地引导数据生成过程。这对于给智能体额外的上下文说明期望是什么至关重要。例如，如果您不告诉它您希望优先级级别在 1-5 的范围内，那么系统可能倾向于使用 1-10 的范围。同样，这个上下文非常重要！

接下来，让我们谈谈结构化输出。为了从规划智能体获得一致的输出，我们还提供了关于子任务格式和字段类型的上下文。以下是我们作为额外上下文传递给智能体的示例。这将为智能体提供关于期望输出的提示和线索：

```
Each substask will include the following information:

id: str
query: str
source_type: str  # e.g., "web", "news", "academic", "specialized"
time_period: Optional[str] = None  # e.g., "today", "last week", "recent", "past_year", "all_time"
domain_focus: Optional[str] = None  # e.g., "technology", "science", "health"
priority: int  # 1 (highest) to 5 (lowest)
```

除此之外，在 n8n 中，您还可以使用工具输出解析器，它本质上将用于结构化最终输出。我使用的选项是提供如下 JSON 示例：

```json
{
  "subtasks": [
    {
      "id": "openai_latest_news",
      "query": "latest OpenAI announcements and news",
      "source_type": "news",
      "time_period": "recent",
      "domain_focus": "technology",
      "priority": 1,
      "start_date": "2025-06-03T06:00:00.000Z",
      "end_date": "2025-06-11T05:59:59.999Z"
    },
    {
      "id": "openai_official_blog",
      "query": "OpenAI official blog recent posts",
      "source_type": "web",
      "time_period": "recent",
      "domain_focus": "technology",
      "priority": 2,
      "start_date": "2025-06-03T06:00:00.000Z",
      "end_date": "2025-06-11T05:59:59.999Z"
    }
  ]
}
```

然后工具会自动从这些示例生成模式，从而使系统能够解析和生成正确的结构化输出，如下例所示：

```json
[
  {
    "action": "parse",
    "response": {
      "output": {
        "subtasks": [
          {
            "id": "subtask_1",
            "query": "OpenAI recent announcements OR news OR updates",
            "source_type": "news",
            "time_period": "recent",
            "domain_focus": "technology",
            "priority": 1,
            "start_date": "2025-06-24T16:35:26.901Z",
            "end_date": "2025-07-01T16:35:26.901Z"
          },
          {
            "id": "subtask_2",
            "query": "OpenAI official blog OR press releases",
            "source_type": "web",
            "time_period": "recent",
            "domain_focus": "technology",
            "priority": 1.2,
            "start_date": "2025-06-24T16:35:26.901Z",
            "end_date": "2025-07-01T16:35:26.901Z"
          }
        ]
      }
    }
  }
]
```

这些东西看起来很复杂，但当今许多工具都开箱即用地启用了结构化输出功能，所以您可能不需要自己实现它。n8n 使上下文工程的这部分变得轻而易举。这是我看到许多 AI 开发者忽略的一个被低估的上下文工程方面。希望上下文工程能更多地关注这些重要的技术。这是一个非常强大的方法，特别是当您的智能体获得需要以特殊格式传递给工作流中下一个组件的不一致输出时。

### 工具

我们使用 n8n 来构建智能体，所以很容易在上下文中放入当前日期和时间。您可以这样做：

```
The current date and time is: {{ $now.toISO() }}
```

这是 n8n 中调用的一个简单便利函数，但通常将其构建为一个专门的工具有助于使事情更加动态（即仅在查询需要时获取日期和时间）。这就是上下文工程的意义所在。它强制您（构建者）做出具体决策，决定传递什么上下文以及何时传递给 LLM。这很好，因为它消除了应用程序中的假设和不准确性。

日期和时间是系统的重要上下文；否则，它在需要知道当前日期和时间的查询上表现不佳。例如，如果我要求系统搜索 OpenAI 上周发生的最新开发新闻，它只会猜测日期和时间，这将导致次优的查询，从而导致不准确的网络搜索。当系统具有正确的日期和时间时，它可以更好地推断日期范围，这对搜索智能体和工具很重要。我将此作为上下文的一部分添加，以允许 LLM 生成日期范围：

```
After obtaining the above subtasks information, you will add two extra fields. Those correspond to start_date and end_date. Infer this information given the current date and the time_period selected. start_date and end_date should use the format as in the example below:

"start_date": "2024-06-03T06:00:00.000Z",
"end_date": "2024-06-11T05:59:59.999Z",
```

我们专注于架构中的规划智能体，所以这里不需要添加太多工具。另一个有意义的工具是检索工具，根据查询检索相关子任务。让我们在下面讨论这个想法。

### RAG 和记忆

我构建的深度研究应用的第一个版本不需要使用短期记忆，但我们构建了一个缓存不同用户查询子查询的版本。这有助于在工作流中实现一些加速/优化。如果用户之前使用过类似的查询，可以将这些结果存储在向量存储中并在其上搜索，以避免为已生成并存在于向量存储中的计划创建新的子查询集。记住，每次调用 LLM API 时，您都在增加延迟和成本。

这是巧妙的上下文工程，因为它使您的应用程序更加动态、更便宜和更高效。您看，上下文工程不仅仅是优化您的提示词；它是为您的目标选择正确的上下文。您还可以在维护该向量存储的方式以及如何将现有子任务拉入上下文方面发挥更多创造力。创造性且新颖的上下文工程是护城河！

### 状态和历史上下文

我们在深度研究智能体的 v1 中没有展示它，但这个项目的一个重要部分是优化结果以生成最终报告。在许多情况下，智能体系统可能需要修改全部或部分查询、子任务以及可能从网络搜索 API 拉取的数据。这意味着系统将对问题进行多次尝试，并需要访问先前的状态以及可能的系统所有历史上下文。

这在我们的用例上下文中意味着什么？在我们的示例中，它可以是让智能体访问子任务的状态、修改（如果有）、工作流中每个智能体的过去结果以及任何其他有助于修改阶段的必要上下文。对于这种类型的上下文，传递什么取决于您正在优化什么。这里会发生很多决策制定。上下文工程并不总是直截了当的，我认为您可以开始想象这个组件需要多少次迭代。这就是为什么我继续强调其他领域的重要性，例如评估。如果您没有衡量所有这些，您怎么知道上下文工程工作是否有效？

## 高级上下文工程

本文未涵盖上下文工程的许多其他方面，例如上下文压缩、上下文管理技术、上下文安全性和评估上下文有效性（即衡量上下文随时间的有效性）。我们将在未来的文章中分享关于这些主题的更多想法。

上下文可能变得稀释或低效（即充满过时和不相关的信息），这需要特殊的评估工作流来捕获这些问题。

我期望上下文工程继续发展，成为 AI 开发者/工程师的重要技能集。除了手动上下文工程之外，还有机会构建自动化有效上下文工程过程的方法。我见过一些工具尝试过这方面，但这个领域需要更多进展。

## 资源

以下是最近撰写关于上下文工程的其他人的一些推荐阅读：

- [https://rlancemartin.github.io/2025/06/23/context_engineering/](https://rlancemartin.github.io/2025/06/23/context_engineering/)
- [https://x.com/karpathy/status/1937902205765607626](https://x.com/karpathy/status/1937902205765607626)
- [https://www.philschmid.de/context-engineering](https://www.philschmid.de/context-engineering)
- [https://simple.ai/p/the-skill-thats-replacing-prompt-engineering?](https://simple.ai/p/the-skill-thats-replacing-prompt-engineering?)
- [https://github.com/humanlayer/12-factor-agents](https://github.com/humanlayer/12-factor-agents)
- [https://blog.langchain.com/the-rise-of-context-engineering/](https://blog.langchain.com/the-rise-of-context-engineering/)
