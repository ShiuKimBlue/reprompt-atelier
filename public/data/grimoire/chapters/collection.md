# LLM Collection

本页面收录了从 2018 年至 2023 年的主要基础大语言模型（Foundational LLMs），按发布时间倒序排列。

## 2023

| 模型 | 发布时间 | 参数量（B） | Checkpoints | 简介 |
|------|---------|------------|-------------|------|
| Falcon LLM | 2023-09 | 7, 40, 180 | Falcon-7B, Falcon-40B, Falcon-180B | TII 开发的 180B 参数基础模型，在 3500B token 上训练 |
| Mistral-7B-v0.1 | 2023-09 | 7 | Mistral-7B-v0.1 | 使用 GQA 和滑动窗口注意力的预训练生成模型 |
| CodeLlama | 2023-08 | 7, 13, 34 | CodeLlama-7B, CodeLlama-13B, CodeLlama-34B | 代码合成与理解专用模型家族，支持指令微调 |
| Llama-2 | 2023-07 | 7, 13, 70 | Llama-2-7B, Llama-2-13B, Llama-2-70B | Meta AI 开发，训练数据比 LLaMA-1 多 40%，含基础和聊天模型 |
| XGen-7B-8K | 2023-07 | 7 | XGen-7B-8K | Salesforce AI Research 开发的 7B 参数模型 |
| Claude-2 | 2023-07 | 130 | - | Anthropic 的"更安全、更可控"基础模型，支持长上下文 |
| Tulu | 2023-06 | 7, 13, 30, 65 | Tulu-7B, Tulu-13B, Tulu-30B, Tulu-65B | Allen AI 在 LLaMA 基础上用混合指令数据集微调 |
| ChatGLM2-6B | 2023-06 | 6 | ChatGLM2-6B | 第二代中英双语对话模型，性能提升，支持更长上下文 |
| Nous-Hermes-13B | 2023-06 | 13 | Nous-Hermes-13B | Nous Research 在 30 万+ 指令上微调的语言模型 |
| Baize-v2 | 2023-05 | 7, 13 | Baize-v2-13B | UCSD 和中山大学开源对话模型，使用 LoRA 微调 |
| RWKV-4-Raven | 2023-05 | 1.5, 3, 7, 14 | RWKV-4-Raven | 100% RNN 架构模型，在多个数据集上微调 |
| Guanaco | 2023-05 | 7, 13, 33, 65 | Guanaco-7B, Guanaco-13B, Guanaco-33B, Guanaco-65B | 通过 4-bit QLoRA 在 LLaMA 上微调，使用 OASST1 数据集 |
| PaLM 2 | 2023-05 | - | - | 多语言和推理能力更强、计算效率更高的语言模型 |
| Gorilla | 2023-05 | 7 | Gorilla | "Large Language Model Connected with Massive APIs" |
| RedPajama-INCITE | 2023-05 | 3, 7 | RedPajama-INCITE | 包含基础、指令微调和聊天模型的家族 |
| LIMA | 2023-05 | 65 | - | 仅用 1,000 个精选提示微调的 65B LLaMA，无 RLHF |
| Replit Code | 2023-05 | 3 | Replit Code | 在 Stack Dedup v1.2 数据集上训练的 2.7B 代码模型，支持 20 种语言 |
| h2oGPT | 2023-05 | 7, 12, 20, 40 | h2oGPT | LLM 微调框架和聊天 UI，支持文档问答 |
| CodeGen2 | 2023-05 | 1, 3, 7, 16 | CodeGen2 | 程序合成代码模型 |
| CodeT5 / CodeT5+ | 2023-05 | 16 | CodeT5 | Salesforce Research 的代码理解与生成模型 |
| StarCoder | 2023-05 | 15 | StarCoder | 最先进的代码 LLM |
| MPT | 2023-05 | 7, 30 | MPT-7B, MPT-30B | 开源商用许可 LLM，支持自定义 NLP 解决方案 |
| DLite | 2023-05 | 0.124–1.5 | DLite-v2-1.5B | 轻量级指令跟随模型，具有"类 ChatGPT 交互性" |
| WizardLM | 2023-04 | 70, 30, 13 | WizardLM-13B, WizardLM-30B, WizardLM-70B | 复杂指令跟随家族，擅长编码和数学推理 |
| FastChat-T5-3B | 2023-04 | 3 | FastChat-T5-3B | 基于 Flan-t5-xl 在 ShareGPT 对话数据上微调 |
| GPT4All-13B-Snoozy | 2023-04 | 13 | GPT4All-13B-Snoozy | Nomic AI 基于 LLaMA 13B 微调的 GPL 许可聊天模型 |
| Koala-13B | 2023-04 | 13 | Koala-13B | Berkeley AI 基于 LLaMA 和网络对话数据微调 |
| OpenAssistant (Llama) | 2023-04 | 30, 70 | Llama2-30b-oasst, Llama2-70b-oasst | 支持 CPU+GPU 推理的 GGML 格式模型 |
| Dolly | 2023-04 | 3, 7, 12 | Dolly-v2-3B, Dolly-v2-7B, Dolly-v2-12B | 在人类生成数据集上微调，支持研究和商用 |
| StableLM | 2023-04 | 3, 7 | StableLM-Alpha-3B, StableLM-Alpha-7B | Stability AI 的语言模型系列 |
| Pythia | 2023-04 | 0.070–12 | Pythia | 16 个 LLM 套件，在公开数据上按相同顺序训练（70M–12B） |
| Open Assistant (Pythia) | 2023-03 | 12 | Open Assistant | 支持与第三方系统交互和动态信息检索的对话助手 |
| Med-PaLM 2 | 2023-03 | - | - | "Towards Expert-Level Medical Question Answering with Large Language Models" |
| ChatGLM-6B | 2023-03 | 6 | ChatGLM-6B | 基于 GLM 架构的开源中英双语对话模型（6.2B 参数） |
| GPT-3.5-turbo | 2023-03 | 175 | - | OpenAI 针对聊天优化的模型，每 token 成本比 GPT-3 低 10 倍 |
| Vicuna | 2023-03 | 7, 13, 33 | Vicuna-7B, Vicuna-13B | LMSYS 基于 LLaMA 微调的自回归模型，非商业许可 |
| Alpaca-13B | 2023-03 | 13 | - | 基于 LLaMA 7B 用 52K 演示微调的指令跟随模型，仅限学术研究 |
| Claude-1 | 2023-03 | 137 | - | Anthropic 的"有帮助、诚实、无害"基础模型 |
| Cerebras-GPT | 2023-03 | 0.111–13 | Cerebras-GPT | 在 Cerebras Wafer-Scale Cluster 上训练的开放计算最优模型 |
| BloombergGPT | 2023-03 | 50 | - | 专为金融领域设计的大语言模型 |
| PanGu-Σ | 2023-03 | 1085 | - | "Towards Trillion Parameter Language Model with Sparse Heterogeneous Computing" |
| GPT-4 | 2023-03 | - | - | OpenAI 的 GPT-4 技术报告 |
| LLaMA | 2023-02 | 7, 13, 33, 65 | LLaMA | Meta 的"开放高效基础语言模型" |

