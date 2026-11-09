# Crowd Memory 组织试推演示

视频采用约 153 秒的连续中文配音，将 DSH 运行片段按讲解顺序剪辑。画面持续标注“开发版 / trial”。中心与 Runtime 的启动镜头在任务运行后补录，沿用同一组数据库与发布证据。

## 案例与核验范围

输入来自 migbot-experience-raw 中的鸿蒙 PC Python 三方库适配记录。当前任务在本机两个独立 Runtime 中执行，核验启动脚本如何把原生库搜索路径传递给子进程。每个任务运行相同的三项环境传递测试，覆盖目录传递、已有路径保留和空路径分量。

Agent 1 处理 apriltag-python，执行修前测试、修改 `launch-verification.sh`、执行同一命令复测，再写入记忆。中心结合 template-engine-ia/Pillow 与 fubon-api-mcp-server/TA-Lib 两个独立项目的记录形成 Candidate。两个补充来源的固定提交、原始路径和哈希见 `trial-sharing/support-manifest.json`。apriltag 与 RDKit 的归档路径见 `sources.json`。

Agent 2 处理 nerdd-module/RDKit，收到组织 trial 卡片后执行 `memory_read`，按当前 RDKit 的 `.libs` 目录修改启动脚本，复测后通过 `memory_note` 引用组织记录。

## 处理与发布

开发构建基于 `2e2e6ed414846e58582547513c208cfd0274b0dd`，接入 `bc59bcdb0dff2fa6105f559ed8eaeabd0132f4cb` 中的跨项目聚合和持续中心入口。

Runtime 将修前失败、实际修改与修后通过配成本机核验事实。中心执行 C1 原件引用、L 本机核验、C4 修改约束、C5 一致性和 C6 独立来源检查，将记录以 `trial` 状态发布到 `org-python-adaptation`。节点 B 从 Release 同步这条组织记录。

本次卡片为 `rr_problem-bdd584955b9beeea3733f59e2d2c86e7`。节点 B 的推送、读取和引用回执各一条，原始字段见 `trial-sharing/usage.json`。

此前 gate@1 的配对运行中，注入组与对照组均为 3/3，成功率差为 0，判定为 `rejected / no_lift`。该结果保留在运行依据的 `prior_gate1_result` 字段。本视频展示 gate@2 的证据核验与组织试推。

## 运行材料

- `trial-sharing/candidate.json` 保存聚合身份与支持来源。
- `trial-sharing/verification.json` 保存 gate@2 各项检查及 trial 决定。
- `trial-sharing/record.json`、`publication.json` 保存组织记录与发布结果。
- `trial-sharing/memory-card.md` 保存 Agent 1 生成的卡片。
- `trial-sharing/agent-1-events.jsonl`、`agent-2-events.jsonl` 保存 DSH 事件流。发布副本仅归一化绝对演示目录前缀，原始与发布副本哈希见网页运行依据。
- `trial-sharing/configuration/` 保存两个 Runtime 的共享配置。
- `narration.json`、`video-callouts.json` 和 `narrated-encoding.json` 保存配音、红框与编码依据。

配音为 `zh-CN-YunyangNeural`、`+0%`，全文一次合成。字幕烧录在底部，红框对应旁白指代。4K 原片与网页 1080p 版本均启用 faststart，网页使用点击加载与独立播放器控制区。
