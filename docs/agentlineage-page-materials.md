# AgentLineage 介绍页材料

材料对应市场索引里的插件 `0.1.0-alpha.3`，来源固定为 AgentLineage 提交 `bf28b828710f1c146895bdfb63108934edbd1fe5`。本次工作重做介绍页与演示，没有重新运行真实 DSH 任务或验证真实模型的工具选择。

## 已准备

| 材料 | 路径 / 内容 | 使用方式 |
|---|---|---|
| 页面内容 | `content/plugins/agentlineage.json` | 一句话定位、场景、五步使用、条件及版本文档 |
| 最小例子 | `example`：release-note.md，write → edit → edit | 网页固定交互示意；3 条操作、diff、调用/回执示意引用 |
| 复现提问 | `example.prompt` | 安装后在自己的 DSH 中创建并两次修改发布说明，再查询来源 |
| 安装验证例子 | `quickstart.steps[3]`：lineage-check.txt | write hello → edit hello lineage，预期两次确认写入 |
| Before | `public/plugins/agentlineage/assets/before-dsh.jpg` | 仓库既有 DSH 截图：搜索发布说明并逐条查看操作 |
| After | `public/plugins/agentlineage/assets/after-viewer.jpg` | 仓库既有 Viewer 截图：按文件查看三次写入及 diff |
| 使用场景 | 代码审查、历史任务复盘、报告证据核对 | 每个场景含可复制的自然语言提问 |
| 模板与内容骨架 | `templates/plugin-page/` | 后续插件使用同一生成器、样式和交互 |

截图保持仓库原文件；本次未重跑截图背后的任务，也未用截图推断真实证据 ID。页面演示里的 `demo-session-01` 与 `demo:call-*` / `demo:result-*` 均为示意值。

## 功能与安装依据

已通过 GitHub 读取该固定提交的两份一手材料：

- [DSH 集成说明](https://github.com/fuxi-ailabs/AgentLineage/blob/bf28b828710f1c146895bdfb63108934edbd1fe5/integrations/dsh/README.md)：Node 24+、Python 3.12+、Core 0.1.0a10；托管本地 Core；自然语言到七个工具的映射；冻结快照与手动刷新；Viewer 首次本机登录。
- [插件 package.json](https://github.com/fuxi-ailabs/AgentLineage/blob/bf28b828710f1c146895bdfb63108934edbd1fe5/integrations/dsh/package.json)：包名、0.1.0-alpha.3、DSH 0.2.1-rc.2 与 Node >=24。

这里介绍 DSH 插件，没有套用 HarnessCore 中另一个 Node SDK 集成的运行方式。网页本身不启动 Core，不读取用户会话，不执行复制的命令。

## 录屏分镜（可选补充）

当前交互演示已经可以评审，视频尚未录制。若补真实 DSH 录屏，用同一个发布说明例子：

| 时间 | 镜头 | 画面 / 旁白 |
|---|---|---|
| 00–05s | 展示问题 | “谁把 release-note.md 从草稿改成待评审？” |
| 05–15s | DSH 执行最小输入 | write 创建说明，再用 edit 改功能、改状态 |
| 15–25s | 查询来源 | 刷新当前会话快照，查询该文件；出现三次确认写入 |
| 25–40s | 展开证据 | 打开 Viewer，选中文件，再展开状态修改的 diff 与原文引用 |
| 40–50s | 回到具体答案 | 指出哪个会话、哪次 edit、对应成功回执；提醒继续工作后刷新快照 |

录制要求：使用独立演示项目和会话；凭据登录不入镜；检查本机路径、用户名、会话内容和第三方数据；导出 1280×720 或更高、附中文字幕。页面示意数据录屏只能称“网页交互演示”。
