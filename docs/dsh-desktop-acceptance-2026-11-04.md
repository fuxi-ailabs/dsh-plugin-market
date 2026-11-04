# Windows DSH Desktop 插件验收：2026-11-04

本次覆盖市场默认的 10 个插件。Desktop 为官网 Windows x64 `0.2.1-rc.5`，Electron Node `24.21.0`。五个受 Windows 运行入口影响的库及其组合包使用[源码 PR #3](https://github.com/guixu-labs/dsh-plugin/pull/3) 的本地补丁候选，其余使用市场固定版本。候选包尚未发布 npm。

结论：10 个插件在 rc.2、rc.5、alpha.3 的联合宿主检查通过；Desktop 上多条真实业务链路通过，但整套插件尚未完成全部功能验收。Insight Web/评分、ECAT 迭代、DT Verify 设备验证、workflow-rsi 完整发布闭环以及 Skill Eval 纯文本盲评仍有缺口。以下结果不能推广为任意项目、设备或模型上的通过。

## 逐插件结果

| 插件及本次版本 | 已执行并核对的实际功能 | 限制及未通过项 |
|---|---|---|
| AgentLineage `0.1.0-alpha.4`，固定 Git `211057d…` | 真实 Desktop 会话写入、读取、编辑文件；导入 59 个事件；目录与路径查询定位两次已确认写入和两次读取，保留 alpha → beta 内容证据；不完整归因检查正确返回 `needs_revision` | Viewer 链接已生成，未完成 Viewer 界面操作；该负例的 `semantic_verified=false`，不算完整因果图验收 |
| Crowd Memory `0.1.1` | 实际 Runtime 写入、搜索、读取；Desktop 重启后仍能检索；Runtime 重启后新会话无需调用工具即可从自动注入上下文复述先前随机标记 | Windows 通过 WSL Linux Runtime、Unix/TCP/命名管道桥连接；不是原生 Windows Runtime，也未验证系统重启后自动启动或跨机器协作 |
| workflow-rsi console `0.1.0-alpha.1` | 连接真实鉴权 wrsi-server；会话、请求、运行、洞察、试验及报告查询；执行四个程序化断言并用官方 OTLP 收集器入库 1 条运行，0 条拒收；无 `--confirm` 的写操作正确不执行 | 测试数据是隔离程序夹具；未配置完整业务 agent、资产仓库和发布链，不能宣称完整 RSI 闭环或业务增益 |
| ECAT `0.1.0-alpha.1` | 两个命令及技能可用；真实 wheel 与运行依赖安装到独立 Python 环境；执行 preflight，检查到缺失场景配置及 CLI PATH 问题 | 未完成场景配置、生成器/判别器迭代、报告及 start/open/stop 验收；配置的 `ecatPath` 不能消除脚本的 PATH 检查 |
| DT Verify `0.1.0-dev.28` | skill、`dtv_subagent` 与 5 个 preset 在三个宿主注册成功 | 本机 `hdc list targets` 为 Empty；没有本次选定项目的 Spec/验收口径，设备部署、视觉、冷启动和端到端验证未执行 |
| Insight Bundle 候选 `1.1.2` / 库 `1.1.1` | 通过原生命令导出本次测试会话，得到 v4 JSONL（20 个事件） | 外部 `context-insight@0.2.41` 的 Windows Web 构建失败；已实际尝试 SQLite 迁移、独立嵌套安装、短路径和 webpack。导入 Web、交互及真实评分均未通过 |
| Audit Bundle 候选 `1.1.2` / 库 `1.1.1` | 实际 Desktop 会话加载测试 Skill 后执行 SIFT Audit，JSON/HTML 报告有 3 条结论：1 fail、2 N/A、0 unresolved/indeterminate；原生工作台历史、报告、flyout 均可读，点击 T2 定位到真实 skill 调用的 Trajectory 及 payload/result | 模型把加载 Skill 判为违反“不读文件”规则，是否属于违规需复核，不能当作审计准确率证明。需指定 `SKILL.md` 文件或已发现技能名；Windows 深路径会使切片文件读取失败，最终使用短输出路径 |
| Static Check Bundle 候选 `1.1.3` / 库 `1.1.2` | 实际 analyze 得到预期 7/11；内置安全检查 SAFE；AI critique 返回 6 个实质维度和 JSON/HTML；原生桌面显示 7/11 与 4 项未满足要求 | SAFE 仅覆盖内置检查，外部 Aguara/skill-scanner 未安装。空维度评审已改为失败；HTTP forced tool_choice 需使用支持该模式的模型，本次使用 `deepseek-chat` |
| Skill Eval Bundle 候选 `1.1.4` / 库 `1.1.2` | init、手工 add、inspect、freeze；真实 DSH executor 执行评测；2 个触发探针均符合预期且 0 unresolved；coverage 报出真实漏测点；live task 返回整数 6 的 JSON；gate 正确返回 UNCLEAR/exit 2；report 生成 HTML；最终子进程无 GBK/UnicodeDecodeError | 当前 SIFT 比较器只收集输出文件，纯文本回答的 outputs 为空，盲评误判双方为空。该样例不能用来证明效果提升；无 Skill 对照要求显式加载该 Skill，也不能作为公平能力基线。未验证 Claude Code executor、校准和完整批量统计 |
| SkillOpt `0.2.0-alpha.1`，固定 Git `7f901e5…` | 真实模型训练与独立 holdout、2 次重复；候选修复 zero/signed-zero；独立增益 1、回归 0；应用后新 Desktop 会话输出 zero=even；回退后新会话恢复原始 zero=odd；管理页显示实验对比、应用版本和回退状态 | 第一个无独立增益实验正确拒绝应用；重复使用 holdout 的实验正确拒绝。使用隔离人工小题集，不证明生产效果；自动生成评测题集等入口未全测 |

## 验证方法与边界

Desktop 使用官方 `plugin --profile desktop add` 安装候选，并通过原生菜单退出后重启，避免把旧模块缓存当成新包。业务调用由临时测试插件进入实际 Desktop 主进程的 `agents`、`tools`、`commands`、`credentials` 服务，记录 `process.connected=true`、Desktop 可执行文件和实际会话事件；不是另外启动一个 CLI 后冒充桌面插件。

会话、技能、优化实验、记忆数据、OTLP 及输出文件均为本次隔离夹具。没有审计或上传用户原有会话，也没有把测试记忆写入 Codex 全局记忆。真实模型使用机器已有有效凭据；发现 Desktop 原先保存的默认凭据无效后，为 Desktop 新建独立凭据引用，未覆盖原有值。临时测试凭据已删除，密钥不进入报告、PR 或测试日志。

模型调用成功、进程退出 0、报告文件存在分别检查。曾遇到空 AI 评审、模板缺失、嵌套 Python GBK 读取错误及空输出比较；不能只看退出码。Windows UTF-8 修复后的最终 eval/trigger/coverage/live/report 不再出现编码错误，但 SIFT 的纯文本盲评限制仍保留为未通过项。

SIFT 使用 Env Health 实际安装的 `2.6.0-dev.558d146`。评测明确传 `executor=dsh`，通过 `SIFT_DSH_BIN` 指向 Desktop 附带 CLI 的绝对 `.cmd` 入口，并使用隔离 headless profile。未把 SIFT 默认的 `cc` executor 当成 DSH executor，也未替换全局 rc.2 CLI。暂未覆盖所有超时/取消边界。

SkillOpt 已完成真实管理页检查；Static Check 已完成原生桌面分析结果检查；Audit 已完成历史记录、报告、flyout 和证据跳转检查；Skill Eval 原生工作台可发现本次夹具，显示 2 道题并执行 inspection，正确提示 0 条程序化断言、2 条 expectation。其余界面只能按实际观察记录，不能用 API 或 HTML 文件生成替代界面验收。最终三版宿主 smoke 均复跑通过，使用 Windows 短隔离路径；它只覆盖联合加载、会话和三项调用，摘要见[宿主检查记录](evidence/dsh-runtime-smoke-2026-11-04.json)。

验收结束后已卸载临时测试插件、恢复其进程环境、删除测试凭据引用、移除固定记忆测试项目和手工夹具目录配置；SkillOpt 保持回退到原始 Skill。Windows SIFT 通过一个本机 `.cmd` 包装入口设置绝对 `SIFT_DSH_BIN` 和隔离 headless profile，未改动第三方 SIFT 源码或全局 headless 配置。恢复临时环境后再次执行 live task 得到有效 JSON、stderr 为空。正式十插件及共享 Runtime 的候选 tarball 保留，随后原生退出并冷启动，安装列表仍包含全部插件；本地服务和测试证据目录保留供复核，不代表已经配置生产业务环境。

## 候选发布与剩余动作

十个候选包来自 `guixu-labs/dsh-plugin@63722fc25f87200fd41d67f26ac837c4b589d5f2`，已检查 tarball 中无 `workspace:` 协议，完整版本、依赖、SHA-512 和发布顺序见[候选清单](evidence/dsh-release-candidates-2026-11-04.json)。发布顺序为五个库 → Runtime Bundle → 四个业务组合包。

源码上游当前账号只有 pull 权限，npm 当前返回 `ENEEDAUTH`。源码 PR 已转为 ready；相同提交的 Windows [fork CI 8 项通过](https://github.com/andrewyuq/dsh-plugin/actions/runs/41782195679)，不替代上游审查。市场 [PR #49](https://github.com/fuxi-ailabs/dsh-plugin-market/pull/49) 待至少一名维护者 approval。npm 补丁发布、无缓存 registry 安装、市场索引切换、合并、Pages 部署与匿名访问验收均未完成。

要完成整套业务验收，还需可运行的 Insight Web 依赖、ECAT 场景与 CLI 配置、DT Verify 的目标设备/项目/Spec、workflow-rsi 业务发布环境，以及 SIFT 纯文本对比问题的处理。现有证据不足以把 10 个插件标为“全部功能完整通过”。
