# Prompt Chaining

## 概述

Prompt Chaining 是一种通过将任务分解为子任务来提高 LLM 可靠性的技术。每个子任务获得自己的提示，其响应作为下一个提示的输入——形成一个提示操作链。

Prompt Chaining 有助于完成那些单个详细提示难以处理的复杂任务。链式提示"在达到最终期望状态之前，对生成的响应执行转换或额外处理"。

除了性能提升外，Prompt Chaining 还能：

- 提高 LLM 应用的透明度
- 增加可控性和可靠性
- 使跨阶段调试更容易
- 特别适用于 LLM 驱动的对话助手和个性化场景

## 使用场景：文档问答

一个常见的用例是回答大型文本文档中的问题。该方法使用两个提示：一个提取相关引用，第二个根据这些引用和原始文档组合答案。

![Prompt Chaining 示例](/images/grimoire/prompt-chaining.png)

### Prompt 1：提取相关引用

根据给定的问题从文档中提取相关引用：

```
You are a helpful assistant. Your task is to help answer a question given in a document. The first step is to extract quotes relevant to the question from the document, delimited by ####. Please output the list of quotes using <quotes></quotes>. Respond with "No relevant quotes found!" if no relevant quotes were found.

####
{{document}}
####
```

**Prompt 1 的输出：**

```
<quotes>
- Chain-of-thought (CoT) prompting[27]
- Generated knowledge prompting[37]
- Least-to-most prompting[38]
- Self-consistency decoding[39]
- Complexity-based prompting[41]
- Self-refine[42]
- Tree-of-thought prompting[43]
- Maieutic prompting[45]
- Directional-stimulus prompting[46]
- Textual inversion and embeddings[59]
- Using gradient descent to search for prompts[61][62][63][64]
- Prompt injection[65][66][67]
</quotes>
```

### Prompt 2：组合答案

取提取的引用并组合一个有帮助的回答：

```
Given a set of relevant quotes (delimited by <quotes></quotes>) extracted from a document and the original document (delimited by ####), please compose an answer to the question. Ensure that the answer is accurate, has a friendly tone, and sounds helpful.

####
{{document}}
####

<quotes>
- Chain-of-thought (CoT) prompting[27]
- Generated knowledge prompting[37]
- Least-to-most prompting[38]
- Self-consistency decoding[39]
- Complexity-based prompting[41]
- Self-refine[42]
- Tree-of-thought prompting[43]
- Maieutic prompting[45]
- Directional-stimulus prompting[46]
- Textual inversion and embeddings[59]
- Using gradient descent to search for prompts[61][62][63][64]
- Prompt injection[65][66][67]
</quotes>
```

**Prompt 2 的输出：**

```
The prompting techniques mentioned in the document include:

1. Chain-of-thought (CoT) prompting[27]
2. Generated knowledge prompting[37]
3. Least-to-most prompting[38]
4. Self-consistency decoding[39]
5. Complexity-based prompting[41]
6. Self-refine[42]
7. Tree-of-thought prompting[43]
8. Maieutic prompting[45]
9. Directional-stimulus prompting[46]
10. Textual inversion and embeddings[59]
11. Using gradient descent to search for prompts[61][62][63][64]
12. Prompt injection[65][66][67]

Each of these techniques employs unique strategies to enhance or specify the interactions with large language models to produce the desired outcomes.
```

## 练习

设计一个提示，在将响应发送为最终响应之前，移除响应中的引用标记（如 `[27]`）。

更多 Prompt Chaining 示例可参考 Anthropic 的 Claude 文档。
