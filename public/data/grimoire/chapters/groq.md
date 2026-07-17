# Groq 是什么？

[Groq](https://groq.com/) 因其作为当今最快的大型语言模型推理解决方案之一而受到广泛关注。LLM 实践者对降低响应延迟非常重视，因为这是支持实时 AI 应用的关键性能指标。目前多家公司正在 LLM 推理领域展开竞争。

## 性能表现

Groq 是那些声称在 [Anyscale 的 LLMPerf 排行榜](https://github.com/ray-project/llmperf-leaderboard) 上，比其他顶尖云服务提供商快 18 倍的公司之一。Groq 目前通过 API 提供 Meta AI 的 Llama 2 70B 和 Mixtral 8x7B 等模型，由 Groq LPU™ 推理引擎驱动。

## LPU 技术

该引擎基于为运行 LLM 特别设计的定制硬件——语言处理单元（LPUs）构建。

根据 Groq 常见问题解答，"LPU 有助于减少每个单词的计算时间，从而加快文本序列的生成。" 技术细节可参阅其获得 ISCA 奖项的 [2020 年](https://wow.groq.com/groq-isca-paper-2020/) 和 [2022 年](https://wow.groq.com/isca-2022-paper/) 论文。

## 定价与速度

Groq 提供多种模型的 API 服务，定价和速度因模型而异。以下是 Groq 主要模型的定价与速度对比：

![Groq 定价与速度](/images/grimoire/groq-pricing.png)

## 关键性能指标

### 输出词元吞吐量

衡量每秒返回的平均输出词元数，基于 150 个请求的 Llama 2 70B 模型测试。Groq 在该指标上表现突出：

![输出词元吞吐量基准测试](/images/grimoire/groq-pricing.png)

### 首个词元时间（TTFT）

指 LLM 返回第一个词元所需的时间，对流媒体应用尤为重要：

![首个词元时间基准测试](/images/grimoire/groq-ttft.png)

更多详情可参阅 [Groq 在 LLMPerf 排行榜上的性能报告](https://groq.com/groq-lpu-inference-engine-crushes-first-public-llm-benchmark/)。

## 参考资料

- [Groq 官网](https://groq.com/)
- [Anyscale LLMPerf 排行榜](https://github.com/ray-project/llmperf-leaderboard)
- [LPU ISCA 2020 论文](https://wow.groq.com/groq-isca-paper-2020/)
- [LPU ISCA 2022 论文](https://wow.groq.com/isca-2022-paper/)
