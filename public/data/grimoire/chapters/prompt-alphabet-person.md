# 用字母表绘制人物

通过多轮迭代对话，逐步修正模型生成的 TiKZ 代码。

## 第 1 轮提示

```
Produce TikZ code that draws a person composed from letters in the alphabet. The arms and torso can be the letter Y, the face can be the letter O (add some facial features) and the legs can be the legs of the letter H. Feel free to add other features.
```

## 第 2 轮反馈

```
The torso is a bit too long, the arms are too short and it looks like the right arm is carrying the face instead of the face being right above the torso. Could you correct this please?
```

## 第 3 轮反馈

```
Please add a shirt and pants.
```

## 要点

- 展示了**多轮迭代**在图像生成中的重要性
- 通过自然语言反馈逐步修正输出
- 结合 TiKZ 代码生成实现可编程的图像创作
