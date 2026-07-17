# 提取模型名称

从机器学习论文摘要中提取模型名称，返回 JSON 数组格式。

## 提示

```
Your task is to extract model names from machine learning paper abstracts. Your response is an array of the model names in the format ["model_name"]. If you don't find model names in the abstract or you are not sure, return ["NA"]

Abstract: Large Language Models (LLMs), such as ChatGPT and GPT-4, have revolutionized natural language processing research and demonstrated potential in Artificial General Intelligence (AGI). However, the expensive training and deployment of LLMs present challenges to transparent and open academic research. To address these issues, this project open-sources the Chinese LLaMA and Alpaca…
```

## 预期输出

```json
["ChatGPT", "GPT-4", "Chinese LLaMA", "Alpaca"]
```

## 要点

- 信息提取是 LLM 的核心能力之一
- 通过明确指定输出格式（JSON 数组）提高提取准确性
- 适用于从非结构化文本中提取结构化信息
