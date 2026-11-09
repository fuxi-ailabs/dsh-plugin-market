# DSH 记忆卡注入与采用演示

2026-11-09 录制。两个 DSH Agent 使用鸿蒙 PC Python 三方库适配记录，修复验证启动脚本，通过 Crowd Memory 传递修法。

## 画面与证据

1. Agent 1 处理 apriltag-python 的启动准备问题，生成带条件、原因、代码修法和来源的记忆卡。
2. Runtime 封存 Raw，通过其 build_draft 形成草稿，再调用 Center 的 `form_candidates` 和 `validate_candidate`，保留聚合、候选、核验产物。
3. 卡片以插件上下文消息自动进入 Agent 2 的第一步。Agent 2 处理 nerdd-module / RDKit 的目录条件，修改启动脚本并运行测试。
4. Runtime 的只读回执显示同一条记录 revision 2 的 `pushed=1`、`applied=1`，采用路径为 `launch-verification.sh`。脚本 diff 与前后测试输出一并保留。

`card-use/agent-2-injection.json` 保存 DSH 注入消息。Agent 2 执行修复时，记忆工具的主动调用次数为零。`card-use/agent-2/memory-usage.json` 保存对应任务的原始 SQLite 回执，`fix_path` 表示工具写入了该卡结构化修复所指向的文件。

`card-use/memory-card.md` 是 Agent 1 生成的卡片展示文本。`card-use/pipeline/` 保留两份 Raw 输入原文、Center 输入草稿、聚合报告、Candidate 和核验结果。中心候选当前为 `single_source`、`needs_human`，本地卡片的信任状态为 `local_auto`。

## 数据与测试范围

适配记录固定于 `migbot-experience-raw` 的 `automemory/host-27` 分支提交 `343c60fd2309dbf1edf6d3169b80838c54e1f1cd`，路径与哈希见 `sources.json`。启动脚本和三项测试是为演示构造的可复现任务，验证目录传入新进程、保留已有路径与避免空路径项。鸿蒙原生库的适配结果保留在原始档案中。

Agent 1 首轮测试通过管道截取输出，模型看到失败断言，但 shell 管道返回 0。随后人工要求保留原始退出码，复跑通过并将卡片和补丁精简为 revision 2。最终 Agent 2 修复前后执行相同命令，以 shell 输出中的退出码标记保留 Python 测试的 1→0 变化；追加 echo 的外层 shell 返回 0。首次使用检查读取了尚待封存的 outbox，后续改为只读查询 Runtime SQLite。提示、工具结果与修订过程均保存于 `card-use/`。

DSH 为 0.1.6-alpha.2，Runtime 与适配器为 0.1.1。请求模型为 `claude-sonnet-4-6`，使用兼容中继。

## 重放与编码

将 `card-use/fixture/launch-verification.sh`、`test-launch.py` 和任一 `agent-*-context.json` 放入独立目录，将 context 文件命名为 `context.json`，执行 `python3 test-launch.py`。修复版本分别位于 `card-use/agent-1/` 与 `card-use/agent-2/`。

画面为浏览器原生捕获，聚焦尺寸 3840×1920，双 Agent 尺寸各为 1920×1920。配音使用云扬 `zh-CN-YunyangNeural`、`+0%`，全文一次连续合成。输出包含嵌入字幕的 4K 原片和网页默认 1080p 版本。

字幕距画面底边 28 px。`video-callouts.json` 将 26 条字幕对应到 54 段红框标注，按旁白切换到配置、卡片、代码、测试和回执中的具体位置。自动注入片段在源画面第 3.5 秒停帧，保留卡片编号、来源和命中说明供后续旁白指认。

```sh
python synthesize-narration.py /absolute/path/audio
python encode-narrated-video.py /absolute/path/captures/focus \
  /absolute/path/captures/original /absolute/path/audio /absolute/path/output
```
