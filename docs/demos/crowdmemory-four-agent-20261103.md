# 四个 Agent：不共享 / 共享记忆

历史记录（2026-11-03）：页面视频已替换为 [libpng 双 Agent 示例](crowdmemory-coding-recording.md)。下文描述旧录像；原片保留录制者本机，旧成片不再由页面提供。原公开运行依据归档于 [published-evidence.json](four-session/published-evidence.json)。

同屏四个 coding Agent 的真实运行画面，左列没有记忆适配器，右列共享一个 CrowdMemory Runtime。每个 Agent 使用独立工作区，四者在同一台机器上运行；上排 A、C 修复 GET 接口，下排 B、D 接手 POST 问题。C 实际写入全局记忆，D 实际搜索、读取同一条记录，核对代码后补测试和修复。

这是开发工作流演示。画面按阶段整理，并非同步计时；不据此计算耗时、工具成本或任务成功率收益。

## 任务与环境

源码为 CrowdMemory 的实际快照 `f81435bb8c6e11cc52a4b6d873e026879cf31963`，没有植入新错误。四份初始 `server.py` 的 SHA-256 完全相同。GET 与 POST 共用 `MemoryServer` 的 HTTP Handler：非法 `Content-Length: abc` 在 `int()` 解析时抛出异常，客户端拿不到结构化错误响应。目标是返回 JSON 400，保持正常请求可用，超大请求仍为 413。

四个会话均请求 `claude-sonnet-4-6`，经既有兼容中继，底层供应商身份未独立核验。使用 DSH `0.1.6-alpha.2`，记忆服务和适配器均为 npm `0.1.1`；Python 3.11、pytest、jsonschema 和模板依赖在独立临时环境中准备。每个会话上限为 48 个工具结果、600 秒，完整提示词见 [prompts.json](four-session/prompts.json)。

| 位置 | Agent | 任务 | 记忆工具 |
|---|---|---|---|
| 左上 | A / off-origin | GET 修复 | 未安装适配器 |
| 左下 | B / off-follower | POST 修复 | 未安装适配器 |
| 右上 | C / on-origin | GET 修复后记录经验 | memory_note |
| 右下 | D / on-follower | 读取 C 的经验，再处理 POST | memory_search、memory_read |

记忆记录为 `lr_01a19f7cddaa7f8dbee2fb1d9dc63e06`，来源是 C 的真实 session。D 的 Runtime 回执包含对同一记录的 `record_usage / read`。实际 session ID、来源、停止原因和摘要见 [verification.json](four-session/verification.json)，也同步发布在页面的 `assets/coding-evidence.json`。

## 独立复核

每个 Agent 只修改 `server.py` 和新增 `tests/test_http_length_demo.py`。测试启动真实服务进程，经 Unix socket 发送 HTTP 请求，不 mock Handler。独立复核在相同测试文件下分别运行原始和修复后源码，并运行既有 `test_crowdmemory_ingress_uds.py`：

| Agent | 原始源码 | 修复后源码 |
|---|---|---|
| A | 2 failed、5 passed | 7 passed |
| B | 3 failed、4 passed | 7 passed |
| C | 1 failed、3 passed | 4 passed |
| D | 1 failed、4 passed | 5 passed |

各 Agent 编写的用例划分不同，不能比较这些数量来推断收益。原始源码与修复后源码的测试输出和四份 patch 见 [four-session/](four-session/)。发布的 pytest 输出仅去除行尾空白；原始字节保留本机，摘要列入运行依据。每份 patch 在独立干净快照中用 `git apply --unidiff-zero` 应用；按源仓库 Makefile 准备隔离 Python 环境，显式将当前工作区 `src` 及三个 `distributions/*/src` 放在 PYTHONPATH 前部，再运行上述两个测试文件。

A、D 在额外回归阶段达到 600 秒时限；指定接口测试的独立复核通过，不代表整场 Agent 运行或全量回归成功。相关回归中出现的既有收集错误也不作为共享记忆的收益。最初一次依赖加载卡住的尝试已停止并在本机归档，随后换用新的隔离依赖环境，基础 UDS 检查 3 项通过后重新运行。原始停止原因均保留。

记忆记录的终局标记为 unknown，页面没有将其改写成自动核验通过或 trusted。独立测试结果与终局信任标记分别记录。本演示只覆盖同一后端共享 Handler 的不同入口和本机跨 session 复用，不外推到无关实现、跨机器团队或生产场景。

### HTTP 连接边界复核

针对 PR #41 对 B 补丁的审查意见，补充了独立检查 [check-framing.py](four-session/check-framing.py) 与 [输出](four-session/framing-check.json)。这项检查在录像之后运行，不属于 Agent 当时执行的测试，也不改变原始补丁或原有测试计数。使用录像 B 的隔离 Python 环境执行 `python check-framing.py /path/to/off-follower`，脚本以同一次 socket 写入发送非法 Content-Length 的 POST 和后续 GET，两者均声明 HTTP/1.1、Connection: keep-alive。

实测只收到一次 `HTTP/1.0 400 Bad Request`，错误码为 `invalid_content_length`，随后 EOF，没有执行第二个请求。该 Handler 继承 `BaseHTTPRequestHandler`，未覆盖默认的 `protocol_version = "HTTP/1.0"`；客户端请求 HTTP/1.1 不会使此实现启用连接复用。因此评论所述的 keep-alive 前提不适用于录像代码。若以后启用 HTTP/1.1，非法帧长后应显式关闭连接，不能把直接读取 socket 的排空逻辑当作可靠的请求边界处理。公开补丁用于还原 Agent 输出，不作为生产级 HTTP framing 修复推荐。

## 画面与编码

成片为 3840×2160、30 fps、54 秒的 H.264，使用 yuv420p 和 faststart。十二段原生 1920×920 浏览器录像按三个阶段组合为四分屏；浏览器文字放大显示、侧栏收起，未放大低分辨率视频。所有请求、工具卡片、代码、读取内容和测试结果均为真实 DSH 画面；标签板只标注四个 Agent 的位置与角色。

剪辑阶段依次为：定位与检索、修法与来源读取、各自接口测试。上下左右画面分别整理，不能用画面之间的先后或片段长度比较真实耗时。

`four-session/encode-video.py CAPTURES ASSETS` 需要 `a-1.webm` 至 `d-3.webm` 十二段录像，以及脚本同目录中已入库的 `layout.png`。标签源为 `layout.html`，以 3840×2160 浏览器 viewport 截图生成标签板。编码器先检查全部视频和标签板的尺寸、时长，在暂存目录成功生成视频与海报后才替换发布文件；海报从新成片第 27 秒提取，没有额外输入海报。

发布媒体的 SHA-256 和十二段原片摘要保存在页面运行依据中。完整会话日志、原始录像和带鉴权的浏览器配置仅保留本机；不公开凭据或 Runtime 令牌。
