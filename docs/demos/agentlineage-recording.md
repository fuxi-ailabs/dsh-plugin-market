# AgentLineage 真实 DSH 操作短片

2026-10-26 在真实 DSH 中完成发布说明的最小例子。页面的固定交互示例继续保留，实录使用独立的真实会话与证据引用。

## 成片

- 文件：`public/plugins/agentlineage/assets/dsh-release-note-demo.mp4`
- H.264 / YUV 4:2:0，1280×720，约 52 秒，约 1.1 MB，支持浏览器直接播放。
- 中文字幕：`dsh-release-note-zh.vtt`，原生播放器默认显示；无音轨、不自动播放。
- 封面来自实录的 Viewer 状态修改 diff。
- 上线后直达：<https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/agentlineage/#recording>

## 真实执行与证据

| 项目 | 已核对内容 |
|---|---|
| DSH | 0.2.1-rc.2，真实 Web 界面 |
| 模型 | DeepSeek-V4.1-Flash |
| 插件 | 0.1.0-alpha.3，固定提交 bf28b828710f1c146895bdfb63108934edbd1fe5 |
| Core | 0.1.0a10，DSH Profile 托管 |
| 实际操作 | 一次 write 创建 release-note.md；两次 edit 分别修改功能和状态；没有用 shell 写文件 |
| 溯源 | lineage_import → lineage_query → lineage_open |
| 关系核对 | 同一来源会话的三条写入，均为 confirmed / returned |
| 原文核对 | 三次调用与三次成功回执，共六条引用均能解析到完整原文 |
| 最终文件 | 搜索功能发布说明；功能为支持标题和标签搜索；状态为待评审 |

会话 ID、快照 ID、原文引用和内容/视频 SHA256 见 [实录依据](agentlineage-recording.json)。该摘要没有本机路径或凭据。

## 剪辑边界

采用真实浏览器画面采样并分段剪辑，没有重绘界面或替换工具结果。登录过程、无操作等待和轨迹总览未收入成片；Viewer 文件路径区域做了遮盖。DSH 执行与 Viewer 浏览来自同一个真实会话快照，Viewer 部分单独补录。字幕用于解释操作，不能替代原始证据。

原始截图序列、完整日志、凭据与数据库保留在本机非发布目录。公开材料只包含经过内容检查的 MP4、封面、字幕和脱敏的证据摘要。
