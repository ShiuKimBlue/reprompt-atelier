# 间接推理

反证法模板，Zhang et al. (2024) 提出的间接推理方法。相比直接推理，事实推理准确率提升 27.33%，数学证明提升 31.43%。

*提示：*
```
If a+|a|=0, try to prove that a<0.

Step 1: List the conditions and questions in the original proposition.

Step 2: Merge the conditions listed in Step 1 into one. Define it as wj.

Step 3: Let us think it step by step. Please consider all possibilities. If the intersection between wj (defined in Step 2) and the negation of the question is not empty at least in one possibility, the original proposition is false. Otherwise, the original proposition is true.

Answer:
```

*参考：* arXiv:2402.03667
