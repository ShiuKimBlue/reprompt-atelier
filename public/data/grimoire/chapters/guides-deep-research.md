# OpenAI 深度研究指南

## 什么是深度研究？

深度研究（Deep Research）是 OpenAI 的智能体，用于在互联网上执行**多步骤研究**，处理复杂任务如生成报告和竞品分析。它被描述为一个"**智能体推理系统**"，可以使用 **Python** 和网络浏览等工具，在多个领域进行高级研究。

该系统执行复杂多步骤研究任务所需的时间远少于人类——在几分钟内完成可能需要数小时的工作。它由 OpenAI 的 **o3 模型**驱动，针对网络浏览和数据分析进行了优化，使用推理来搜索、解释和分析大量信息。一个由 **o4-mini** 驱动的轻量级版本也已推出。

该模型使用**强化学习（RL）**开发，训练其有效浏览、推理复杂信息，并学习规划和执行多步骤任务。它可以**回溯、调整计划**并**响应**实时信息。深度研究支持**用户上传文件**，可以使用 Python **生成图表**，并旨在嵌入网站中的图形和图像并附带引用。

**深度研究流程图：**

![deep research flowchart](/images/grimoire/deep_research_flowchart.JPG)

## 如何访问 OpenAI 深度研究？

深度研究对 **Pro、Plus、Teams 和 Enterprise** 订阅用户可用。使用限额在 4 月 24 日的更新中有所扩大。对于 **Plus、Team、Enterprise 和 Edu 用户**，限制为**每月 25 次深度研究查询**（从 10 次增加）。Pro 用户每月限制为 **250 次深度研究查询**（从 120 次增加）。**免费用户**可使用轻量级版本获得 **5 次深度研究查询**。达到原始版本的限额后，查询会自动默认使用**轻量级版本**。

![deep research OAI post](/images/grimoire/deep_research_OAI_post.JPG)

## 深度研究解决什么问题？

深度研究执行**复杂多步骤研究任务**的速度远快于人类，将数小时的工作缩减为几分钟。它适用于需要广泛和复杂的网络搜索、制定复杂计划和搜索查询的任务。

其核心过程是**搜索 + 分析 + 综合**，最终生成**报告**、**洞察**和**行动计划**，使用数百个在线来源。

## 深度研究用例

**专业应用：**
- 金融：市场和竞品分析
- 科学研究和数据分析
- 政策和法规研究
- 工程文档和分析

**购物和消费者研究：**
- 详细产品研究（汽车、电器、家具）
- 超个性化推荐
- 深入产品对比

**学术和分析：**
- 文献综述和综合摘要
- 生成包含发现和新洞察的概览
- 识别研究空白 → 新的研究问题 → 新的科学研究
- 发现趋势并找到新的推荐阅读
- 分析定量输出并生成有趣的讨论
- 来源验证和发现新证据
- 假设检验？

**知识工作/工程：**
- 回答需要多步骤的复杂查询
- 分析上传的文件和文档并用新研究进行增强
- 创建综合报告
- 开发技术文档
- 进行可行性研究
- 综合多个来源的信息

