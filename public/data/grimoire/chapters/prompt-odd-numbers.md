# 奇数求和

Chain-of-thought prompting，测试模型是否能发现前提本身的错误。

*提示：*
```
The odd numbers in this group add up to an even number: 15, 32, 5, 13, 82, 7, 1.
Solve by breaking the problem into steps. First, identify the odd numbers, add them, and indicate whether the result is odd or even.
```

*分析：* 这组数中的奇数为 15, 5, 13, 7, 1，它们的和为 41，是奇数而非偶数。前提本身是错误的，测试模型是否能识别这一点。
