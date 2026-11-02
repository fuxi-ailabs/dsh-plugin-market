# Crowd Memory：后端 API 修复与测试录像

本录像使用 CrowdMemory 的真实源码快照，执行 Python HTTP API 修复与接口回归测试。没有向源文件植入编译或配置错误。旧 zlib 材料保留作受控构建示例与 eval 对照；首页视频改为后端 coding 任务。

## 任务来源

源仓库：`https://gitcode.com/third-party-library-for-harmony/CrowdMemory`，快照提交 `f81435bb8c6e11cc52a4b6d873e026879cf31963`。两个 Agent 各有一份干净的完整快照，使用一份新安装且初始为空的记忆 Runtime。

- A 检查 `GET /v1/status`：在正确协议头下发送 `Content-Length: abc`，原始服务端抛出 ValueError，客户端收到断连而非 HTTP 响应。修改目标为 `distributions/memory-runtime/src/crowdmemory_runtime/server.py`，新增 `tests/test_http_length_get.py`。
- B 在另一份原始源码上检查 `POST /v1/agent-ingress/dsh/events/session.start`。先读取 A 的记录，核对 GET/POST 共用的 Handler，再修复并补 `tests/test_http_length_post.py`。

测试启动实际服务进程，经 Unix socket 发送真实 HTTP 请求，检查状态码、JSON 错误结构、合法请求以及异常请求后的服务可用性，不使用 mock Handler。GET 与 POST 使用同一个 HTTP 处理函数；这是同一后端问题在两个独立工作区的复用演示，不是两个无关实现之间的泛化评测。

独立复核对每个 Agent 的最终测试分别运行原始与修复后源码，要求原始版本失败、修复后通过；再运行既有 Unix socket 接口测试，并额外实际发送 GET/POST 请求。具体数量、退出码和完整错误响应在公开的 `assets/coding-evidence.json` 中，不用截图中的 shell 管道退出码代替 pytest 结果。

独立复核结果：A 原始源码为 7 failed / 4 passed，应用 patch 后 11 passed；B 原始源码为 10 failed / 2 passed，应用 patch 后 12 passed。两份修复后的源码各自运行既有 UDS 测试，均 3 passed。额外直接请求确认 GET 和 POST 的非法长度均返回 HTTP 400、`invalid_content_length`、`retryable: false`；同一服务之后的 GET 状态查询和合法 POST 会话创建均返回 200。

具体 prompt、源提交描述和两个 Agent 实际产生的 patch 见 `coding-task/`。任务修改只保存在隔离工作区与演示 patch；本市场 PR 不更改已发布 Runtime 的代码或版本。

patch 为无上下文的 unified diff，避免作为文档入库时空白上下文行触发 whitespace 检查。在对应干净快照中运行 `git apply --unidiff-zero /path/to/agent-a.patch`（或 agent-b.patch），再运行其中新增的测试。独立复核已实际应用公开 patch，确认还原出的源文件与测试哈希等于 Agent 的最终文件。

## 环境与范围

录像在当前版本发布前录制；录制使用的包版本由 [coding-evidence.json 的 versions 字段](../../public/plugins/crowdmemory/assets/coding-evidence.json) 记录，不能将录像中的测试结果当作当前版本的重新实测。示例环境为 DSH `0.1.6-alpha.2`、Node `22.23.3`、macOS arm64。模型请求名为 `claude-sonnet-4-6`，经既有兼容中继调用，后端身份未独立核验。

当前推荐安装 npm runtime / adapter `0.1.1`，命令见[介绍页安装步骤](../../public/plugins/crowdmemory/index.html#quickstart)。

Python 3.11、pytest 和项目依赖预先准备。测试进程的 PYTHONPATH 显式优先当前快照的 src 和 distributions 源目录；实际打印并核对导入的 server.py 路径，防止误测已安装包。源码按其 Makefile 的 bootstrap 步骤准备依赖后，可运行新增测试及 `tests/test_crowdmemory_ingress_uds.py` 复现。

接口测试在 macOS 上经本机 Unix socket 运行，不是公网部署、负载测试或跨平台设备验收。运行依据保留测试与实际响应，市场 PR 另运行自己的 `npm run ci`。

这是本机不同工作区之间的经验复用，既不是生产故障评测，也不是跨机器团队发布。不能从视频推断耗时、工具调用数或任务成功率改进。真实 read 回执和最终测试应分别核对；不把读过记忆直接等同于采用正确，也不把测试成功当作会话结束后的信任判定。

## 素材与复核

首页视频为 `assets/coding-agent-demo.mp4`，有海报和中文字幕；`assets/coding-evidence.json` 提供实际会话、记忆来源、读取回执、source/patch/媒体哈希和独立测试结果。

发布片段包括运行后展开原始工具卡片的查看过程，按请求复现、服务端修改、响应与测试、写记忆、另一 Agent 读取并验证的顺序剪辑。全部为真实 DSH 浏览器画面；没有重画界面、替换工具结果或模拟输出。字幕是说明文字，非原始终端输出。长录像、完整压缩日志和数据库快照保留本机，不公开鉴权配置。
