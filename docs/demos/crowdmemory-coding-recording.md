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

视频为 3840×2160、30 fps、约 77 秒 H.264，加入普通话合成配音及随配音嵌入画面的句级字幕。讲解按实际动作推进：双 Agent 总览 → A 复现失败 → A 验证修复 → A 写入记忆 → B 读取同一来源 → B 测试 → 结果回看。总览和结尾仍是两个 Agent 并排，关键步骤改为单个 Agent 放大展示。五段聚焦画面重新从真实 DSH 记录录制，原生 3840×1920，浏览器文字放大 3 倍；双屏部分使用原生 1920×1920 原片，不放大小分辨率视频。没有重画终端或替换工具输出；两个 Agent 并非同步计时运行。

[narration.json](libpng-two-agent/narration.json) 是完整公开配音稿，使用 `zh-CN-YunyangNeural`（云扬）普通话合成音色、正常语速，不是 Agent 的现场声音。通过 [synthesize-narration.py](libpng-two-agent/synthesize-narration.py) 在隔离 Python 环境一次合成整段口播及句级时间边界；只将公开解说文本发送给语音服务。音轨不按镜头切段，也不在镜头之间另加停顿。配音只解说已有运行结果，没有补造操作或验证结论。

[encode-narrated-video.py](libpng-two-agent/encode-narrated-video.py) 接收五段原生聚焦录像、双屏原片、连续配音目录和发布资源目录；需要 Pillow、ffmpeg/ffprobe 及中文字体。先将整段音轨的语句边界与稿件逐一对齐，再据此决定镜头切换时间。视频各段不携带音频，合并后只接入一次完整主音轨，合成 AAC 单声道 48kHz，响度归一到 -16 LUFS 目标。保留 VTT 供播放器选择，网页默认不再叠加第二份字幕。编码器检查尺寸、时长与字体，全部编码成功后替换发布文件；海报取自新成片第 3 秒。实际场景时长、句级边界、原片与唯一配音源的哈希见 [narrated-encoding.json](libpng-two-agent/narrated-encoding.json)，`audio_splice_count` 为 0。原来的静音双屏编码脚本与标签板保留作历史制作依据。

当前成片、字幕、截图、原片与配音的 SHA-256，以及来源读取回执，发布在页面 `assets/coding-evidence.json`。完整原始日志、原片、合成音频、浏览器鉴权、模型请求响应与 Runtime 数据库保留录制者本机；公开内容不带凭据。旧版四 Agent 后端演示归档在 [历史说明](crowdmemory-four-agent-20261103.md)。