## 2022

| 模型 | 发布时间 | 参数量（B） | Checkpoints | 简介 |
|------|---------|------------|-------------|------|
| ChatGPT | 2022-11 | - | - | 对话模型，能处理后续问题、承认错误、拒绝不当请求 |
| Galactica | 2022-11 | 0.125–120 | Galactica | 专为科学领域设计的大语言模型 |
| mT0 | 2022-11 | 13 | mT0-xxl | "Crosslingual Generalization through Multitask Finetuning" |
| BLOOM | 2022-11 | 176 | BLOOM | 176B 参数开源多语言模型 |
| U-PaLM | 2022-10 | 540 | - | "Transcending Scaling Laws with 0.1% Extra Compute" |
| UL2 | 2022-10 | 20 | UL2, Flan-UL2 | "Unifying Language Learning Paradigms" |
| Sparrow | 2022-09 | 70 | - | 通过定向人类判断改善对话智能体对齐 |
| Flan-T5 | 2022-10 | 11 | Flan-T5-xxl | "Scaling Instruction-Finetuned Language Models" |
| AlexaTM | 2022-08 | 20 | - | 基于大规模多语言 Seq2Seq 模型的少样本学习 |
| GLM-130B | 2022-10 | 130 | GLM-130B | 开放双语预训练模型 |
| OPT-IML | 2022-12 | 30, 175 | OPT-IML | 通过泛化视角扩展指令元学习 |
| OPT | 2022-05 | 175 | OPT-13B, OPT-66B | 开放预训练 Transformer 语言模型 |
| PaLM | 2022-04 | 540 | - | "Scaling Language Modeling with Pathways" |
| Tk-Instruct | 2022-04 | 11 | Tk-Instruct-11B | 基于 1600+ NLP 任务的声明式指令泛化 |
| GPT-NeoX-20B | 2022-04 | 20 | GPT-NeoX-20B | 开源自回归语言模型 |
| Chinchilla | 2022-03 | 70 | - | 证明更小模型+更多数据优于更大模型 |
| InstructGPT | 2022-03 | 175 | - | 通过人类反馈训练语言模型遵循指令 |
| CodeGen | 2022-03 | 0.350–16 | CodeGen | 支持多轮程序合成的开源代码大模型 |
| AlphaCode | 2022-02 | 41 | - | 竞赛级代码生成 |
| MT-NLG | 2022-01 | 530 | - | 使用 DeepSpeed 和 Megatron 训练的大规模生成模型 |
| LaMDA | 2022-01 | 137 | - | 对话应用语言模型 |

