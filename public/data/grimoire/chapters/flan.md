# Flan — 指令微调语言模型的规模化

## 概述

![flan 1](/images/grimoire/flan-1.png)

*图片来源：Scaling Instruction-Finetuned Language Models (https://arxiv.org/abs/2210.11416)*

本文研究了 [指令微调（instruction finetuning）](https://arxiv.org/pdf/2109.01652.pdf) 规模化带来的收益，以及它如何提升各种模型（PaLM、T5）、提示设置（zero-shot、few-shot、CoT）和基准测试（MMLU、TyDiQA）的性能。探索涵盖三个方面：扩展任务数量（1800 个任务）、扩展模型规模、以及在思维链（Chain-of-Thought）数据上进行微调（使用 9 个数据集）。

**微调流程：**

- 1800 个任务被表述为指令格式用于微调模型
- 使用带示例和不带示例的两种方式
- 使用带 CoT 和不带 CoT 的两种方式

微调任务与保留任务如下所示：

![flan 11](/images/grimoire/flan-11.png)

## 能力与关键结果

- 指令微调随任务数量和模型规模的增加而良好扩展；"这表明需要进一步扩大任务数量和模型规模"
- 将 CoT 数据加入微调可以在推理任务上取得良好表现
- Flan-PaLM 的多语言能力有所提升；"在 one-shot TyDiQA 上提升 14.9%；在欠代表语言的算术推理上提升 8.1%"
- Plan-PaLM 在开放式生成问题上也表现出色，表明可用性有所提升
- 在负责任 AI（RAI）基准测试中也提升了性能
- Flan-T5 指令微调模型展示了强大的 few-shot 能力，"超越了 T5 等公开检查点"

**在扩展微调任务数量和模型规模时的结果：** 预计同时扩展模型规模和微调任务数量将继续提升性能，尽管扩展任务数量的收益会逐渐递减。

![flan 2](/images/grimoire/flan-2.png)

*图片来源：Scaling Instruction-Finetuned Language Models (https://arxiv.org/abs/2210.11416)*

**使用非 CoT 和 CoT 数据微调时的结果：** 在非 CoT 和 CoT 数据上联合微调，比仅使用其中一种微调在两种评估上都能提升性能。

![flan 3](/images/grimoire/flan-3.png)

*图片来源：Scaling Instruction-Finetuned Language Models (https://arxiv.org/abs/2210.11416)*

此外，自洽性（self-consistency）结合 CoT 在多个基准测试上取得了最先进的结果。"CoT + 自洽性还在涉及数学问题的基准测试（如 MGSM、GSM8K）上显著提升了结果。"

![flan 4](/images/grimoire/flan-4.png)

*图片来源：Scaling Instruction-Finetuned Language Models (https://arxiv.org/abs/2210.11416)*

"CoT 微调解锁了零样本推理能力，通过短语 'let's think step-by-step' 在 BIG-Bench 任务上激活。" 通常，零样本 CoT Flan-PaLM 优于未经微调的零样本 CoT PaLM。

![flan 6](/images/grimoire/flan-6.png)

*图片来源：Scaling Instruction-Finetuned Language Models (https://arxiv.org/abs/2210.11416)*

以下是 PaLM 和 Flan-PaLM 在未见任务上的零样本 CoT 演示。

![flan 5](/images/grimoire/flan-5.png)

*图片来源：Scaling Instruction-Finetuned Language Models (https://arxiv.org/abs/2210.11416)*

以下是更多零样本提示的示例。"它展示了 PaLM 模型在零样本设置中遇到重复和不遵循指令等问题时的挣扎，而 Flan-PaLM 在这些情况下能够表现良好。" Few-shot 示例可以缓解这些错误。

![flan 7](/images/grimoire/flan-7.png)

*图片来源：Scaling Instruction-Finetuned Language Models (https://arxiv.org/abs/2210.11416)*

以下是更多示例，展示 Flan-PALM 模型在几种不同类型的开放式问题上的零样本能力：

![flan 8](/images/grimoire/flan-8.png)

*图片来源：Scaling Instruction-Finetuned Language Models (https://arxiv.org/abs/2210.11416)*

![flan 9](/images/grimoire/flan-9.png)

*图片来源：Scaling Instruction-Finetuned Language Models (https://arxiv.org/abs/2210.11416)*

![flan 10](/images/grimoire/flan-10.png)

*图片来源：Scaling Instruction-Finetuned Language Models (https://arxiv.org/abs/2210.11416)*

你可以在 [Hugging Face Hub 上试用 Flan-T5 模型](https://huggingface.co/google/flan-t5-xxl)。
