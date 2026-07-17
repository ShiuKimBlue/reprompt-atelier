# 识别幻觉

让模型验证另一模型输出中的幻觉，检测不实信息。

## 提示

```
Patient's facts:
- 20 year old female
- with a history of anerxia nervosa and depression
- blood pressure 100/50, pulse 50, height 5'5''
- referred by her nutrionist but is in denial of her illness
- reports eating fine but is severely underweight

Medical Note:
The patient is a 20-year-old female with a history of anorexia nervosa and depression. She was referred by her nutritionist but is in denial of her illness. She reports eating fine but is severely underweight. Her BMI is 16.6. She has bradycardia with a heart rate of 50 bpm. She has hypotension with a blood pressure of 100/50 mmHg. She appears to have a distorted body image and is preoccupied with her weight. She also reports feeling depressed and hopeless.

Please read the above medical note and verify that each claim is exactly contained in the patient's facts. Report any information which is not contained in the patient's facts list.
```

## 分析

医疗记录中多处信息不在原始患者事实中：

| 医疗记录中的声明 | 是否在原始事实中 |
|------------------|------------------|
| BMI 16.6 | 否（未提及） |
| distorted body image | 否（推断） |
| preoccupied with weight | 否（推断） |
| depressed and hopeless | 部分（有 depression，但无 hopeless） |

## 要点

- 幻觉检测是 LLM 可靠性的关键挑战
- 通过对比原始事实与生成内容来识别不实信息
- 在医疗、法律等高风险领域尤为重要
- 参考：Bubeck et al. (2023), arXiv:2303.12712
