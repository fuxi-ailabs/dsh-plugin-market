# Crowd Memory：日常 coding 任务录像

本录像使用 dsh-plugin-market 的真实仓库快照，执行 JavaScript bug 修复与回归测试。没有向源文件植入 zlib、编译器或人造配置错误。旧 zlib 材料只保留作受控构建示例和 eval 对照，不再作为首页 coding 视频。

## 任务来源

源仓库：`https://github.com/fuxi-ailabs/dsh-plugin-market`，快照提交 `b069e04a755aaaae4c89cb382a578621d84d4a80`。两个 Agent 各有一份干净的完整快照，使用一份新安装且初始为空的 Runtime。

- A 修改 `public/plugins/crowdmemory/docs.js`，补独立 Node 回归测试。问题是目录链接的关闭处理移除了 `body.nav-open`，没有同步更新 `aria-expanded`。
- B 修改 `public/plugins/workflow-rsi/docs.js`。读取 A 留下的记录后，核对目标路径和 DOM 结构，调整代码和测试。

测试覆盖初始状态、按钮打开与关闭、目录链接关闭、再次打开。它们加载实际 docs.js，在最小 DOM 桩中执行事件处理，不是浏览器或屏幕阅读器设备验收。独立复核将同一份新测试分别放到原始源文件与最终源文件上，验证原始版本失败、最终版本通过。

独立复核结果：A 原始代码 2/4 通过，最终代码 4/4；B 原始代码 3/5 通过，最终代码 5/5。四次命令直接运行 `node --test`，原始版本退出码均为 1，最终版本均为 0。实际会话中的失败命令曾通过 `tail` 显示输出，其 shell 管道退出码不作为测试成功的判断依据。

具体 prompt、源提交描述和两个 Agent 实际产生的 patch 见 `coding-task/`。任务修改仅留在隔离的录制工作区；本 PR 没有顺带修改 workflow-rsi 的产品文件。

patch 为无上下文的 unified diff，避免作为文档入库时空白上下文行触发 whitespace 检查。在对应干净快照中运行 `git apply --unidiff-zero /path/to/agent-a.patch`（或 agent-b.patch），再运行其中新增的测试。独立复核已实际应用公开 patch，确认还原出的源文件与测试哈希等于 Agent 的最终文件。

## 环境与范围

DSH `0.1.6-alpha.2`，npm runtime / adapter `0.1.0`，Node `22.23.3`，macOS arm64。模型请求名为 `claude-sonnet-4-6`，经既有兼容中继调用，后端身份未独立核验。

A 首轮模型请求长时间等待后被中断，收到“继续原任务、用中文说明”的恢复提示；该提示没有提供代码修法。中继曾触发重试。原始长录像及会话日志保留这些过程，发布视频剪去等待。

录制快照未安装仓库开发依赖，A 额外尝试 `npm test` 时遇到 `ERR_MODULE_NOT_FOUND`，还原原始脚本后同样失败。独立的新增回归测试只用 Node 内置模块，可以执行。这里不将新增回归测试通过声称为完整仓库 CI 通过；市场 PR 本身另运行 `npm run ci`。

这是本机不同工作区之间的经验复用，既不是生产故障评测，也不是跨机器团队发布。不能从视频推断耗时、工具调用数或任务成功率改进。真实 read 回执和最终测试应分别核对；不把读过记忆直接等同于采用正确，也不把测试成功当作会话结束后的信任判定。

## 素材与复核

首页视频为 `assets/coding-agent-demo.mp4`，有海报和中文字幕；`assets/coding-evidence.json` 提供实际会话、记忆来源、读取回执、source/patch/媒体哈希和独立测试结果。

发布片段包括运行后展开原始工具卡片的查看过程，按读代码、失败测试、修改、通过测试、写记忆、另一 Agent 读取并调整的顺序剪辑。全部为真实 DSH 浏览器画面；没有重画界面、替换工具结果或模拟 token 输出。字幕是说明文字，非原始终端输出。长录像、完整压缩日志和数据库快照保留本机，未直接公开包含本机配置的完整调试目录。
