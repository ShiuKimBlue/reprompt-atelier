# 4o 图像生成指南

*使用 4o 图像生成模型的实用指南*

![4o image generation](/images/grimoire/4o_image_generation.png)

### 什么是 4o 图像生成模型？

该模型是 OpenAI 嵌入 ChatGPT 的最新图像工具，能够生成照片级逼真的输出、进行图像转换以及在图像上渲染文本。OpenAI 确认它是自回归的，并共享 GPT-4o LLM 架构，"以 LLM 生成文本的相同方式生成图像"。这种架构支持改进的文本渲染、细粒度编辑和基于图像输入的编辑。

### 如何访问 4o 图像生成

在 ChatGPT（网页或移动端）中通过文本提示或从工具中选择"创建图像"来访问。也可以在 Sora 中访问或通过 OpenAI API 使用 gpt-image-1。

文本提示："生成一张……的图像"

![text prompt 3](/images/grimoire/text_prompt_3.JPG)

从工具箱中选择"创建图像"：

![tool select](/images/grimoire/tool_select.JPG)

通过 OpenAI API：[OpenAI API](https://platform.openai.com/docs/guides/images-vision?api-mode=responses)

![image gen API](/images/grimoire/image_gen_API.JPG)

**4o 图像生成可通过以下模型访问：**

- gpt-4o
- gpt-4o-mini
- gpt-4.1
- gpt-4.1-mini
- gpt-4.1-nano
- o3

### 4o 图像生成模型能做什么？

**创建以下宽高比的图像：**

- 正方形 1:1 1024x1024（默认）
- 横向 3:2 1536x1024
- 纵向 2:3 1024x1536

**使用以下文件类型的参考图像：**

- PNG、JPEG、WEBP、非动画 GIF

**通过以下方式编辑图像：**

**内绘（Inpainting）**（仅限在同一对话中生成的图像）

![inpainting combined](/images/grimoire/inpainting_combined.png)

**提示词编辑**（"在冬天会是什么样子？"）

![text edit combined](/images/grimoire/text_edit_combined.png)

**参考图像和风格迁移**——模型擅长使用参考图像进行重新纹理和风格变更。"Ghiblify"趋势在发布时走红。

![sam and jony](/images/grimoire/sam_and_jony.png)

![sam and jony ghiblified](/images/grimoire/sam_and_jony_ghiblified.png)

**透明背景（PNG）**——需要在提示词中注明"透明 PNG"或"透明背景"。

![inpainting combined](/images/grimoire/inpainting_combined.png)

**在图像中生成文本**

![text in images](/images/grimoire/text_in_images.png)

**以不同风格生成相同图像**

![teapot 1](/images/grimoire/teapot_1.png)

![teapot 2](/images/grimoire/teapot_2.png)

**组合图像**

![combine images](/images/grimoire/combine_images.png)

![combined](/images/grimoire/combined.png)

---

### 4o 图像生成提示技巧

#### 详细的提示词给您更多控制。

如果您的提示词缺乏描述，ChatGPT 会填充细节。这有助于快速测试，但对于特定结果，"编写详细且描述性的提示词"。

💡 如果在描述方面有困难，请要求 o3 根据您的描述编写 3 个针对 4o 图像生成优化的不同提示词，然后选择偏好的部分。

#### 光线、构图、风格

为特定目标定义这些。模型可以根据一般提示信息很好地估算，但特定结果需要准确定义。如果您想要照片般的相似性，请添加相机和镜头类型细节。

其他需要考虑的细节：主体、媒介、环境、颜色、氛围

#### 为不同的图像生成任务选择不同的模型

4o 对于一次性编辑或简单任务最快。对于多步骤生成，使用推理模型——它能更好地保持一致的元素，如风格、字体和颜色。[示例：缩略图创建过程](https://chatgpt.com/share/68404206-5710-8007-8262-6efaba15a852)。

#### 图像宽高比

在提示词中指定宽高比，即使有参考图像也是如此。模型可以从上下文线索推断正确的比例，但"在未明确指示时默认为 1:1"。

*可测试的提示词：*

```
A high-resolution photograph of a majestic Art Deco-style rocket inspired by the scale and grandeur of the SpaceX Starship, standing on a realistic launch pad during golden hour. The rocket has monumental vertical lines, stepped geometric ridges like the American Radiator Building, and a mirror-polished metallic surface reflecting a vivid sunset sky. The rocket is photorealistic, awe-inspiring, and elegant, bathed in cinematic warm light with strong shadows and a vast landscape stretching to the horizon.
```

![art deco starship](/images/grimoire/art_deco_starship.png)

#### 注意模型生成的一致性

一致性有助于小编辑但挑战创造力。模型会保留同一对话中的图像。对于独立任务，请在每次新对话中重新开始。

💡 如果早期迭代偏离方向，"要求模型输出使用的提示词"并检查错位的重点，然后在新对话中修改。

#### 使用一个提示词生成多个图像

o3 和 o4-mini 等推理模型可以每个提示词生成多个图像，但这必须明确声明且不总是有效。[示例对话](https://chatgpt.com/share/68496cf8-0120-8007-b95f-25a940298c09)。

*可测试的提示词：*

```
Generate an image of [decide this yourself], in the style of an oil painting by Van Gogh. Use a 3:2 aspect ratio. Before you generate the image, recite the rules of this image generation task. Then send the prompt to the 4o Image Generation model. Do not use DALL-E 3. If the 4o Image Generation model is timed out, tell me how much time is left until you can queue the next prompt to the model.

Rules:
- Use only the aspect ratio mentioned earlier.
- Output the prompt you sent to the image generation model exactly as you sent it, do this every time in between image generations
- Create three variations with a different subject, but the same rules. After an image is generated, immediately start creating the next one, without ending your turn or asking me for confirmation for moving forward.
```

#### 强制严格的提示词遵循很困难

多组件提示词可能在对话模型和图像模型之间被修改。同一对话中先前生成的图像也可能影响输出。

---

### 限制

- ChatGPT 可以在将您的初始提示词发送到图像模型之前进行修改，特别是在多轮任务中或使用长/无描述性的提示词时。
- 每个用户/订阅的生成限制不明确——OpenAI 表示系统是动态的，取决于订阅和服务器负载。
- 免费层级的生成通常需要排队，可能需要很长时间。
- 生成的图像可能有黄色色调。
- 提示词或参考图像中的深色元素可能产生过暗的输出。
- 当检测到 OpenAI [使用政策](https://openai.com/policies/usage-policies/)中禁止的主题时会发生生成拒绝。
- ChatGPT 内部没有放大功能。
- 模型可能出现裁剪错误，仅输出部分图像。
- 与 LLM 类似的幻觉问题。
- 在一张图像中包含许多概念或个别主题很困难。
- 图表数据可视化不精确。
- 非拉丁语言文本生成很困难。
- 编辑特定部分（例如拼写错误）并不总是有效。
- 模型命名混乱：Imagegen、gpt-image-1、4o Image Generation、image_gen.text2im 等。
- 无论指定如何，宽高比有时可能是错误的。

---

### 提示和最佳实践

⚙️ **使用 ChatGPT 个性化设置：** 要避免 DALL-E 3，请在"ChatGPT 应该具有哪些特征"设置部分添加以下内容：

> "永远不要使用 DALL-E 工具。始终使用新的图像生成工具生成图像。如果图像工具超时，请告诉我，而不是使用 DALL-E 生成。"

- 如果达到生成限制，请询问 ChatGPT 剩余时间。
- 图像生成和编辑在使用"绘制"或"编辑"等清晰术语时效果最佳。
- 推理模型让您可以看到模型如何通过提示词创建进行推理——打开思考痕迹以查看重点。

---

### 值得尝试的用例

- **生成 Logo：** 使用参考图像和详细描述配合推理模型。[示例对话](https://chatgpt.com/share/6848aaa7-be7c-8007-ba6c-c69ec1eb9c25)。
- **生成营销素材：** 使用现有视觉素材作为参考，提示对文本、产品或环境进行更改。
- **生成涂色书页面：** 使用 2:3 宽高比制作自定义页面。[示例对话](https://chatgpt.com/share/684ac538-25c4-8007-861a-3fe682df47ab)。
- **贴纸图像：** 记得提及透明背景。[示例对话](https://chatgpt.com/share/684960b3-dc00-8007-bf16-adfae003dde5)。
- **材质迁移：** 使用参考图像将材质应用于来自第二张图像或提示的主体。[示例对话](https://chatgpt.com/share/684ac8d5-e3f8-8007-9326-ea6291a891e3)。
- **室内设计：** 拍摄房间照片，提示进行家具/特征更改。[示例对话](https://chatgpt.com/share/684ac69f-6760-8007-83b9-2e8094e5ae31)。

---

### 提示词和对话示例

- [课程缩略图图像生成过程](https://chatgpt.com/share/68404206-5710-8007-8262-6efaba15a852)
- [多轮图像生成中的主体修订](https://chatgpt.com/share/6848a5e1-3730-8007-8a16-56360794722c)
- [透明背景上的纹理图标](https://chatgpt.com/share/6848a7ab-0ab4-8007-843d-e19e3f7daec8)
- [无人机鲜花配送初创公司的 Logo 设计](https://chatgpt.com/share/6848aaa7-be7c-8007-ba6c-c69ec1eb9c25)
- [浣熊吃草莓的白色轮廓贴纸](https://chatgpt.com/share/684960b3-dc00-8007-bf16-adfae003dde5)
- [使用一个提示词生成多个图像](https://chatgpt.com/share/68496cf8-0120-8007-b95f-25a940298c09)
- [使用文本提示编辑图像（夏天到冬天）](https://chatgpt.com/share/684970b8-9718-8007-a591-db40ad5f13ae)
- [大黄蜂在吉卜力工作室风格下午睡](https://chatgpt.com/share/68497515-62e8-8007-b927-59d4b5e9a876)
- [通过添加家具到自己的图像进行室内设计](https://chatgpt.com/share/684ac69f-6760-8007-83b9-2e8094e5ae31)
- [使用两个参考图像进行材质迁移](https://chatgpt.com/share/684ac8d5-e3f8-8007-9326-ea6291a891e3)

---

### 参考资料

- [Introducing 4o Image Generation](https://openai.com/index/introducing-4o-image-generation/)
- [Addendum to GPT-4o System Card: Native Image Generation](https://cdn.openai.com/11998be9-5319-4302-bfbf-1167e093f1fb/Native_Image_Generation_System_Card.pdf)
- [Gpt-image-1 in the OpenAI API](https://openai.com/index/image-generation-api/)
- [OpenAI Docs: gpt-image-1](https://platform.openai.com/docs/models/gpt-image-1)
- [OpenAI Docs: Image Generation Guide](https://platform.openai.com/docs/guides/image-generation?image-generation-model=gpt-image-1)
- [More prompt and image examples from OpenAI](https://platform.openai.com/docs/guides/image-generation?image-generation-model=gpt-image-1&gallery=open)
