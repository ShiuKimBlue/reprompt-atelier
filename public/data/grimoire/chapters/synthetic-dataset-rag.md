# 生成 RAG 合成数据集

## AI 产品的范式转变

![AI 产品范式转变](/images/grimoire/synthetic_rag_1.png)

LLM 的出现改变了 AI 产品的构建方式。传统项目需要花费数月时间收集和标注数据，然后才能构建解决方案。LLM 通过泛化能力改变了这一范式，使快速原型设计成为可能。

检索增强生成（RAG）是知识密集型任务的一种新兴方法，它"将信息检索组件与文本生成模型结合在一起"。检索模型是 RAG 的关键组件——它识别相关文档并将其传递给 LLM。

然而，检索模型的性能在特定领域或非英语语言中经常会下降。例如，捷克法律聊天机器人和印度税务助手中，"检索模型经常会错过最相关的文档"。

## 基本方法

使用 LLM 为 RAG 系统生成合成训练数据是一种有效的方法。核心思路是"通过基于提示的查询生成，将 LLM 蒸馏为标准大小的编码器"。虽然前期计算成本较高，但可以降低推理成本并提升低资源场景下的性能。

### 实现步骤

1. **文档分块**：将源文档分割成适当大小的片段
2. **问题生成**：基于每个文档片段生成相关问题
3. **答案生成**：使用 LLM 根据文档片段生成答案
4. **质量过滤**：筛选低质量的问答对

### 代码示例

```python
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate

# 问题生成提示
question_prompt = PromptTemplate(
    input_variables=["context"],
    template="""Based on the following context, generate 3 relevant questions:

Context: {context}

Questions:"""
)

# 答案生成提示
answer_prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="""Answer the question based on the context.

Context: {context}
Question: {question}
Answer:"""
)
```

## 领域特定数据集生成

![PROMPTGATOR 数据集生成与训练概览](/images/grimoire/synthetic_rag_2.png)

不同检索任务有不同的搜索意图——同一个（查询，文档）对在不同意图下可能有不同的相关性。例如，论证检索可能寻求支持性论据或反驳性论据。

### 提示模板示例

以下是一个反驳性论证检索的提示模板（参考 [ArguAna 数据集](https://aclanthology.org/P18-1023/)）：

```
Task: Identify a counter-argument for the given argument.

Argument #1: {insert passage X1 here}

A concise counter-argument query related to the argument #1: {insert manually prepared query Y1 here}

Argument #2: {insert passage X2 here}
A concise counter-argument query related to the argument #2: {insert manually prepared query Y2 here}

<- paste your examples here ->

Argument N: Even if a fine is made proportional to income, you will not get the equality of impact you desire. This is because the impact is not proportional simply to income, but must take into account a number of other factors. For example, someone supporting a family will face a greater impact than someone who is not, because they have a smaller disposable income. Further, a fine based on income ignores overall wealth (i.e. how much money someone actually has: someone might have a lot of assets but not have a high income). The proposition does not cater for these inequalities, which may well have a much greater skewing effect, and therefore the argument is being applied inconsistently.

A concise counter-argument query related to the argument #N:
```

**输出：**

```
punishment house would make fines relative income
```

### 通用提示表达式

该提示可概括为：

**(e_prompt, e_doc(d₁), e_query(q₁), ..., e_doc(dₖ), e_query(qₖ), e_doc(d))**

其中 `e_doc` 和 `e_query` 是任务特定的文档和查询描述，`e_prompt` 是任务特定指令，`d` 是新文档，LLM 为其生成查询。只有最后一个文档 `d` 和生成的查询用于本地模型训练。

Dai 等人（2022）的研究表明，仅使用"8 个手动标注示例和大量未标注语料库"即可达到接近最先进水平的性能。

## 手动标注指导

建议准备更多示例（例如 20 个），每次提示随机选择 2-8 个。这增加了多样性。示例应"具有代表性、格式正确"，并详细说明目标查询长度或语气等细节。低质量的少样本示例会降低训练模型的质量。

## 成本分析

![合成数据集 vs 手动标注数据集](/images/grimoire/synthetic_rag_3.png)

使用 ChatGPT（经济型模型），一个包含指令和 4-5 个示例的提示约 700 tokens（文档 ≤128 tokens），生成约 25 tokens。对于 50,000 个文档的语料库，成本公式为：

```
50,000 * (700 * 0.001 * $0.0015 + 25 * 0.001 * $0.002) = $55
```

其中 `$0.0015` 和 `$0.002` 是 GPT-3.5 Turbo API 每 1,000 tokens 的成本。也可以为每个文档生成 2-4 个查询。

Dai 等人（2022）发现，需要约 50,000 个手动标注示例才能匹配合成数据训练模型的质量。手动收集 10,000+ 个示例需要一个月，成本超过 1,000 美元，远高于合成方法。

## 最佳实践

![PROMPTGATOR 提示模板](/images/grimoire/synthetic_rag_4.png)

- 确保问题多样化，覆盖文档的不同方面
- 包含需要推理的复杂问题
- 验证生成的答案与源文档一致
- 平衡简单和复杂的问答对
- 为每个文档生成多个查询以增加多样性

## 相关资源

- [Dai 等人（2022）— PROMPTGATOR](https://arxiv.org/abs/2209.11755)
- [ArguAna 数据集](https://aclanthology.org/P18-1023/)
- [S. Wang — The Rise of the AI Engineer](https://www.latent.space/p/ai-engineer)
