# 鸿蒙 PC Python 三方库适配资料复盘

2026-11-09 录制。两个 DSH Agent 在 macOS 上分析真实历史适配资料，通过 Crowd Memory 的本地 Runtime 记录和读取经验。

## 资料与执行范围

- Agent 1 读取 apriltag-python 3.4.5 的历史笔记、最终报告和调度器状态，提炼原生库加载路径经验并调用 `memory_note`。
- Agent 2 先获得 nerdd-module / RDKit 的历史错误与目录信息，调用 `memory_search`、`memory_read`，形成当前依赖的候选方案。之后才向它提供 RDKit 原始修法和最终报告，核对目录、验证范围和遗留问题。
- 两份原始任务分别发生于 2026-11-04 和 2026-11-02。跨库记忆读取发生在本次 DSH 复盘中。视频中的 65/66 与 `conditional_pass` 均来自 nerdd-module 历史报告。
- 记忆中心画面是服务器部署流程示意。本次实际运行范围为本地档案分析、经验保存、检索与读取。历史输入由操作人员显式提供。

原始资料固定于 `migbot-experience-raw` 的 `automemory/host-27` 分支提交 `343c60fd2309dbf1edf6d3169b80838c54e1f1cd`。精确路径、SHA-256 与运行回执见 `sources.json` 和网页中的 `harmony-python-evidence.json`。

## 可核对材料

`sources/` 保留五份原始输入文件。`agent-*-prompt.txt` 与 `agent-*-events.jsonl` 保留本次提示和工具调用，工作目录前缀统一替换为 `<demo-root>`。`candidate.md` 和 `comparison.md` 是 Agent 2 产物。环境变量拼接方式经操作人员要求修订，原提示和修订过程均保留。

DSH 为 0.1.6-alpha.2，Runtime 和适配器为 0.1.1。请求的模型为 `claude-sonnet-4-6`，通过兼容中继调用。模型供应方身份未经独立核验。

## 录制与编码

- 实际 DSH Web UI 与公开配置文档由浏览器原生捕获。
- `layout.html` 是开场与记忆中心的流程示意。
- 聚焦画面原始尺寸为 3840×1920。结尾由两个 1920×1920 原生画面并排组成，加入标题与字幕后输出 3840×2160。
- 配音使用 `zh-CN-YunyangNeural`、`+0%`，全文一次连续合成。字幕嵌入视频，网页字幕轨默认关闭。
- 网页默认加载 1080p 轻量版，提供 4K 原画选项。

在独立 Python 环境中安装 `edge-tts` 与 Pillow，系统准备 ffmpeg、ffprobe 和中文字体后，可以使用以下编码入口。原始捕获和音轨在本机录制目录保存。

```sh
python synthesize-narration.py /absolute/path/audio
python encode-narrated-video.py /absolute/path/captures/focus \
  /absolute/path/captures/original /absolute/path/audio /absolute/path/output
```
