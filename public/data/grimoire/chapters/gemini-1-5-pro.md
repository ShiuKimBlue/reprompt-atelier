# Gemini 1.5 Pro

Google 推出了 Gemini 1.5 Pro，这是一个"计算高效的多模态专家混合（MoE）模型"，专注于对长篇内容的回忆和推理。它可以处理可能包含数百万 token 的长文档，包括数小时的视频和音频。该模型在长文档问答、长视频问答和长上下文 ASR 方面改进了最先进性能，在标准基准测试中匹配或超越 Gemini 1.0 Ultra，并且在多达 1000 万个 token 的检索中实现了近乎完美的性能（>99%）。

一个实验性的 100 万 token 上下文窗口模型已在 Google AI Studio 上发布。作为参考，"200K 是目前任何可用 LLM 的最大上下文窗口"。100 万 token 的上下文窗口支持包括对大型 PDF、代码仓库和长视频的问答等用例。它支持"在同一输入序列中混合音频、视觉、文本和代码输入"。

## 架构

Gemini 1.5 Pro 是一个"基于 Gemini 1.0 多模态能力构建的稀疏专家混合（MoE）Transformer 模型"。MoE 方法允许总参数增长同时保持激活参数恒定。技术报告提供了有限的细节，但报告 Gemini 1.5 Pro"使用显著更少的训练计算，服务效率更高"，架构变更支持长达 1000 万 token 的长上下文理解。模型在多模态数据上预训练，并使用多模态数据进行指令微调，然后基于人类偏好数据进一步调优。

## 结果

Gemini 1.5 Pro 在所有模态（即文本、视频和音频）上实现了多达 100 万 token 的"近乎完美的 '针' 召回"。上下文窗口支持处理：

- 约 22 小时的录音
- 10 × 1440 页的书
- 整个代码库
- 以 1 fps 处理 3 小时的视频

![gemini retrieval](/images/grimoire/gemini-retrieval.png)

该模型"在大多数基准测试上超越了 Gemini 1.0 Pro"，在数学、科学、推理、多语言、视频理解和代码方面具有显著性能。它还在一半的基准测试上超越了 Gemini 1.0 Ultra，同时使用了显著更少的训练计算。

![gemini pro results](/images/grimoire/gemini-pro-results.png)

## 能力

以下子章节突出展示了"从分析大量数据到长上下文多模态推理的各种能力"。其中一些在论文中报告，一些由社区报告，还有一些来自作者的实验。

### 长文档分析

在文档处理方面，Google AI Studio 支持多达 100 万 token，允许上传整个 PDF。一个示例展示了上传单个 PDF 并提问：`What is the paper about?`

![galactica](/images/grimoire/galactica.png)

模型对 Galactica 论文提供了可接受的摘要。自由格式提示和聊天格式都可用于与上传的 PDF 进行交互。

![galactica chat](/images/grimoire/galactica-chat.png)

上传两个 PDF 并提出跨文档问题也进行了测试：

![galactica 2](/images/grimoire/galactica-2.png)

回复是合理的，从第一篇论文的表格中提取了信息。但是，尽管第一篇论文中没有"Performance"部分，模型却错误地包含了它。提示放在顶部并标记了论文：`Please list the facts mentioned in the first paper about the large language model introduced in the second paper.` 后续任务可以包括撰写相关工作部分或在综述中纳入更新的 LLM 论文。

### 视频理解

模型使用 Andrej Karpathy 关于 LLM 的讲座进行了测试。上传了一个 YouTube 视频，聊天提示为 `What is the lecture about?`

![chat 1](/images/grimoire/chat-1.png)

然后请求了一个简明大纲。输出（为简洁进行了编辑）：

```
## Large Language Models: A New Operating System?
Introduction:
 
- LLMs are trained on massive amounts of text data and can generate human-quality text.
- They are becoming increasingly powerful and are being used for a wide range of tasks, such as writing, translation, and coding.
 
How LLMs Work:
 
- LLMs are neural networks that predict the next word in a sequence.
- They learn by iteratively adjusting their parameters to make better predictions.
- While we can measure their performance, we don't fully understand how the billions of parameters collaborate to achieve it.
 
Training LLMs:
 
- Requires massive amounts of data and computing power.
- Can be thought of as "compressing the internet" into a single file.
- For example, training LLaMA 2 70B required 6,000 GPUs for 12 days and cost ~$2 million.
 
LLM Security:
 
- LLM security is a new and rapidly evolving field.
- Some key security risks include:
    - Jailbreaking: bypassing safety mechanisms to generate harmful content.
    - Prompt injection: injecting malicious code into prompts to control the LLM's output.
    - Data poisoning / Backdoor attacks: inserting crafted text into the training data to influence the LLM's behavior.
...
```

摘要简洁并包含了关键点。但是，当提示 `What are the FLOPs reported for Llama 2 in the lecture?` 时，模型回答"~1 trillion FLOPs"，这是不准确的——正确答案应该是"~1e24 FLOPs"。技术报告记录了"长上下文模型在被问及视频中具体问题时失败"的实例。

从视频中提取表格也进行了测试。模型生成了正确的列标题，但行标签有错误（例如，`Concept Resolution` 应该是 `Coref Resolution`）。其他提取任务也出现了类似的不一致。

基于时间戳的检索也进行了测试：

提示：`At what timestamp does the LLM OS section start?`

输出：`The LLM OS section starts at 42:17.`

此回复是正确的。

图表解释也进行了测试：

提示：`Can you explain the chart (on the right-hand side) on the self-improvement slide?`

输出描述了 AlphaGo Zero 随时间推移的 Elo 评分表现，在 40 天内通过自我对弈快速改进。

![chart](/images/grimoire/chart.png)

### 代码推理

模型可以回答关于代码库的问题。在技术报告中，Gemini 1.5 Pro 被提供了"整个 JAX 代码库（约 746K token）"，并被要求识别核心自动微分方法的位置。

![jax](/images/grimoire/jax.png)

### 英语到 Kalamang 翻译

Gemini 1.5 Pro 可以提供语法手册（"500 页的语言文档、字典和约 400 个平行句子"），用于 Kalamang——一种使用者不到 200 人的语言——并将英语翻译成 Kalamang，水平与从相同内容学习的人相当。这展示了通过长上下文实现的上下文学习能力。

![kalamang](/images/grimoire/kalamang.png)

*图片来源：[Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context](https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf)*

## 参考资料

- [Gemini 1.5: Unlocking multimodal understanding across millions of tokens of context](https://storage.googleapis.com/deepmind-media/gemini/gemini_v1_5_report.pdf)
- [Gemini 1.5: Our next-generation model, now available for Private Preview in Google AI Studio](https://developers.googleblog.com/2024/02/gemini-15-available-for-private-preview-in-google-ai-studio.html)