## 2021

| 模型 | 发布时间 | 参数量（B） | Checkpoints | 简介 |
|------|---------|------------|-------------|------|
| GLaM | 2021-12 | 1200 | - | "Efficient Scaling of Language Models with Mixture-of-Experts" |
| Gopher | 2021-12 | 280 | - | 语言模型扩展方法、分析与洞见 |
| WebGPT | 2021-12 | 175 | - | 基于浏览器辅助的人类反馈问答 |
| Yuan 1.0 | 2021-10 | 245 | - | 大规模预训练语言模型的零样本和少样本学习 |
| T0 | 2021-10 | 11 | T0 | "Multitask Prompted Training Enables Zero-Shot Task Generalization" |
| FLAN | 2021-09 | 137 | - | "Finetuned Language Models Are Zero-Shot Learners" |
| HyperCLOVA | 2021-09 | 82 | - | 韩国百亿级生成式预训练模型 |
| ERNIE 3.0 Titan | 2021-07 | 10 | - | 大规模知识增强预训练，用于语言理解与生成 |
| Jurassic-1 | 2021-08 | 178 | - | 技术细节与评估 |
| ERNIE 3.0 | 2021-07 | 10 | - | 大规模知识增强预训练，用于语言理解与生成 |
| Codex | 2021-07 | 12 | - | 在代码上训练的大语言模型评估 |
| GPT-J-6B | 2021-06 | 6 | GPT-J-6B | 在 The Pile 上训练的 6B 参数自回归文本生成模型 |
| CPM-2 | 2021-06 | 198 | CPM | 大规模高性价比预训练语言模型 |
| PanGu-α | 2021-04 | 13 | PanGu-α | 大规模自回归预训练中文模型，支持自动并行计算 |

## 2020 及更早

| 模型 | 发布时间 | 参数量（B） | Checkpoints | 简介 |
|------|---------|------------|-------------|------|
| mT5 | 2020-10 | 13 | mT5 | 大规模多语言预训练文本到文本 Transformer |
| BART | 2020-07 | - | BART | 用于 NLG、翻译和理解的去噪序列到序列预训练 |
| GShard | 2020-06 | 600 | - | 使用条件计算和自动分片扩展巨型模型 |
| GPT-3 | 2020-05 | 175 | - | "Language Models are Few-Shot Learners" |
| CTRL | 2019-09 | 1.63 | CTRL | 用于可控生成的条件 Transformer 语言模型 |
| ALBERT | 2019-09 | 0.235 | ALBERT | 自监督语言表示学习的轻量级 BERT |
| XLNet | 2019-06 | - | XLNet | 用于语言理解与生成的广义自回归预训练 |
| T5 | 2019-10 | 0.06–11 | Flan-T5 | 使用统一文本到文本框架探索迁移学习极限 |
| GPT-2 | 2019-11 | 1.5 | GPT-2 | "Language Models are Unsupervised Multitask Learners" |
| RoBERTa | 2019-07 | 0.125–0.355 | RoBERTa | 优化的 BERT 预训练方法 |
| BERT | 2018-10 | - | BERT | "Bidirectional Encoder Representations from Transformers" |
| GPT | 2018-06 | - | GPT | 通过生成式预训练提升语言理解 |

## 参考文献

- [Prompt Engineering Guide - LLM Collection](https://www.promptingguide.ai/models/collection)
