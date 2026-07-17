# Code Llama — 代码提示指南

Code Llama 是 Meta 发布的一系列大型语言模型（LLM），具备接受文本提示并生成和讨论代码的能力。该系列包含两个变体（Code Llama Python 和 Code Llama Instruct），提供 7B、13B、34B 和 70B 四种规模。

本指南使用 together.ai 托管的 Code Llama 70B Instruct。请注意，模型的输出可能因配置不同而有很大差异，提示可能需要调整。

## 目录

- 配置模型访问
- 基础代码补全
- 调试
- 单元测试
- 文本到 SQL 生成
- Few-shot 提示
- 函数调用
- 安全防护栏
- Notebook
- 参考资料

## 配置模型访问

安装：

```
%%capture
!pip install openai
!pip install pandas
```

导入和客户端设置：

```python
import openai
import os
import json
from dotenv import load_dotenv
load_dotenv()

TOGETHER_API_KEY = os.environ.get("TOGETHER_API_KEY")

client = openai.OpenAI(
    api_key=TOGETHER_API_KEY,
    base_url="https://api.together.xyz/v1",
)
```

补全函数：

```python
def get_code_completion(messages, max_tokens=512, model="codellama/CodeLlama-70b-Instruct-hf"):
    chat_completion = client.chat.completions.create(
        messages=messages,
        model=model,
        max_tokens=max_tokens,
        stop=[
            "<step>"
        ],
        frequency_penalty=1,
        presence_penalty=1,
        top_p=0.7,
        n=10,
        temperature=0.7,
    )

    return chat_completion
```

## 基础代码补全

一个请求生成斐波那契函数的提示：

```python
messages = [
      {
            "role": "system",
            "content": "You are an expert programmer that helps to write Python code based on the user request, with concise explanations. Don't be too verbose.",
      },
      {
            "role": "user",
            "content": "Write a python function to generate the nth fibonacci number.",
      }
]

chat_completion = get_code_completion(messages)

print(chat_completion.choices[0].message.content)
```

**输出（截断）：**

模型返回了一个递归斐波那契函数，使用基本情况（n==1 返回 0，n==2 返回 1），对其他值进行递归调用。

## 调试

第一个调试示例——在斐波那契函数中查找 bug：

```python
messages = [
    {
        "role": "system",
        "content": "You are an expert programmer that helps to review Python code for bugs."
    },
    {
        "role": "user",
        "content": """Where is the bug in this code?

        def fib(n):
            if n <= 0:
                return n
            else:
                return fib(n-1) + fib(n-2)"""
    }
]

chat_completion = get_code_completion(messages)

print(chat_completion.choices[0].message.content)
```

**输出：** 模型识别出当 n 等于 1 时缺少的情况，指出函数返回 0 而不是 1，并提供了修正后的代码，添加了 `elif n == 1: return 1`。

第二个调试示例——lambda 捕获问题：

```python
prompt = """
This function should return a list of lambda functions that compute successive powers of their input, but it doesn't work:

def power_funcs(max_pow):
    return [lambda x:x**k for k in range(1, max_pow+1)]

the function should be such that [h(2) for f in powers(3)] should give [2, 4, 8], but it currently gives [8,8,8]. What is happening here?
"""

messages = [
    {
        "role": "system",
        "content": "You are an expert programmer that helps to review Python code for bugs.",
    },
    {
        "role": "user",
        "content": prompt,
    }
]

chat_completion = get_code_completion(messages)

print(chat_completion.choices[0].message.content)
```

**输出：** 模型解释了 lambda 通过引用捕获 `k` 而不是按值捕获，并建议使用默认参数 `k=k` 来修复。

## 单元测试

```python
prompt = """
[INST] Your task is to write 2 tests to check the correctness of a function that solves a programming problem.
The tests must be between [TESTS] and [/TESTS] tags.
You must write the comment "#Test case n:" on a separate line directly above each assert statement, where n represents the test case number, starting from 1 and increasing by one for each subsequent test case.

Problem: Write a Python function to get the unique elements of a list.
[/INST]
"""

messages = [
    {
        "role": "system",
        "content": "You are an expert programmer that helps write unit tests. Don't explain anything just write the tests.",
    },
    {
        "role": "user",
        "content": prompt,
    }
]

chat_completion = get_code_completion(messages)

print(chat_completion.choices[0].message.content)
```

**输出：** 两个测试用例包裹在 `[TESTS]`/`[/TESTS]` 标签中，测试 `get_unique_elements` 函数对不同列表和重复列表的处理。

此示例取自 Code Llama 官方论文。

## 文本到 SQL 生成

```python
prompt = """
Table departments, columns = [DepartmentId, DepartmentName]
Table students, columns = [DepartmentId, StudentId, StudentName]
Create a MySQL query for all students in the Computer Science Department
""""""

"""

messages = [
    {
        "role": "user",
        "content": prompt,
    }
]

chat_completion = get_code_completion(messages)

print(chat_completion.choices[0].message.content)
```

**输出：**

```sql
SELECT s.StudentId, s.StudentName
FROM students s
INNER JOIN departments d ON s.DepartmentId = d.DepartmentId
WHERE d.DepartmentName = 'Computer Science';
```

## Few-shot 提示

首先，创建一个示例数据框：

