# DSH 组织级记忆与自动核验演示

2026-11-09 录制。节点 A 与节点 B 分别运行 Runtime，使用独立端点和本地数据库，通过组织中心的 Git Raw / Release 交换经验。两个节点均运行在本机，传输绑定 127.0.0.1。Agent 1 处理 apriltag-python，Agent 2 处理 nerdd-module / RDKit。

## 新版视频的画面范围

自动核验与组织发布两个片段为机制示意，画面已标明性质，源文案位于 mechanism/。这两段说明候选自动核验、满足门槛后发布，以及证据不足时继续保留草稿。其余启动、配置和 DSH 卡片使用画面取自下列历史运行。

历史运行的 Agent 2 使用 reviewed Release，原始审核材料、Git 提交与回执继续作为运行证据保存。该运行的自动门检查仍因独立来源不足而 pending，本片的机制示意没有将它改写为自动发布成功的结果。旁白与发布镜头移除了人工审核环节。

## 历史运行证据

1. 在 DSH 原生终端启动组织中心的 Git 服务与收集进程，分别启动两个 Runtime，展示端点、节点编号、采集模板和共享组配置。
2. Agent 1 复现启动脚本问题，只增加一行 export，用相同命令复测三项通过，再调用 memory_note 形成卡片。
3. 节点 A 封存并上传 Raw 与 draft。Center 的 form_candidates 聚合证据，validate_candidate 完成结构、来源与 draft_evidence 检查。候选为 single_source，语义检查要求人工审核，recommendation 为 needs_human。
4. 任务所有者明确批准将该候选发布到隔离的 org-python-adaptation 演示共享组。审核绑定候选修订与内容摘要，中心通过 Git 发布 production/v1 Release。节点 B 的独立 Release projection 激活相同记录，trust 为 reviewed，来源为 node-a。
5. 组织卡自动进入 Agent 2 的 DSH 上下文，首次注入早于 memory_read 和代码修改。失败后同一卡再次按错误签名触发。Agent 2 读取卡片，使用当前 RDKit 的 .libs 目录修复脚本，并用相同命令复测通过，再引用组织卡记录使用结果。

当前证据保存在 org-sharing/。其中 agent-2-injection.json 保存原始插件注入消息，agent-2-sequence.json 保存持久化 DSH 事件顺序，agent-2/org-memory-usage.json 保存只读 Runtime 回执。该任务的计数为 pushed=2、read=1、cited=1。采用依据同时包含 DSH 的 memory_read、脚本 diff、前后测试与 memory_note 引用。

组织审核记录保留在 center/decision.json 和 center/owner-approval.json，发布提交见 center/release-status.json。release/node-b-projection.json 保存节点 B 的发布投影与 node-a 来源映射。center/node-*-release-sync.json 的 transport_commit 是 Git 提交，release_commit 字段沿用构建时的逻辑发布标识。

## 数据与测试范围

历史适配记录固定于 migbot-experience-raw 的 automemory/host-27 分支提交 343c60fd2309dbf1edf6d3169b80838c54e1f1cd，原始路径与哈希见 sources.json。启动脚本和三项测试是为演示构造的可复现任务，检查目录传入新进程、保留已有路径及空路径项处理。两位 Agent 均直接执行 python3 test-launch.py，工具结果保留修复前的退出码 1，修复后通过三项测试。

中心服务使用演示 supervisor 封装现有 Git 传输和 Center 接口。发布采用任务所有者的明确审核，材料的 business_replay 为 not_applicable。自动 gate 的 verified 路径未运行。reviewed 投影没有恢复结构化 fix，因此本轮回执没有 applied/fix_path，视频使用读取、引用、实际代码修改和测试呈现采用结果。

DSH 为 0.1.6-alpha.2，Runtime 与适配器为 0.1.1。请求模型为 claude-sonnet-4-6，使用兼容中继。服务启动镜头在 Agent 任务完成后补录，保留任务数据库与已发布 Release。收集器曾覆盖已批准提案的工作副本，补录前已修正为保留批准状态，并从审核 Git 提交恢复原提案。原始会话、审核提交和 Release 均保留。

## 重放与编码

将 card-use/fixture/launch-verification.sh、test-launch.py 和 org-sharing/agent-1/context.json 放入独立目录，执行 python3 test-launch.py 可复现三项失败。用 org-sharing/agent-1/launch-verification.sh 替换后重跑可验证修法。Agent 2 使用 org-sharing/agent-2/context.json 与对应脚本。早期单 Runtime 版本的记录保留在 card-use/，本片的运行依据以 org-sharing/ 为准。

画面来自 DSH 原生聊天、文件预览与 PTY 终端，聚焦录制尺寸 3840×1920，双 Agent 概览各为 1920×1920。配音使用云扬 zh-CN-YunyangNeural、+0%，全文一次连续合成。输出包含嵌入字幕的 4K 原片和网页默认 1080p 版本。

32 条字幕对应的红框按旁白指向启动命令、中心地址、配置、自动核验机制、卡片、代码、测试和回执。字幕距 4K 画面底边 280 px，为全屏原生控制条留出空间。网页内嵌播放器另留 96 CSS px 黑色区域容纳控制条。video-callouts.json 中的 capture_start_seconds 跳过终端准备过程，保留启动命令与实际输出。

```sh
python synthesize-narration.py /absolute/path/audio
python encode-narrated-video.py /absolute/path/captures/focus \
  /absolute/path/captures/original /absolute/path/audio /absolute/path/output
```
