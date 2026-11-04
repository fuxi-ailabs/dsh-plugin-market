# DSH 版本兼容监测

市场负责发现 DSH 更新、检查插件与宿主的接口边界、汇总兼容问题。插件作者只在确有破坏性变化时修复和发布，不必跟随每次 DSH 发版重发插件。旧 DSH 可以继续选择旧插件版本；市场保留各版本的真实 `engines.dsh`。

## 自动提 issue 的边界

只检查版本兼容：安装与配置加载、bundle 注册、Skill 读取、preset 挂载、工具 schema、卸载。业务任务结果、模型回答和评分、SDK/设备执行、Desktop 界面效果均不参与自动提单。

一次兼容问题必须同时满足：

1. 候选 DSH 在插件自己声明的支持范围内。
2. 新旧 DSH 的无插件对照都能启动；宿主包缺失或检测程序不能启动时，不归责插件。
3. 使用同一个已发布插件 tarball，核验 registry SHA-512；固定依赖 lock、Node、平台和检测合约。
4. 旧 DSH 在两套新 profile 中通过；新 DSH 在两套新 profile 中均失败，错误指纹相同。
5. 失败项属于上述兼容检查；发布程序根据原始观察重新判定，不直接信任报告里的 issue 草稿。

网络错误、凭据错误、超时、依赖漂移、偶发失败、旧版本就失败、未覆盖项目都不会生成兼容 issue。结果分别保留为 `BLOCKED`、`HOST_OR_HARNESS_BLOCKED`、`INCONCLUSIVE`、`BASELINE_FAILURE` 或 `NOT_DECLARED`。`PASS_TESTED_SCOPE` 仅表示这份合约覆盖的接口检查通过。

## 触发与权限

工作流：`.github/workflows/dsh-compatibility-monitor.yml`。

- 合入默认分支后，每六小时读取 npm 的 DSH 发布清单。首次检查各通道当前版本；以后检查新增版本，包括版本号低于 alpha 通道的回补版本。可通过 `workflow_dispatch` 指定已发布的精确版本。
- 基线固定为 `0.2.1-rc.2`。新版本只作为候选检查，不自动加入 `.dsh-compatibility.json`，也不升级用户的 Desktop 或演示环境。
- 执行已发布插件的 job 使用 Node `24.19.0`、pnpm `11.7.0` 和隔离 profile，没有模型或生产凭据；checkout 不保存 Git 凭据。写 issue 和结果的 job 使用默认分支的发布程序，不加载插件。
- `compatibility-results` 分支保存 `state.json` 和 `latest.json`；完整观察上传为 Actions artifact。未产出报告的候选保留待跑状态。已有结论的受阻版本可手动指定版本复跑。
- PR/Pages CI 仍只校验市场内容和解析器，不执行第三方插件。定时监测独立运行，发现失败不会把候选自动变成市场支持承诺。

`compatibility/monitor.json` 的 `notifications.mode` 当前为 `market`：确认的兼容回归自动在本市场仓库提 issue，正文写明插件仓库和证据。同平台、同检查项、同错误指纹复用原 issue；重复运行不重复发帖，后续 DSH 版本补充到原 issue。新版本再次复现已关闭的问题时重新打开。

如需直接提到插件源码仓库，将模式改为 `upstream`，并在市场仓库配置仅有目标仓库 Issues 写权限的 `COMPAT_ISSUE_TOKEN`。默认 `GITHUB_TOKEN` 不能写其他仓库；缺少该 secret 时保留草稿。`draft` 模式完全不发 issue。所有目标都必须在 `allowedRepositories` 中。手动工作流默认只生成报告，需勾选 `publish_issues` 才写状态和 issue。

## dt-verify 试点

合约：`compatibility/contracts/dt-verify.json`，检查已发布的 `@fuxi-ailabs/dsh-dt-verify@0.1.0-dev.28`，未改插件源码或发布新包。

检测真实宿主是否能注册 bundle，读出 `dt-verify` Skill，挂载五个 `dtv_*` preset，生成 `dtv_subagent` 的角色 schema，并正常关闭。检查不调用模型、不生成或运行鸿蒙测试、不连接设备。

2026-11-04 本地试点结果：

| 平台 | 基线 → 候选 | 新旧各两轮、六项检查 | 自动 issue |
|---|---|---|---|
| Windows x64 | rc.2 → rc.5 | 全部通过 | 0 |
| Windows x64 | rc.2 → alpha.3 | 全部通过 | 0 |
| WSL Linux x64 | rc.2 → alpha.3 | 全部通过 | 0 |

发布程序对三份真实报告的 dry-run 也通过。以上是本地执行结果；GitHub 定时工作流尚需合入默认分支后启用，不把本地结果写成线上任务已运行。

本地复跑示例（空的工作目录，不使用日常 profile）：

```powershell
npm run compat:discover -- --output compatibility-plan.json
npm run compat:check -- --candidate 0.2.2-alpha.3 --work C:\dsh-compat-check --output compatibility-reports\alpha3.json
npm run compat:report -- --plan compatibility-plan.json --reports compatibility-reports --dry-run
```

`--baseline-anchor` / `--candidate-anchor` 可指定已安装宿主的 `package.json`，脚本核对精确版本和 Node 要求；省略时在工作目录通过 npm 安装完整宿主。本机 Windows 和 Linux 对照结果见[试点记录](evidence/dt-verify-version-compatibility-2026-11-04.json)。宿主安装方式和平台在记录中分别说明，不能把借用现有宿主写成宿主全新安装。

本地需要先准备同样的 Node、npm 和 pnpm；缺少或使用其他 pnpm 版本时记为前置条件受阻，不生成插件 issue。

## 扩展与维护

当前自动合约只覆盖 dt-verify，其他插件没有监测结论；AgentLineage 按用户要求不继续测试。合约固定插件版本，插件升级后由市场维护者审核并更新，防止同时换宿主和插件导致无法归因。

新增插件时补充固定版本的合约和可信检测适配器，声明实际使用的宿主接口，并加入工作流执行矩阵。运行器拒绝未知合约类型，不执行合约中任意命令。对有业务依赖的插件，兼容合约应使用固定输入或隔离替身检查接口边界，不据此评价业务成功率。增加多插件或多平台矩阵时，应同步扩展状态汇总键，避免用一个平台或插件的结果覆盖另一个。

有确认的兼容回归后，插件作者在源码仓库修复、验证旧版仍可用、发布新包；市场再追加新版本并填写真实范围。监测不会修改插件代码、扩大 `engines.dsh` 或自动发布 npm 包。
