# 基于图的提示（Graph Prompting）

[Liu等人，2023](https://arxiv.org/abs/2302.08043)介绍了GraphPrompt，"一种新的图形提示框架，用于提高下游任务的性能"。

GraphPrompt 的核心思想是将图数据与提示工程相结合，通过学习任务特定的提示来统一不同图任务的表示。该框架包括两个关键阶段：

1. **子图采样**：从图中采样与任务相关的子图结构
2. **提示调优**：学习任务特定的提示嵌入，使不同图任务共享统一的表示空间

GraphPrompt 在多个基准数据集上展示了优于传统方法的性能，特别是在少样本场景下。

更多内容即将到来！

**相关论文：**
- [GraphPrompt: Unifying Pre-Training and Downstream Tasks for Graph Neural Networks](https://arxiv.org/abs/2302.08043)
