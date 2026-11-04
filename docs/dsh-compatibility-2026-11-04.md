# DSH 兼容性检查：2026-11-04

市场以 `main@ade9f83` 的 10 个插件、16 个目录版本为准。当天 npm `latest` / `next` 为 `0.2.1-rc.5`，`alpha` 为 `0.2.2-alpha.3`。本机安装的官网 Windows Desktop 为 rc.5，手动检查更新显示已是最新；安装签名有效。桌面版与 alpha 是不同通道。

## 实际支持哪些版本

没有把插件限制为只支持 rc.5，也没有为了适配新版提高最低 DSH 版本。

| 插件范围 | 保留的 `engines.dsh` | 本次实际宿主检查 |
|---|---|---|
| AgentLineage、ECAT、DT Verify、Insight、Audit、Static Check、Skill Eval、SkillOpt | `^0.2.1-rc.2` | rc.2、rc.5、alpha.3 全部通过 |
| Crowd Memory | `0.1.6-alpha.2 || ^0.2.0-rc.2` | 同上；更早版本未复测 |
| workflow-rsi | `0.1.6-alpha.2 || ^0.2.1-rc.2` | 同上；更早版本未复测 |

DSH 使用 `semver.satisfies(..., { includePrerelease: true })` 判定范围，因此 `^0.2.1-rc.2` 允许 `>=0.2.1-rc.2 <0.3.0` 的版本，包括 rc.5、0.2.1 正式版、0.2.2-alpha.3 和后续符合范围的 0.2.x。范围允许安装不等于未来每个版本都已验证。本次明确复测的旧版是 rc.2；没有宣称整套插件支持 0.1.x 或 0.2.0。

三个版本的官方 `parseMarketIndex` 均接受全部 16 个目录版本。最终 Windows 修复候选在三个实际宿主中均通过 10 插件联合加载、会话创建、命令与技能发现，以及 `skillopt_status`、`memory_search`、`lineage_status` 三项原生调用。rc.5 使用桌面安装包内的运行时；官方 npm 全量安装当时缺少 `dsh-client-ui-deepseek-model-label-1017@0.2.1-rc.5`，全局 CLI 保留 rc.2。

完整业务验收只在 Windows Desktop rc.5 上进行，并且仍有未通过项。各插件的真实调用、界面检查、依赖条件和阻断见[桌面验收记录](dsh-desktop-acceptance-2026-11-04.md)。不能把这里的宿主检查写成三个版本全部业务功能通过。

## 上游的破坏性变化

[官方 alpha.2 发布说明](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.2-alpha.2) 列出了异步会话投影句柄、Timer 返回值、`tools.resolve` / `tools.executable`、提示词组装、`agent.model` 路由、PTC 执行配置与取消分类等迁移项，并把最低 Node.js 提高到 `24.9`。部分旧会话投影接口暂有兼容入口，不能据此承诺以后一直保留。

[alpha.3 发布说明](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.2-alpha.3) 更新了 Cordis Core、Loader 和 Include，合并工作树入口并调整自动化任务。现有插件使用的接口在本次宿主检查中仍可用。本次修复不批量扩大 `engines.dsh` 范围。

AgentLineage 和 SkillOpt 部分 peer 依赖固定在 rc.2；DSH 安装器提示 peer 不匹配，但本次两个固定源码打包文件可安装，三个宿主检查也通过。普通 npm 的 peer 解析与 DSH 宿主依赖解析仍应分别验证。SkillOpt 内部优化执行器使用其随包附带的 rc.2 SDK；Desktop 宿主为 rc.5，不代表每个子执行器都已升级。

## Windows 修复与发布状态

已发布的 Env Health `1.1.2` 用原生 `spawn` 执行 `sift.cmd`，本机报 `spawn EINVAL`，Audit 和 Static Check 因而不能初始化；旧 DSH 也会复现。这是 Windows 运行入口问题，不能归因为最新 DSH 的接口变化。

[源码 PR #3](https://github.com/guixu-labs/dsh-plugin/pull/3) 的最终候选为 `63722fc25f87200fd41d67f26ac837c4b589d5f2`：九处调用改用 `cross-spawn`；SIFT 安装器补齐 Windows 原生 `.exe` 查找；修复 Env Health readonly 类型错误；空 AI 评审不再报成功；Audit、Static Check 和 Eval 的 Python 子进程强制 UTF-8，避免中文乱码及嵌套 DSH 输出读取失败。

五个库构建、类型检查及五个组合包 smoke 通过；Windows 8 项回归在本地和[相同提交的 fork CI](https://github.com/andrewyuq/dsh-plugin/actions/runs/41782195679) 通过。Static Check 的业务 smoke 和客户端检查通过。原有 Env Health/Audit/Eval 的部分库 smoke 使用 POSIX 测试入口，在 Windows 基线也失败，没有计入通过。fork CI 不是上游维护者批准或合并。

十个补丁 tarball 已生成，检查过包名、版本、无残留 `workspace:` 及 SHA-512；版本和发布顺序见[候选清单](evidence/dsh-release-candidates-2026-11-04.json)。它们已通过官方 Desktop 插件 CLI 安装并冷重启加载，但尚未发布 npm。市场索引仍指向已发布版本，不能提前指向不存在的版本。

当前源码仓库账号只有读取权限，npm 未登录。需维护者合入源码并由有权限的发布者发布，再做 registry 无缓存安装、更新市场索引、合入市场 PR 并确认 Pages 部署及匿名 HTTP 200。市场 PR 还需遵守[合并策略](pr-merge-policy.md)要求的至少一名维护者 approval。这些步骤尚未完成。

## 持续校验与复跑

`.dsh-version` 对标 alpha.3；`.dsh-compatibility.json` 同时保留 rc.2 和 rc.5。`check:policy` 要求全部 16 个目录版本覆盖整个矩阵。CI 对每个版本安装官方市场解析器并校验，部署等待所有矩阵检查通过。此 CI 仅校验目录，不下载或执行第三方插件。

运行宿主检查：`npm run smoke:runtime -- --anchor <dsh/package.json> --home <新的隔离目录> --packages <已准备的node_modules> --output <result.json>`。`--packages` 应含全部插件及依赖；脚本拒绝复用未经它创建的非空 home，不向模型发消息，不运行审计或优化，并关闭 Insight/SIFT 自动安装。Windows 应使用较短的隔离路径；长路径曾使 AgentLineage 附带运行环境就绪失败。

rc.5 的 anchor 位于安装目录 `resources/app.asar/dsh/node_modules/@deepseek-ai/dsh/package.json`，用桌面可执行文件设置 `ELECTRON_RUN_AS_NODE=1` 运行脚本。alpha.3 使用 npm 隔离安装。宿主检查复用同一批已解包插件，不等于从远程市场进行三轮全新安装。
