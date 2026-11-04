# DSH 兼容性检查：2026-11-04

市场以 `main@ade9f83` 的 10 个插件、16 个目录版本为准。最新源码/npm alpha 为 `0.2.2-alpha.3`，npm 常规通道和官网 Windows 桌面安装包为 `0.2.1-rc.5`。两个通道的版本不同，不应把安装桌面最新版写成安装了 alpha。

## 结论与范围

现有 `engines.dsh` 范围覆盖 `0.2.1-rc.2`、`0.2.1-rc.5` 和 `0.2.2-alpha.3`。三个版本的官方 `parseMarketIndex` 均接受全部 16 个目录版本。当前 10 个默认插件版本在三个宿主中均通过联合加载、会话创建、命令与技能发现；原生工具调用检查覆盖 `skillopt_status`、`memory_search` 和 `lineage_status`。Crowd Memory 未接真实服务，验证的是服务不可用时正常降级；AgentLineage 使用插件附带的本地运行环境。

| 插件 | 本次检查的版本 | 宿主检查 |
|---|---|---|
| AgentLineage | `0.1.0-alpha.4`，Git `211057da3b42eabbf92a7f723ce8c3fa46ce05ef` | 三个版本通过 |
| Crowd Memory | `0.1.1` | 三个版本通过；服务降级路径通过 |
| workflow-rsi | `0.1.0-alpha.1` | 三个版本通过；未接真实 wrsi-server |
| ECAT | `0.1.0-alpha.1` | 三个版本的命令和 skill 注册通过 |
| 鸿蒙代码验证器 | `0.1.0-dev.28` | 三个版本的 skill 与委派工具注册通过；未跑设备 |
| Insight | `1.1.1` | 三个版本的宿主注册通过；未验证真实评分 |
| Session Audit | `1.1.1` | 三个版本的宿主注册通过；SIFT Windows 问题见下文 |
| Static Check | `1.1.2` | 三个版本的宿主注册通过；SIFT Windows 问题见下文 |
| Skill Eval | `1.1.3` | 三个版本的宿主注册通过；未跑真实模型评测 |
| SkillOpt | `0.2.0-alpha.1`，Git `7f901e565f0b34976b87fc7c85f538b441b69aaf` | 三个版本通过；状态工具调用通过 |

这不是 10 个插件全部业务流程、前端界面或设备验证的验收。历史版本做了格式与范围检查，未逐一加载。宿主检查复用了同一批已解包插件和共享运行时 `dsh-runtime-bundle@1.1.3`；不等于从远程市场完成三轮全新安装。

## 上游的破坏性变化

[官方 alpha.2 发布说明](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.2-alpha.2) 列出了需要迁移的接口：异步会话投影句柄、Timer 返回值、`tools.resolve` / `tools.executable`、提示词组装、`agent.model` 路由、PTC 执行配置与取消分类。最低 Node.js 版本提高到 `24.9`。旧会话投影注册释放函数与按 key 读取暂有兼容入口，不能据此承诺以后一直保留。

[alpha.3 发布说明](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.2-alpha.3) 还更新了 Cordis Core、Loader 和 Include，合并了工作树入口并调整了自动化任务。现有插件的注册接口在本次宿主检查中仍可用，因此本次不为这些变化批量扩大版本范围或重发插件。

AgentLineage 和 SkillOpt 的部分 peer 依赖固定在 `0.2.1-rc.2`；官方 DSH 插件安装器会提示 peer 不匹配，但此次两个本地打包文件可通过安装器安装，宿主检查也通过。后续插件发布时应同步整理 peer 声明；普通 npm 安装与 DSH 的宿主依赖解析不能混为一谈。

## Windows SIFT 问题与修复候选

已发布的 Env Health `1.1.2` 把 `sift.cmd` 交给 Node 原生 `spawn`，在本机报 `spawn EINVAL`；Audit 与 Static Check 的初始化均可复现，旧 DSH 也有相同行为。这会阻碍实际业务使用，不能用“插件加载成功”掩盖。

修复候选见 [guixu-labs/dsh-plugin PR #3](https://github.com/guixu-labs/dsh-plugin/pull/3)：SIFT 探测、Audit / Static Check / Skill Eval 执行器、Insight/npm 安装器改用 `cross-spawn`。6 项 Windows 回归检查通过，涵盖 `.cmd`、空格路径和特殊字符参数；本地候选同样通过三个宿主的 10 插件检查。候选尚待维护者合入并发布 npm 补丁，本次市场索引仍指向已发布版本。

五个受影响包构建通过，四个业务插件类型检查通过。Env Health 原有 readonly 类型错误及部分原有 smoke 在 Windows 上的失败，已在原始 `9e465e2` 复现；没有把它们计为本次通过。

## 持续校验与复跑

`.dsh-version` 对标 `0.2.2-alpha.3`；`.dsh-compatibility.json` 同时保留旧版与桌面版。`check:policy` 要求全部 16 个目录版本覆盖整个矩阵。CI 对每个版本安装官方市场解析器并校验，部署等待所有矩阵检查通过。此 CI 仅校验目录，不下载或执行第三方插件。

宿主检查使用 `npm run smoke:runtime -- --anchor <dsh/package.json> --home <新的隔离目录> --packages <已准备的node_modules> --output <result.json>`。`--packages` 应包含目录中对应版本的全部插件及其依赖。脚本拒绝复用未经它创建的非空 home；不向模型发送消息，不运行审计或优化，关闭 Insight/SIFT 自动安装。输出逐插件能力发现和三项原生调用的 JSON 结果。

Windows 桌面宿主位于安装目录 `resources/app.asar/dsh/node_modules/@deepseek-ai/dsh/package.json`，可用该桌面应用的 `ELECTRON_RUN_AS_NODE=1` 运行同一脚本。常规 Node 的 alpha 宿主使用 npm 的隔离安装。`@deepseek-ai/dsh@0.2.1-rc.5` 的本次 npm 全量安装因上游缺少 `dsh-client-ui-deepseek-model-label-1017@0.2.1-rc.5` 而失败，因此 rc.5 的宿主检查使用桌面安装包内的运行时；全局 CLI 仍保留 rc.2。

## 本机桌面状态

未发现既有 DSH Desktop 安装项、快捷方式或可执行文件后，已从[官网](https://www.deepseek.com/harness/)安装 Windows x64 `0.2.1-rc.5`，Authenticode 签名有效，签名主体为杭州深度求索人工智能基础技术研究有限公司。应用已打开，手动“检查更新”显示当前版本 `0.2.1-rc.5` 已是最新。此项只证明桌面安装与启动，不替代上述插件业务验收。
