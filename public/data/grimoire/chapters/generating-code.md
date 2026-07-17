# 生成代码

像 ChatGPT 这样的 LLM 在代码生成方面非常有效。在本节中，我们将介绍许多使用 ChatGPT 进行代码生成的示例。

下面所有示例都使用 OpenAI 的 Playground（Chat Mode）和 `gpt-3.5-turbo` 模型。

![ChatGPT Playground Chat Mode](/images/grimoire/chat-mode.png)

与 OpenAI 的所有聊天模型一样，你可以使用 `System Message` 来定义响应的行为和格式。我们将在提示示例中使用以下 System Message：

```
You are a helpful code assistant that can teach a junior developer how to code. Your language of choice is Python. Don't explain the code, just generate the code block itself.
```

## 基本示例

`User Message` 将是提示本身，包含你想让模型生成的特定代码的指令。下面是第一个基本代码生成提示的快照。注意最终代码是由 `Assistant` 生成的。

如果你想自己尝试，这里是提示：

```
Write code that asks the user for their name and say "Hello"
```

## 将注释转换为代码

你也可以使用这些 LLM 的代码生成能力，仅从注释生成代码。让我们看另一个将指令作为注释块传递的示例：

*提示：*
```
"""
1. Create a list of movies
2. Create a list of ratings for these movies
3. Combine them to make a json object of 10 movies with their ratings.
"""
```

*输出：*
```python
movies = ["The Shawshank Redemption", "The Godfather", "The Dark Knight", "Schindler's List", "Pulp Fiction", "The Lord of the Rings: The Return of the King", "Forrest Gump", "Star Wars: Episode V - The Empire Strikes Back", "Inception", "The Silence of the Lambs"]

ratings = [9.3, 9.2, 9.0, 8.9, 8.9, 8.9, 8.8, 8.7, 8.7, 8.6]

movie_ratings = {}

for i in range(len(movies)):
    movie_ratings[movies[i]] = ratings[i]

json_object = json.dumps(movie_ratings, indent=4)

print(json_object)
```

生成的代码看起来是可以运行的代码。然而，输出不包含重要的 `import` 语句，即 `import json`。虽然这些模型生成可运行的代码，但你必须密切关注这样的小细节，并始终确保测试你的代码。

## 完成函数或下一行

这些 LLM 也被集成到 GitHub Copilot 等工具中，使其对开发者非常有用。一个有用的功能是模型完成函数的能力。

*提示：*
```python
# function to multiply two numbers and add 75 to it

def multiply(
```

*输出：*
```python
a, b):
    result = a * b
    result += 75
    return result
```

## MySQL 查询生成

除了上面的基本代码生成示例，你可以使用模型生成可用于编程其他方面的有用代码，如创建和测试 MySQL 查询。

假设你有一个包含一些信息的数据集，你可以将其作为提示的一部分包含在内，然后指示它生成特定查询。例如：

```
"""
Table departments, columns = [DepartmentId, DepartmentName]
Table students, columns = [DepartmentId, StudentId, StudentName]
Create a MySQL query for all students in the Computer Science department
"""
```

*输出：*
```mysql
SELECT students.StudentId, students.StudentName
FROM students
INNER JOIN departments
ON students.DepartmentId = departments.DepartmentId
WHERE departments.DepartmentName = 'Computer Science';
```

模型生成了一个查询！然而，在这个示例中我们虚构了数据库，所以没有数据库来测试生成的查询。如果你正在测试这个示例，创建这个数据库可能会很有用。幸运的是，你可以使用 ChatGPT 来为你生成这个。一种方法是使用上面提示的修改版本，稍有不同的指令来生成数据库模式：

```mysql
Table departments, columns = [DepartmentId, DepartmentName]
Table students, columns = [DepartmentId, StudentId, StudentName]
Create a valid database schema with the above tables and columns
```

模型生成了以下模式：

```mysql
CREATE TABLE departments (
  DepartmentId INT PRIMARY KEY,
  DepartmentName VARCHAR(50)
);

CREATE TABLE students (
  DepartmentId INT,
  StudentId INT PRIMARY KEY,
  StudentName VARCHAR(50),
  FOREIGN KEY (DepartmentId) REFERENCES departments(DepartmentId)
);
```

