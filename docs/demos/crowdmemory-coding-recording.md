# libpng 接入：两个 Agent 复用构建经验

2026-11-04，两个真实 DSH Agent 在独立工作区接入 libpng：A 处理 PNG 信息读取工具，B 处理另一个 PNG 读写目标。A 留下修法，B 搜索、读取同一条来源记录，核对本工程后再修改和测试。两个 Agent 在一台 macOS arm64 机器上依次运行，视频按阶段并排回看。

这是公开、可复现的三方库接入示例；初始 CMake 配置有意保留未链接库目标的错误。真实 libpng 及 C 源码不作修改，不能称为 libpng 上游缺陷、生产故障或鸿蒙设备验收。没有不共享记忆的控制组，也不计算速度、成本或成功率收益。既有受控 eval 仍在评测页单独说明。

## 实际任务与结果

初始文件见 [libpng-fixture](libpng-fixture/)。两边复制相同初始工程：`info` 读取 2×2 RGBA 图片并检查首像素；`roundtrip` 解码、编码、重新读取，并用尺寸和 `memcmp` 检查全部 RGBA 字节一致。测试通过不是硬编码结果。A 只修改 `info/CMakeLists.txt`，B 只修改 `roundtrip/CMakeLists.txt`，C 源码及 PNG 输入的哈希均保持一致。

| Agent | 初始构建 | 修复后独立复验 |
|---|---|---|
| A / 信息读取 | CMake 配置成功，链接 png_image_* 失败，build exit 2 | build exit 0，CTest 1/1 通过，首像素及尺寸通过；损坏输入返回非零 |
| B / 图片读写 | CMake 配置成功，链接 png_image_* 失败，build exit 2 | build exit 0，CTest 1/1 通过，PNG 读写像素一致；损坏输入返回非零 |

原始工程只有 `find_package(PNG REQUIRED)` 和包含目录，没有将 `PNG::PNG` 链接到可执行目标。A 补链接后又发现本机 `/usr/local/include` 中 1.6.43 的头文件优先于 imported target 通过 `-isystem` 带入的 1.6.59 头文件；加入 `CMAKE_NO_SYSTEM_FROM_IMPORTED ON` 后，包含目录以 `-I` 传递，编译使用的头版本与加载库均为 1.6.59。B 核对自己不同的目标名和本机旧头文件后，再采用这两个调整。

头文件优先级是本机条件，不应在其他环境盲目照搬。公开的 [A patch](libpng-two-agent/agent-a.patch)、[B patch](libpng-two-agent/agent-b.patch) 均应用到干净 fixture 独立验证；前后输出、最终配置哈希与源文件哈希见 [verification.json](libpng-two-agent/verification.json)。每份输出记录真实命令与独立退出码，不以 shell 管道末端的退出状态代替构建结果。公开输出只去除行尾空白。

## 记忆来源与人工恢复

- A：`session-d7726e40-18cf-4f27-840d-7b77ddca6c0e`。
- B：`session-95942b6d-e6b4-4103-aa90-0dcbcfc44446`。
- 记录：`lr_01a1a5fe4bee72e59f8b6dddd23f7108`，来源项目 `agent-a`，scope 为 global；B 读取 revision 2，Runtime 有对应 `record_usage / read` 回执。

初始任务错误指定 `topic_key=libpng/cmake/link-target`，不符合 `family/description` 契约，造成 A 多次写入被拒。A 最后改为 `libpng/cmake-link-target`，保存 revision 1 并正常结束。操作人员随后恢复同一个 Agent，纠正初始参数说明；A 用已有实际结果更新为 revision 2。B 读的是这个更新版本。视频中的 A 写入卡片属于恢复轮，不将这次运行描述为全程无人干预。完整初始提示和恢复提示公开在 [prompts.json](libpng-two-agent/prompts.json)。

A 也超过了提示中“不超过 16 次工具调用”的要求；实际调用数、停止原因和原始日志摘要列入 verification。这些事实不作为效率收益。记录的 `recorded_outcome` 仍为 unknown，独立功能测试通过不会将记忆改成 trusted。

## 环境与复现

请求模型为 `claude-sonnet-4-6`，经既有兼容中继，底层供应商身份未独立核验。DSH 0.1.6-alpha.2，npm Runtime / adapter 均为 0.1.1，libpng 1.6.59，CMake 4.2.1，AppleClang 17。依赖包在独立目录安装，Runtime 使用隔离 Python 环境，不作全局安装。

1. 准备 C 编译器、CMake 和 libpng 开发库，将 fixture 分别复制到两个独立工作区。
2. 使用 `python3 generate-fixture.py` 生成确定性的 PNG；提交的 `fixtures/sample.png` 即该脚本的输出。
3. 配置 `cmake -S info -B build/info -DCMAKE_PREFIX_PATH=<libpng-prefix>`，执行 `cmake --build build/info`，确认初始链接失败。按照公开 prompt 让 A 排查、修改并执行 `ctest --test-dir build/info --output-on-failure`，记录经验。
4. 在第二个工作区对 `roundtrip` 执行相同配置和构建，先复现失败，再让 B 搜索和读取 A 的记录，核对目标名与环境，修复后运行 `ctest --test-dir build/roundtrip --output-on-failure`。
5. 独立复验可在干净 fixture 上应用对应 patch，核对最终配置哈希，再执行构建和测试。原始与修复后的构建、CTest，以及损坏 PNG 的非零退出均有公开输出。不同环境的依赖发现与头文件优先级可能不同。

## 录像与公开依据

视频为 3840×2160、30 fps、54 秒 H.264，附六条中文字幕。六段原生 1920×1920 浏览器录像按三个阶段组合：真实链接失败、A 写入与 B 读取同一记录、各自测试验证。仅放大浏览器文字和展开原始工具卡片，没有重画终端、替换工具输出或放大小分辨率旧视频。两个 Agent 并非同步计时运行。

[encode-video.py](libpng-two-agent/encode-video.py) 使用 `a-1.webm` 至 `b-3.webm` 六段原片，以及同目录的 `layout.png` 标签板合成。标签源为 `layout.html`，以 3840×2160 viewport 截图。编码器检查尺寸与时长，成功生成成片及海报后才替换发布文件；海报取自新成片第 27 秒。

当前成片、字幕、截图和六段原片的 SHA-256，以及来源读取回执，发布在页面 `assets/coding-evidence.json`。完整原始日志、浏览器鉴权、模型请求响应与 Runtime 数据库保留录制者本机；公开内容不带凭据。旧版四 Agent 后端演示归档在 [历史说明](crowdmemory-four-agent-20261103.md)。
