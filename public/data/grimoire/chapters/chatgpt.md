# ChatGPT提示工程

在本节中，我们将介绍ChatGPT的最新提示工程技术，包括提示、应用、限制、论文和其他阅读材料。

## ChatGPT简介

ChatGPT是一个由OpenAI训练的模型，具有交互式对话能力。它能够按照提示中的指示，在对话的上下文中提供适当的响应。应用场景包括回答问题、建议食谱、写歌词、生成代码等等。

ChatGPT使用人类反馈的强化学习（RLHF）进行训练。尽管比之前的GPT迭代版本更强大，并且经过训练以减少有害和不真实的输出，但它仍然存在局限性。

研究预览版可在 [chat.openai.com](https://chat.openai.com) 获取，但我们的示例使用 OpenAI Playground 的 "Chat" 模式。

## 审查对话任务

在之前的指南中，我们简要介绍了对话能力和角色提示。我们介绍了如何指示LLM以特定的风格、特定的意图、行为和身份进行对话。

让我们回顾一下我们之前的基本示例，其中我们创建了一个对话系统，该系统能够对问题生成更多的技术和科学响应。

*提示：*
```
以下是与AI研究助手的对话。助手的语气是专业和科学的。

人：你好，你是谁？
AI：你好！我是AI研究助手。我今天能帮你什么忙吗？
人：你能告诉我黑洞的形成吗？
AI：
```

从上面的例子中，您可以看到两个重要的组成部分：
- **意图**或聊天机器人的解释
- **身份**，指示聊天机器人将使用哪种风格或语气进行响应

上面的简单示例适用于使用`text-davinci-003`的文本完成API。最近，OpenAI[宣布了ChatGPT API](https://openai.com/blog/introducing-chatgpt-and-whisper-apis)，这是一个更强大、更便宜的模型，称为`gpt-3.5-turbo`，专门为这种功能（聊天完成）而构建。事实上，OpenAI甚至推荐这个模型作为非聊天用例的最佳模型。使用ChatGPT API的其他好处包括显著降低成本（90%）和提高效率。

像Snap Inc.和Instacart这样的大公司已经在其产品中集成了由ChatGPT提供支持的对话功能，这些产品从个性化推荐到开放式购物目标不等。

## 与ChatGPT的对话

### 多轮对话

`gpt-3.5-turbo`模型使用聊天格式作为输入，期望一系列消息。

*输入：*
```
系统：你是一个AI研究助手。你使用技术和科学的语气。
用户：你好，你是谁？
助手：问候！我是AI研究助手。我今天能帮你什么忙吗？
用户：你能告诉我黑洞的形成吗？
```

*输出：*
```
助手：当一个巨大的恒星耗尽燃料并在自身的引力下坍塌时，就会形成黑洞。这种坍塌使星体变得极其密集，具有极强的引力场，甚至连光都无法逃脱。这个无法逆转的点被称为事件视界。一旦一颗恒星穿过事件视界，它就被认为是一个黑洞...
```

![ChatGPT多轮对话截图](/images/grimoire/chatgpt-1.png)

API调用：

```python
import openai

openai.ChatCompletion.create(
  model="gpt-3.5-turbo",
  messages=[
        {"role": "system", "content": "You are an AI research assistant. You use a tone that is technical and scientific."},
        {"role": "user", "content": "Hello, who are you?"},
        {"role": "assistant", "content": "Greeting! I am an AI research assistant. How can I help you today?"},
        {"role": "user", "content": "Can you tell me about the creation of black holes?"}
    ]
)
```

未来开发者与ChatGPT的交互预计将通过ChatML（Chat Markup Language）进行：[https://github.com/openai/openai-python/blob/main/chatml.md](https://github.com/openai/openai-python/blob/main/chatml.md)

### 单轮任务

聊天格式同样支持单轮任务，类似于`text-davinci-003`。

*输入：*
```
用户：根据下面的上下文回答问题。保持答案简短明了。如果不确定答案，请回答"不确定答案"。

背景：Teplizumab的起源可以追溯到新泽西州的一家名为Ortho Pharmaceutical的药品公司。在那里，科学家们生成了抗体的早期版本，被称为OKT3。最初是从老鼠中提取出来的分子，它能够结合到T细胞表面并限制它们杀伤其他细胞的潜力。1986年，该药物获得批准用于帮助预防肾移植后器官排斥反应，成为第一个允许人类使用的治疗性抗体。

问题：OKT3最初是从哪里提取出来的？

回答：
```

*输出：*
```
助手：老鼠。
```

![ChatGPT单轮问答截图](/images/grimoire/chatgpt-classic.png)

API调用：

```python
CONTENT = """Answer the question based on the context below. Keep the answer short and concise. Respond \"Unsure about answer\" if not sure about the answer.

Context: Teplizumab traces its roots to a New Jersey drug company called Ortho Pharmaceutical. There, scientists generated an early version of the antibody, dubbed OKT3. Originally sourced from mice, the molecule was able to bind to the surface of T cells and limit their cell-killing potential. In 1986, it was approved to help prevent organ rejection after kidney transplants, making it the first therapeutic antibody allowed for human use.

Question: What was OKT3 originally sourced from?

Answer:

"""

response = openai.ChatCompletion.create(

model="gpt-3.5-turbo",

messages=[

{"role": "user", "content": CONTENT},

],

temperature=0,

)
```

## 指导聊天模型

像`gpt-3.5-turbo-0301`（3月1日）这样的模型快照可用。不同版本的最佳提示实践可能会有所不同。对于`gpt-3.5-turbo-0301`，当前的建议是在"user"消息中添加指令，而不是使用可用的"system"消息。

## 笔记本

以下笔记本提供与ChatGPT提示工程相关的教程和示例：

- [How to format inputs to ChatGPT models](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_format_inputs_to_ChatGPT_models.ipynb)

## 引文

1. [ChatGPT and a New Academic Reality: AI-Written Research Papers and the Ethics of the Large Language Models in Scholarly Publishing](https://arxiv.org/abs/2303.13367) (March 2023)
2. [Are LLMs the Master of All Trades? : Exploring Domain-Agnostic Reasoning Skills of LLMs](https://arxiv.org/abs/2303.12810) (March 2023)
3. [Is ChatGPT A Good Keyphrase Generator? A Preliminary Study](https://arxiv.org/abs/2303.13001) (March 2023)
4. [MM-REACT: Prompting ChatGPT for Multimodal Reasoning and Action](https://arxiv.org/abs/2303.11381) (March 2023)
5. [Large Language Models Can Be Used to Estimate the Ideologies of Politicians in a Zero-Shot Learning Setting](https://arxiv.org/abs/2303.12057) (March 2023)
6. [Chinese Intermediate English Learners outdid ChatGPT in deep cohesion: Evidence from English narrative writing](https://arxiv.org/abs/2303.11812) (March 2023)
7. [A Comprehensive Capability Analysis of GPT-3 and GPT-3.5 Series Models](https://arxiv.org/abs/2303.10420) (March 2023)
8. [ChatGPT as the Transportation Equity Information Source for Scientific Writing](https://arxiv.org/abs/2303.11158) (March 2023)
9. [Translating Radiology Reports into Plain Language using ChatGPT and GPT-4 with Prompt Learning: Promising Results, Limitations, and Potential](https://arxiv.org/abs/2303.09038) (March 2023)
10. [ChatGPT Participates in a Computer Science Exam](https://arxiv.org/abs/2303.09461) (March 2023)
11. [Consistency Analysis of ChatGPT](https://arxiv.org/abs/2303.06273) (Mar 2023)
12. [Algorithmic Ghost in the Research Shell: Large Language Models and Academic Knowledge Creation in Management Research](https://arxiv.org/abs/2303.07304) (Mar 2023)
13. [Large Language Models in the Workplace: A Case Study on Prompt Engineering for Job Type Classification](https://arxiv.org/abs/2303.07142) (March 2023)
14. [Seeing ChatGPT Through Students' Eyes: An Analysis of TikTok Data](https://arxiv.org/abs/2303.05349) (March 2023)
15. [Extracting Accurate Materials Data from Research Papers with Conversational Language Models and Prompt Engineering -- Example of ChatGPT](https://arxiv.org/abs/2303.05352) (Mar 2023)
16. [ChatGPT is on the horizon: Could a large language model be all we need for Intelligent Transportation?](https://arxiv.org/abs/2303.05382) (Mar 2023)
17. [Making a Computational Attorney](https://arxiv.org/abs/2303.05383) (Mar 2023)
18. [Does Synthetic Data Generation of LLMs Help Clinical Text Mining?](https://arxiv.org/abs/2303.04360) (Mar 2023)
19. [MenuCraft: Interactive Menu System Design with Large Language Models](https://arxiv.org/abs/2303.04496) (Mar 2023)
20. [A Comprehensive Survey of AI-Generated Content (AIGC): A History of Generative AI from GAN to ChatGPT](https://arxiv.org/abs/2303.04226) (Mar 2023)
21. [Exploring the Feasibility of ChatGPT for Event Extraction](https://arxiv.org/abs/2303.03836)
22. [ChatGPT: Beginning of an End of Manual Annotation? Use Case of Automatic Genre Identification](https://arxiv.org/abs/2303.03953) (Mar 2023)
23. [Is ChatGPT a Good NLG Evaluator? A Preliminary Study](https://arxiv.org/abs/2303.04048) (Mar 2023)
24. [Will Affective Computing Emerge from Foundation Models and General AI? A First Evaluation on ChatGPT](https://arxiv.org/abs/2303.03186) (Mar 2023)
25. [UZH_CLyp at SemEval-2023 Task 9: Head-First Fine-Tuning and ChatGPT Data Generation for Cross-Lingual Learning in Tweet Intimacy Prediction](https://arxiv.org/abs/2303.01194) (Mar 2023)
26. [How to format inputs to ChatGPT models](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_format_inputs_to_ChatGPT_models.ipynb) (Mar 2023)
27. [Can ChatGPT Assess Human Personalities? A General Evaluation Framework](https://arxiv.org/abs/2303.01248) (Mar 2023)
28. [Cross-Lingual Summarization via ChatGPT](https://arxiv.org/abs/2302.14229) (Feb 2023)
29. [ChatAug: Leveraging ChatGPT for Text Data Augmentation](https://arxiv.org/abs/2302.13007) (Feb 2023)
30. [Dr ChatGPT, tell me what I want to hear: How prompt knowledge impacts health answer correctness](https://arxiv.org/abs/2302.13793) (Feb 2023)
31. [An Independent Evaluation of ChatGPT on Mathematical Word Problems (MWP)](https://arxiv.org/abs/2302.13814) (Feb 2023)
32. [ChatGPT: A Meta-Analysis after 2.5 Months](https://arxiv.org/abs/2302.13795) (Feb 2023)
33. [Let's have a chat! A Conversation with ChatGPT: Technology, Applications, and Limitations](https://arxiv.org/abs/2302.13817) (Feb 2023)
34. [Check Your Facts and Try Again: Improving Large Language Models with External Knowledge and Automated Feedback](https://arxiv.org/abs/2302.12813) (Feb 2023)
35. [On the Robustness of ChatGPT: An Adversarial and Out-of-distribution Perspective](https://arxiv.org/abs/2302.12095) (Feb 2023)
36. [How Generative AI models such as ChatGPT can be (Mis)Used in SPC Practice, Education, and Research? An Exploratory Study](https://arxiv.org/abs/2302.10916) (Feb 2023)
37. [Can ChatGPT Understand Too? A Comparative Study on ChatGPT and Fine-tuned BERT](https://arxiv.org/abs/2302.10198) (Feb 2023)
38. [A Prompt Pattern Catalog to Enhance Prompt Engineering with ChatGPT](https://arxiv.org/abs/2302.11382) (Feb 2023)
39. [Zero-Shot Information Extraction via Chatting with ChatGPT](https://arxiv.org/abs/2302.10205) (Feb 2023)
40. [ChatGPT: Jack of all trades, master of none](https://arxiv.org/abs/2302.10724) (Feb 2023)
41. [A Pilot Evaluation of ChatGPT and DALL-E 2 on Decision Making and Spatial Reasoning](https://arxiv.org/abs/2302.09068) (Feb 2023)
42. [Netizens, Academicians, and Information Professionals' Opinions About AI With Special Reference To ChatGPT](https://arxiv.org/abs/2302.07136) (Feb 2023)
43. [Linguistic ambiguity analysis in ChatGPT](https://arxiv.org/abs/2302.06426) (Feb 2023)
44. [ChatGPT versus Traditional Question Answering for Knowledge Graphs: Current Status and Future Directions Towards Knowledge Graph Chatbots](https://arxiv.org/abs/2302.06466) (Feb 2023)
45. [What ChatGPT and generative AI mean for science](https://www.nature.com/articles/d41586-023-00340-6) (Feb 2023)
46. [Applying BERT and ChatGPT for Sentiment Analysis of Lyme Disease in Scientific Literature](https://arxiv.org/abs/2302.06474) (Feb 2023)
47. [Exploring AI Ethics of ChatGPT: A Diagnostic Analysis](https://arxiv.org/abs/2301.12867) (Jan 2023)
48. [ChatGPT for Good? On Opportunities and Challenges of Large Language Models for Education](https://www.edu.sot.tum.de/fileadmin/w00bed/hctl/_my_direct_uploads/ChatGPT_for_Good_.pdf) (Jan 2023)
49. [The political ideology of conversational AI: Converging evidence on ChatGPT's pro-environmental, left-libertarian orientation](https://arxiv.org/abs/2301.01768) (Jan 2023)
50. [Techniques to improve reliability - OpenAI Cookbook](https://github.com/openai/openai-cookbook/blob/main/techniques_to_improve_reliability.md)
51. [Awesome ChatGPT Prompts](https://github.com/f/awesome-chatgpt-prompts)
52. [Introducing ChatGPT](https://openai.com/blog/chatgpt) (Nov 2022)