**示例：**
- [分析 GitHub 仓库](https://x.com/OpenAIDevs/status/1920556386083102844)（2025 年 5 月 8 日新增功能）
- [顶级 AI 智能体框架](https://chatgpt.com/share/681bd7b4-41e0-8000-a9de-c2b82c55d5ba)（报告）
- [AI 驱动的跨学科科学发现](https://chatgpt.com/share/681bdb1f-e764-8000-81c8-fab25119da0d)（文献综述）
- [OpenAI 模型 vs Google Gemini 模型](https://chatgpt.com/share/681cbf8e-6550-8000-b7ea-e94ca104a17f)（竞品分析）
- [AI 教育趋势](https://chatgpt.com/share/681cc54d-f970-8000-8e6e-c6df6ae9e73e)（趋势）
- [YC 创业想法研究](https://chatgpt.com/share/681ccd59-0ef8-8000-a638-16b2c803bc99)（公司研究）
- [DeepSeek-R1 指南](https://chatgpt.com/share/67a3dd37-5a2c-8000-9a87-3b5f2d90350e)（指南）
- [CrewAI 框架 - 一个月学习计划](https://chatgpt.com/share/67a4cece-f444-8000-9a55-8491767e4aff)（学习计划）
- [LLM 定价趋势](https://chatgpt.com/share/67a4cf07-efec-8000-ad83-486163512568)（趋势）
- [关于 o1 和 DeepSeek-R1 的最新论文](https://chatgpt.com/share/67a4cf3b-cfe4-8000-a1ca-71b0c1555caa)（摘要和分析）

更多示例：[https://openai.com/index/introducing-deep-research/](https://openai.com/index/introducing-deep-research/)

深度研究擅长处理通常需要人类**数小时**的任务，特别是那些需要：
- **整合多个信息来源**
- **深入分析复杂数据**
- **创建文档完善的报告**
- **多步骤研究过程**（规划、查找、浏览、推理、分析、综合）
- **处理、理解和推理大量信息**

![deep research word cloud](/images/grimoire/deep_research_word_cloud.JPG)

## 如何决定何时使用深度研究？

如果任务**需要多方面的、特定领域的查询**，需要广泛的**实时信息**研究和**仔细的推理/理解**，则使用深度研究。对于其他任务，使用原始 o1-mini 和 GPT-4o。对需要推理的任务使用 o1-mini。对简单的一次性任务使用 GPT-4o。

## OpenAI 深度研究的使用技巧

### 提示技巧

- **清晰和具体的指令**：给它一个计划，尽可能具体。任务需要时间，所以第一次就写好提示词很重要。
- **澄清，不要忽略**：模型会提出问题以澄清不确定性。全面回答会产生更好的结果。"请求比标准查询更昂贵，所以花时间来澄清。"
- **关键词很有帮助**：推理模型使用关键词来搜索网络，所以尽可能多地提供关键词。精确的术语可以节省时间和精力。
- **使用清晰的动词**：深度研究经过训练可以遵循指令。"比较"、"建议"、"推荐"和"报告"等动词有助于它理解期望的输出。
- **输出格式**：指定您想要的格式——报告类型、章节、表格、布局细节（列、标题）。模型的默认报告风格输出可能不适合所有人。
- **上传文件作为上下文**：添加 PDF 等文件以引导模型获取重要上下文，特别是对于技术主题。这适用于 ChatGPT-4o。

**检查来源并验证信息**：始终自行检查来源。模型仍可能犯错，可能难以区分权威信息和推测。

### 接下来尝试什么？

**研究：**
- 对 AI 工具进行全面的市场研究/竞品分析
- 围绕新产品的研究，包括评论、价格比较
- 给它一份文档，要求增强、填充细节或批评
- 基于趋势和采用率的产品功能推荐的广泛研究
- 用户研究
- 法律案件研究：收集案例法、先例和法规
- 事实核查或背景调查

**商业用例：**
- 为特定领域搜索和开发 AI/智能体用例
- 跟踪特定领域或主题的趋势

**学习用例：**
- 制定学习计划和学习路径推荐
- 收集关于如何使用 AI 模型的技巧和编码最佳实践
- 检查特定开发者工具的最新功能；建议练习或学习材料

**科学：**
- 健康相关主题的最新研究（睡眠、症状、心理健康）
- 用最新发现撰写技术报告

**内容创作：**
- 撰写关于多个主题组合的博客文章
- 通过分析网络上某个领域的趋势来建议主题

**个人：**
- 为您或任何其他公众人物开发详细的简介
- 基于公共信息和项目开发/更新简历
- 为即将进行的演示生成/建议幻灯片

### OAI 深度研究与其他解决方案有何不同？

存在专用的智能体解决方案，如 Google 的 Gemini Deep Research，以及构建类似工作流的各种框架。**Flowise AI**、**Llama Index**、**crewAI**、**n8n** 或 **LangGraph** 可以构建此类系统，可能更具成本效益，并使用 o1 和 o3-mini 等模型。

OpenAI 使用*专有的 o3 模型变体*进行深度研究，专门设计用于复杂推理和多步骤研究。目前尚不清楚该模型是否会通过 API 或在 ChatGPT 中可用。OpenAI 提供了比较深度研究和 o3-mini-high 的基准测试结果（例如 Humanity's Last Exam）（[来源](https://openai.com/index/introducing-deep-research/)）。

![deep research benchmark](/images/grimoire/deep_research_benchmark.JPG)

"模型浏览和思考其浏览内容的次数越多，效果就越好，这就是为什么*给它思考时间很重要*。"**推理模型是关键**，可使深度研究在复杂任务上表现更好。随着推理模型的改进，深度研究也将随之改进。

![deep research pass rate](/images/grimoire/deep_research_pass_rate.JPG)

### 深度研究的局限性？

深度研究有几个需要改进的方面。它**难以综合技术和特定领域的信息**，因此提供支持文档会有所帮助。模型需要**改进幻觉问题**，可能难以区分权威信息和谣言。**结果因行业/领域而异**，并且**在组合不同类型信息时存在挑战**。

具体限制：
- 目前不清楚如何让它显式搜索更多在线来源（例如 50 篇不同的文章）或限定到特定来源。**观察到对某些域名存在偏见**。
- 仍然产生**引用错误和格式错误**。
- 难以将信息**导出**到 Excel、笔记本、Notion 或 Docs 等格式。
- **不擅长处理与时间/日期相关的查询**——请尽可能具体。
- **不支持付费墙/订阅背后的来源**；未来可能会有集成。
- **生成和嵌入图表功能尚不可用**（从实验来看），但可以整合图像，预期最终会实现。

一个重要限制是**深度研究目前不执行操作**。它可以打开网页并查看组件（主要是读取），但执行站点搜索或像 Operator 那样执行操作将有助于找到更多信息。Operator 和深度研究的合并可能很快就会到来。

更多的工具和自动知识库访问将非常有趣。需要更多的**输出个性化**，可能通过自定义指令。OpenAI 的高级记忆功能也可以实现更专注和个性化的深度研究。

### 其他有用参考

- [Introducing deep research | OpenAI](https://openai.com/index/introducing-deep-research/)
- [Introduction to Deep Research](https://www.youtube.com/watch?v=YkCDVn3_wiw&ab_channel=OpenAI)
- [OpenAI Deep Research: The Future of Autonomous Research and Analysis](https://dirox.com/post/openai-deep-research)
- [OpenAI's 5-Stage AI Roadmap, Explained Using the "3 Levels of AI Adoption and the 6 Levels of Autonomous Companies"](https://medium.com/@The_Last_AI/openais-5-stage-ai-roadmap-explained-using-the-3-levels-of-ai-adoption-and-the-6-levels-of-e295693cc105)
- [No Priors Ep. 112 with OpenAI Deep Research, Isa Fulford](https://www.youtube.com/watch?v=qfB4eDkd_40)
