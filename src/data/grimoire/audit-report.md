# Grimoire 内容完整性审计报告

**审计日期**: 2026-07-07  
**审计范围**: `public/data/grimoire/chapters/` 与 `src/data/grimoire/index.json`

> 本报告替代 2026-06-19 旧审计结果。旧报告中的缺失文件、旧项目路径、Prompt Hub 空壳等结论已经过期，不再作为当前维护依据。

## 当前结构摘要

- `index.json` 导航 ID：132 个可导航内容节点。
- 章节 Markdown 文件：133 个。
- `index.json` 定义但缺失的 `.md`：0 个。
- 无效 `/grimoire/*` 内链：0 个。
- 无效 `/images/grimoire/*` 图片路径：0 个。
- 检出的 orphan `.md`：1 个。

## Orphan 文件

| 文件 | 当前判断 | 处理建议 |
|------|----------|----------|
| `public/data/grimoire/chapters/prompt-hub.md` | 不在 `index.json` 导航中，且内容与 `prompts.md` 高度重复 | 删除文件属于破坏性操作，需人工确认后清理；若保留，应明确纳入导航或搜索索引策略 |

## 已处理的可见占位内容

| 文件 | 原问题 | 当前状态 |
|------|--------|----------|
| `generating-code.md` | 末尾“示例即将推出 / 即将推出”生产占位 | 已补充编辑代码、调试代码、最佳实践内容 |
| `directional-stimulus.md` | 末尾“完整示例即将推出”生产占位 | 已补充方向性刺激提示示例 |

## 当前仍需持续观察的内容质量项

- 少数章节概览或分类页有效正文较短，这不一定是错误，但未来做搜索、推荐或训练场时需要区分“概览页”和“内容页”。
- `public/data/grimoire/chapters/CLAUDE.md` 是可公开访问的内容文件，文件名容易与项目指令文件混淆；如果它是 Claude 模型介绍页，建议后续重命名并同步导航；如果是误放文件，应人工确认后清理。
- Prompt Hub 三级内容已经可导航，但未来升级为训练场时，需要为案例补充结构化拆解、练习卡和送入工作台入口。

## 建议自动化 QA 脚本

后续应增加 `npm run grimoire:audit` 或等价脚本，覆盖：

- `index.json` ID 与 `.md` 文件一致性。
- orphan file / missing file。
- `/grimoire/*` 内链目标存在性。
- `/images/grimoire/*` 图片存在性。
- `<!-- 图片:` 占位符。
- `coming soon`、`即将推出`、`正在开发中` 等生产占位词。
- 重复标题 / 重复正文 hash。
- 章节数量、section 数量、children 数量与 `CLAUDE.md` 约定一致。

## 结论

当前 Grimoire 已不再是旧报告描述的 33 文件残缺状态；核心导航与内容文件基本一致。后续重点应从“补缺失文件”转向“内容健康自动化、orphan 清理、Prompt Hub 训练场化、阅读路径与练习闭环”。
