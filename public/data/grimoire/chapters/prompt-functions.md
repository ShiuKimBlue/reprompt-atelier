# 提示函数（Prompt Functions）

## 介绍

ChatGPT 的对话界面与编程 shell 之间存在类比关系。封装的提示可以形成函数——每个函数都有一个唯一的名称，当用输入文本调用时，根据内部规则产生输出。这创建了具有可识别名称的可复用提示。

通过将提示封装为函数，用户可以创建工作流，其中每个函数代表一个特定的步骤或任务。按顺序组合后，它们能更高效地自动化复杂流程。这使与 GPT 的交互更加结构化和强大。

在使用函数之前，模型必须意识到它的存在。**元提示（meta-prompt）**定义了函数模板。

### 元提示（模板）

```
你好，ChatGPT！希望你一切都好。我正在寻求你的帮助，想要解决一个特定的功能。我知道你有处理信息和执行各种任务的能力，这是基于提供的指示。为了帮助你更容易地理解我的请求，我将使用一个模板来描述函数、输入和对输入的处理方法。请在下面找到详细信息：

function_name：[函数名称]

input：[输入]

rule：[关于如何处理输入的说明]

我恳请你根据我提供的细节为这个函数提供输出。非常感谢你的帮助。谢谢！

我将使用方括号内的相关信息替换函数所需执行的内容。这个详细的介绍应该能够帮助你更高效地理解我的请求并提供所需的输出。格式是function_name(input)。如果你理解了，请用一个词回答"好的"
```

> 注意：此元提示在 GPT-3.5 上测试过，在 GPT-4 上表现更好。

## 实例

### 英语学习助手

此示例创建一系列函数来辅助英语学习（在 GPT-3.5 上测试，在 GPT-4 上效果更好）。

#### 函数描述

首先粘贴上述元提示，然后创建各个函数：

**`trans_word`** — 将中文翻译为英文：

```
function_name: [trans_word]
input: ["文本"]
rule: [我希望你能扮演英文翻译员、拼写纠正员和改进员的角色。我将提供包含任何语言中"文本"的输入形式，你将检测语言，翻译并用英文纠正我的文本，并给出答案。]
```

**`expand_word`** — 以更具文学性的风格扩展文本：

```
function_name: [expand_word]
input: ["文本"]
rule: [请充当一个聊天机器人、拼写纠正员和语言增强员。我将提供包含任何语言中的"文本"的输入形式，并输出原始语言。我希望你保持意思不变，但使其更具文学性。]
```

**`fix_english`** — 修正并润色英文文本：

```
function_name: [fix_english]
input: ["文本"]
rule: [请充当英文专家、拼写纠正员和语言增强员的角色。我将提供包含"文本"的输入形式，我希望你能改进文本的词汇和句子，使其更自然、更优雅。保持意思不变。]
```

#### 链式调用函数

函数可以独立运行或链式组合：

```
trans_word('婆罗摩火山处于享有"千岛之国"美称的印度尼西亚. 多岛之国印尼有4500座之多的火山, 世界著名的十大活火山有三座在这里.')
fix_english('Finally, you can run the function independently or chain them together.')
fix_english(expand_word(trans_word('婆罗摩火山处于享有"千岛之国"美称的印度尼西亚. 多岛之国印尼有4500座之多的火山, 世界著名的十大活火山有三座在这里.')))
```

为限制冗长输出，在定义函数规则后附加：

```
除非你不理解该函数，否则请不要说其他事情
```

### 多参数函数

一个从五个输入参数生成密码的多参数函数：

```
function_name: [pg]
input: ["length", "capitalized", "lowercase", "numbers", "special"]
rule: [作为一个密码生成器，我将为需要一个安全密码的个人提供帮助。我会提供包括"length"（长度）、"capitalized"（大写字母）、"lowercase"（小写字母）、"numbers"（数字）和"special"（特殊字符）在内的输入形式。你的任务是使用这些输入形式生成一个复杂的密码，并将其提供给我。在你的回答中，请不要包含任何解释或额外的信息，只需提供生成的密码即可。例如，如果输入形式是length = 8、capitalized = 1、lowercase = 5、numbers = 2、special = 1，你的回答应该是一个类似于"D5%t9Bgf"的密码。]
```

**用法：**

```
pg(length = 10, capitalized = 1, lowercase = 5, numbers = 2, special = 1)
pg(10,1,5,2,1)
```

## 延伸思考

以下项目致力于构建基于 GPT 的编程工具：

- [GitHub Copilot](https://github.com/features/copilot)
- [Microsoft AI](https://www.microsoft.com/en-us/ai)
- [chatgpt-plugins](https://openai.com/blog/chatgpt-plugins)
- [LangChain](https://github.com/hwchase17/langchain)
- [marvin](https://github.com/PrefectHQ/marvin)

这些项目面向产品客户或能用 Python 编程的用户。对于普通用户，上述简单的函数模板方法适用于日常任务。用户可以在笔记应用中记录函数并将其维护为一个库。开源 ChatGPT 工具如 ChatGPT-Next-Web、chatbox 和 ChatGPT-Desktop 也可以使用——ChatGPT-Next-Web 特别允许在初始化新聊天前添加代码片段，可以存储这些函数以供重用。