你可以使用 [sqliteonline.com](https://sqliteonline.com/) 之类的工具创建临时数据库。

你还需要虚拟数据来测试原始生成的查询是否有效。让我们也使用 ChatGPT 来生成！提示可以像下面这样：

```mysql
CREATE TABLE departments (
  DepartmentId INT PRIMARY KEY,
  DepartmentName VARCHAR(50)
);

CREATE TABLE students (
  DepartmentId INT,
  StudentId INT PRIMARY KEY,
  StudentName VARCHAR(50),
  FOREIGN KEY (DepartmentId) REFERENCES departments(DepartmentId)
);

Given the database schema above, generate valid insert statements include 4 rows for each table.
```

插入语句的输出：

```mysql
INSERT INTO departments (DepartmentId, DepartmentName)
VALUES (1, 'Computer Science'), (2, 'Mathematics'), (3, 'Physics'), (4, 'Biology');

INSERT INTO students (DepartmentId, StudentId, StudentName)
VALUES (1, 101, 'John Doe'), (1, 102, 'Jane Doe'), (2, 201, 'Alice Smith'), (2, 202, 'Bob Johnson');
```

现在你有了数据库和虚拟数据，你可以测试原始查询。根据虚拟数据，结果应该是两行，包含 `Jane Doe` 和 `John Doe`。

## 解释代码

如果你正在学习某种语言编程，提示模型解释某些代码片段可能很有用。让我们重用上面生成的查询，让模型解释它。

如果你使用与之前相同的 System Message，请小心你如何指示模型。例如，如果我们使用以下示例，模型会抱怨它是 Python 代码助手，但它仍然提供解释。有时模型拒绝生成你指示的内容，因为它被设计为遵循 System Message。

*提示：*

```mysql
SELECT students.StudentId, students.StudentName
FROM students
INNER JOIN departments
ON students.DepartmentId = departments.DepartmentId
WHERE departments.DepartmentName = 'Computer Science';

Explain the above SQL statement.
```

*输出：*

```
Sorry, as a code assistant in Python, I cannot generate SQL code. However, I can explain the purpose of the SQL statement provided. 

This SQL statement selects the `StudentId` and `StudentName` columns from the `students` table, where the `DepartmentName` column in the `departments` table is equal to 'Computer Science'. To achieve this, the statement performs an inner join on the `DepartmentId` column between the `students` and `departments` tables. 

In simpler terms, it is selecting the names and IDs of students who are enrolled in the Computer Science department.
```

## 编辑代码

代码编辑类提示最好同时给出原始代码、修改目标和不能破坏的约束。例如：

```python
def calculate_total(items):
    total = 0
    for item in items:
        total = total + item["price"]
    return total
```

可以这样提示模型：

```
请重构上面的 Python 函数：
1. 保持函数签名不变；
2. 支持缺失 price 字段时按 0 处理；
3. 不要改变返回类型；
4. 只输出修改后的代码块。
```

这种提示比“帮我优化这段代码”更稳，因为它明确了修改边界、异常输入和输出格式。

## 调试代码

调试类提示应包含错误信息、复现步骤、期望行为和相关代码片段。一个更可靠的模板是：

```
我遇到了这个错误：
<粘贴完整错误信息>

复现步骤：
1. ...
2. ...

期望行为：
...

相关代码：
<粘贴最小相关代码>

请先解释最可能的根因，再给出最小修复方案。不要重写无关代码。
```

如果你希望模型帮助定位根因，避免只说“修复这个 bug”。完整错误和复现路径会显著提高回答质量。

## 最佳实践

使用 LLM 生成代码时，应把它当成辅助开发者，而不是自动可信的编译器。建议始终遵循以下做法：

- 明确语言、框架版本、运行环境和输出格式。
- 给出最小上下文，避免把整份项目无差别粘贴进去。
- 要求模型说明假设条件，尤其是外部依赖、数据库结构或 API 返回格式。
- 对生成代码运行测试、类型检查和 lint，不要只凭肉眼判断。
- 对安全敏感代码保持谨慎，例如鉴权、密钥处理、SQL、文件上传和命令执行。
