# Crowd Memory：zlib 受控构建示例

这份旧材料保留用于受控构建效果核对。首页现在展示[日常 coding 任务录像](crowdmemory-coding-recording.md)，不再把 zlib 配置修复作为通用 coding 场景。

2026-11-02，两个独立 DSH Agent 在本机不同工作区处理相同的受控 zlib 程序。录像与局部截图位于 `public/plugins/crowdmemory/assets/`；机器可读依据为同目录的 `demo-evidence.json`。这不是生产故障数据或性能基准。

## 环境与过程

- DSH `0.1.6-alpha.2`，Node `22.23.3`，Python `3.11.14`，macOS arm64。
- 从 npm 本地安装的 runtime / adapter 均为 `0.1.0`，不是源码工作区构建；包完整性值保存在 evidence 中。
- Runtime 使用 `session-default r3`。请求模型名 `claude-sonnet-4-6`，经兼容中继调用，后端模型身份未独立核验。
- Agent A 会话：`session-41d8bd9a-930f-468b-adb9-e8bacaf9dc63`。
- Agent B 会话：`session-562aaafe-524e-40b9-9876-5d56d0512815`。

A 先真实执行 `make`，因 `_compress2` 缺失退出 2；检查 Makefile 后加入 `-lz`，再次构建通过，再用 `memory_note` 保存全局范围笔记。B 的初始源文件和 Makefile 与 A 相同，来自独立目录。B 收到跨项目推送，执行 `memory_search`、`memory_read`，核对条件，采用记录中的实际命令，再构建通过。B 没有另外写笔记。

记录引用：`lr_01a197e780887c60bd613e79d9ca4a96`，revision 1，源项目 `agent-a`。B 的 Runtime 回执为 pushed 2、listed 1、read 1、applied 1、step_passed 1，均指向同一条记录。两边最终 Makefile 均只有预期的链接参数修改，`main.c` 保持相同。独立复制公开 fixture 重新验证了失败与成功，退出码和文件 SHA-256 保存在 evidence 中。

写入会话录制时仍打开，`recorded_outcome` 为 null；实际构建成功和 step_passed 不能替代会话结束后的信任判定。A 使用 8 次工具，B 使用 11 次工具，不能从本录像声称节省时间或工具调用。本次是本机跨项目复用，跨机器团队共享仍为内部预览。

## 录像编辑说明

56 秒视频取自真实 DSH 浏览器画面，按 A 失败、验证修复、写笔记，B 收到推送、读笔记、采用命令、验证结果排序。发布片段包含运行完成后展开原始工具卡片的查看过程；等待和环境准备已剪去，没有重画界面、替换结果或配音。中文字幕是解说，不是工具原始输出。局部 JPEG 直接裁自实际工具卡片。

原始运行长录像、完整压缩会话日志与数据库快照保留在录制者本机；公开 evidence 提供其哈希和回执摘录。未将含本机配置及登录信息的原始目录直接发布。

## 复现

1. 按组件页“安装与验证”在独立目录安装 Runtime，启动后将同一端点传给两个 DSH 会话。
2. 将本目录 `crowdmemory-fixture/main.c` 和 `Makefile` 各复制到两个空工作区。需要可用的 C 编译器、make 和 zlib 开发库。
3. 给 A 的任务：“实际构建这个程序，检查并修好失败；测试通过后，用 memory_note 记录现象、原因、核对条件和实际执行的修复命令，scope 为 global。”不要在提示中给出答案。
4. A 留下记录后，在第二个工作区启动独立 B 会话：“先运行 make 复现失败，再搜索和读取相关记忆；核对条件后采用记录中的命令，重新构建验证，只改必要的 Makefile，不写新笔记。”
5. 检查 B 收到的来源、实际执行命令、构建退出码和 Runtime 回执。模型执行具有随机性，不保证每次动作序列或耗时相同。

本次实际命令为 `sed -i '' 's/^LDLIBS =$/LDLIBS = -lz/' Makefile`，使用 macOS sed 语法；Linux 可手动修改同一行后验证，不能原样照搬该 sed 参数。
