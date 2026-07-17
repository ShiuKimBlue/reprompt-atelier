# Sora

OpenAI 将 Sora 介绍为其文本到视频 AI 模型。它可以根据文本指令生成长达一分钟的视频，呈现逼真和富有想象力的场景。

OpenAI 的愿景是构建能够"理解和模拟运动中的物理世界"的 AI 系统，并训练模型解决需要现实世界交互的问题。

## 能力

Sora 生成的视频具有高视觉质量和提示遵循度。它能处理包含多个角色、多种运动类型和背景的复杂场景，并理解它们之间的关系。其他能力包括在一个视频中创建多个镜头，并在角色和视觉风格之间保持一致性。

**提示：** "A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage. She wears a black leather jacket, a long red dress, and black boots, and carries a black purse. She wears sunglasses and red lipstick. She walks confidently and casually. The street is damp and reflective, creating a mirror effect of the colorful lights. Many pedestrians walk about."

**提示：** "A movie trailer featuring the adventures of the 30 year old space man wearing a red wool knitted motorcycle helmet, blue sky, salt desert, cinematic style, shot on 35mm film, vivid colors."

*视频来源：https://openai.com/sora*

## 方法

据报道，Sora 使用**扩散模型**来生成或扩展整个视频。它采用 **Transformer 架构**来扩展性能。视频和图像被表示为 patch——类似于 GPT token——创建一个统一的视频生成系统，支持更高的时长、分辨率和纵横比。使用 DALL-E 3 的**重新标注技术**来帮助 Sora 更紧密地遵循文本指令。Sora 还可以从给定图像生成视频，实现精确的动画。

## 局限性与安全

报告的局限性包括模拟物理和理解因果关系方面的困难。提示中描述的空间细节和事件（例如相机轨迹）有时会被误解。OpenAI 报告将 Sora 提供给红队成员和创作者"以评估危害和能力"。

**提示：** "Step-printing scene of a person running, cinematic film shot in 35mm."

*视频来源：https://openai.com/sora*

更多 Sora 生成的视频示例：https://openai.com/sora
