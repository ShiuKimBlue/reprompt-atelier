# 评估柏拉图对话

先让两个模型生成内容，再用第三个模型作为评估者进行比较。

## 生成提示

给两个模型相同的提示，让它们各自生成柏拉图风格的对话：

```
Plato's Gorgias is a critique of rhetoric and sophistic oratory, where he makes the point that not only is it not a proper form of art, but the use of rhetoric and oratory can often be harmful and malicious. Can you write a dialogue by Plato where instead he criticizes the use of autoregressive language models?
```

## 评估提示

将两个模型的输出交给第三个模型作为评估者：

```
Can you compare the two outputs below as if you were a teacher?

Output from ChatGPT: {output 1}

Output from GPT-4: {output 2}
```

## 要点

- 这是一种 **LLM-as-a-Judge** 的评估范式
- 用第三方模型对比两个模型的输出质量
- 适用于开放式生成任务的评估