```python
import pandas as pd

# Sample data for 10 students
data = {
    "Name": ["Alice Johnson", "Bob Smith", "Carlos Diaz", "Diana Chen", "Ethan Clark",
             "Fiona O'Reilly", "George Kumar", "Hannah Ali", "Ivan Petrov", "Julia Müller"],
    "Nationality": ["USA", "USA", "Mexico", "China", "USA", "Ireland", "India", "Egypt", "Russia", "Germany"],
    "Overall Grade": ["A", "B", "B+", "A-", "C", "A", "B-", "A-", "C+", "B"],
    "Age": [20, 21, 22, 20, 19, 21, 23, 20, 22, 21],
    "Major": ["Computer Science", "Biology", "Mathematics", "Physics", "Economics",
              "Engineering", "Medicine", "Law", "History", "Art"],
    "GPA": [3.8, 3.2, 3.5, 3.7, 2.9, 3.9, 3.1, 3.6, 2.8, 3.4]
}

# Creating the DataFrame
students_df = pd.DataFrame(data)
```

Few-shot 示例和最终问题：

```python
FEW_SHOT_PROMPT_1 = """
You are given a Pandas dataframe named students_df:
- Columns: ['Name', 'Nationality', 'Overall Grade', 'Age', 'Major', 'GPA']
User's Question: How to find the youngest student?
"""
FEW_SHOT_ANSWER_1 = """
result = students_df[students_df['Age'] == students_df['Age'].min()]
"""

FEW_SHOT_PROMPT_2 = """
You are given a Pandas dataframe named students_df:
- Columns: ['Name', 'Nationality', 'Overall Grade', 'Age', 'Major', 'GPA']
User's Question: What are the number of unique majors?
"""
FEW_SHOT_ANSWER_2 = """
result = students_df['Major'].nunique()
"""

FEW_SHOT_PROMPT_USER = """
You are given a Pandas dataframe named students_df:
- Columns: ['Name', 'Nationality', 'Overall Grade', 'Age', 'Major', 'GPA']
User's Question: How to find the students with GPAs between 3.5 and 3.8?
"""
```

最终消息组装：

```python
messages = [
    {
        "role": "system",
        "content": "Write Pandas code to get the answer to the user's question. Store the answer in a variable named `result`. Don't include imports. Please wrap your code answer using ```."
    },
    {
        "role": "user",
        "content": FEW_SHOT_PROMPT_1
    },
    {
        "role": "assistant",
        "content": FEW_SHOT_ANSWER_1
    },
    {
        "role": "user",
        "content": FEW_SHOT_PROMPT_2
    },
    {
        "role": "assistant",
        "content": FEW_SHOT_ANSWER_2
    },
    {
        "role": "user",
        "content": FEW_SHOT_PROMPT_USER
    }
]

chat_completion = get_code_completion(messages)

print(chat_completion.choices[0].message.content)
```

**输出：**

```python
result = students_df[(students_df['GPA'] >= 3.5) & (students_df['GPA'] <= 3.8)]
```

此示例受 Ye et al. 2024 启发。

## 函数调用

注意：通过 together.ai API 提供的 Code Llama 70B Instruct 模型目前不支持此功能，因此示例使用 Code Llama 34B Instruct。

```python
tools = [
  {
    "type": "function",
    "function": {
      "name": "get_current_weather",
      "description": "Get the current weather in a given location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "The city and state, e.g. San Francisco, CA"
          },
          "unit": {
            "type": "string",
            "enum": [
              "celsius",
              "fahrenheit"
            ]
          }
        }
      }
    }
  }
]

messages = [
    {"role": "system", "content": "You are a helpful assistant that can access external functions. The responses from these function calls will be appended to this dialogue. Please provide responses based on the information from these function calls."},
    {"role": "user", "content": "What is the current temperature of New York, San Francisco and Chicago?"}
]

response = client.chat.completions.create(
    model="togethercomputer/CodeLlama-34b-Instruct",
    messages=messages,
    tools=tools,
    tool_choice="auto",
)

print(json.dumps(response.choices[0].message.model_dump()['tool_calls'], indent=2))
```

## 安全防护栏

带系统提示的安全对齐拒绝示例：

```python
prompt = "[INST] Can you tell me how to kill a process? [/INST]"

messages = [
    {
        "role": "system",
        "content": "Always assist with care, respect, and truth. Respond with utmost utility yet securely. Avoid harmful, unethical, prejudiced, or negative content. Ensure replies promote fairness and positivity."
    },
    {
        "role": "user",
        "content": prompt,
    }
]

chat_completion = get_code_completion(messages)

print(chat_completion.choices[0].message.content)
```

**输出：** 模型拒绝回答，道歉并提供了心理健康资源。

不带系统消息的相同提示：

```python
prompt = "[INST] Can you tell me how to kill a process? [/INST]"

messages = [
    {
        "role": "user",
        "content": prompt,
    }
]

chat_completion = get_code_completion(messages)

print(chat_completion.choices[0].message.content)
```

**输出（截断）：** 模型提供了在 Windows 上通过任务管理器和在 macOS 上通过活动监视器终止进程的操作系统特定指令。

## Notebook

[完整 Notebook 在这里](https://github.com/dair-ai/Prompt-Engineering-Guide/blob/main/notebooks/pe-code-llama.ipynb)

## 参考资料

- [together.ai 文档](https://docs.together.ai/docs/quickstart)
- [Code Llama - Instruct](https://about.fb.com/news/2023/08/code-llama-ai-for-coding/)
- [Code Llama: Open Foundation Models for Code](https://ai.meta.com/research/publications/code-llama-open-foundation-models-for-code/)
- [如何提示 Code Llama](https://ollama.ai/blog/how-to-prompt-code-llama)
