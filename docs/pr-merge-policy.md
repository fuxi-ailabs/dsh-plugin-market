# PR 与合并策略

本仓库的 `main` 是线上市场索引的发布分支，所有改动都必须经过 PR 和同一套检查。

## 目标

- 合并前就能发现格式错误、失效的发布路径、越界的页面资源和不兼容的 DSH 版本声明。
- 用 `.dsh-version` 声明最新对标版本，用 `.dsh-compatibility.json` 保留仍支持的旧版。
- 版本范围检查和运行时验证分开记录，避免把范围覆盖当成功能兼容。

## 强制检查

工作流 `Validate and publish market` 的 `validate` job 在 PR 和 `main` 推送时都会运行：

1. `npm ci --ignore-scripts`：按锁文件安装，不执行依赖脚本。
2. `npm run validate`：官方 `parseMarketIndex` 校验格式，检查 `public/` 顶层白名单、页面资源逐文件清单、页面外链、图片/敏感信息。
3. `npm run check:policy`：检查最新对标版本和兼容性矩阵合法，每个插件版本的 `engines.dsh` 是合法且非空的范围并覆盖矩阵中的全部运行时、Git 来源固定 40 位 commit、`publishTimestamp` 是 Unix 秒。

`compatibility` job 使用矩阵中各版本的官方市场解析器分别运行 `validate` 和 `check:policy`。这些检查校验市场格式与版本声明，不执行第三方插件；实际宿主、工具、界面与业务流程的验证另附证据。Pages 部署同时依赖 `validate` 和全部 `compatibility` 检查通过。

`main` 的 ruleset 应把 `Validate and publish market / validate` 设为 required status check；PR 分支需与 `main` 同步后才能合并。

## 版本策略

- `engines.dsh` 写范围（默认 `^0.2.1-rc.2`），不写精确版本。
- 判定使用与 DSH 安装时相同的 `semver.satisfies(..., { includePrerelease: true })`：`^0.2.1-rc.2` 覆盖 `0.2.1`、`0.2.x` 正式版和不低于 `0.2.1-rc.2` 的 `0.2.x` 预发布版。
- 升 `.dsh-version` 时把新版本加入 `.dsh-compatibility.json`，保留仍支持的旧版，并记录上游接口变化与插件验证结果。需要修复时先发布插件，随后更新市场；不能只为通过检查而扩大未经验证的范围。
- 索引的 `engines.dsh` 要与插件包自身的 `engines.dsh` 保持一致；市场展示用索引值，实际安装检查用包内值。
- 不再支持当前 DSH 的历史版本应从索引移除，避免用户装到已知不兼容的包。

## 来源策略

- npm 来源：`type: "npm"`，可选 `registry` 必须是 https。
- Git 来源：`type: "git"`，`url` 必须是 https，`commit` 必须是完整 40 位小写 SHA，`path` 是仓库内相对目录。
- CI 只校验声明的元数据，不下载、不安装、不执行插件代码（避免在 CI 里运行 PR 提供的任意脚本）。包是否真的可安装、`dsh.bundle` 是否正确，仍由提交者在插件仓库按 README 第 1 步验证。

## 合并规则

- 至少一名维护者 approval。
- 只允许 Squash merge，合并后删除分支。
- 禁止 force push 和删除 `main`。
- 合并后确认 Pages 部署成功，索引匿名访问返回 HTTP 200。

## 上线顺序

1. 合并本 PR：新增 `.dsh-version`、`check:policy`、工作流步骤和 PR 模板。
2. 在仓库 ruleset 中启用上面的 required check 和合并限制。
3. 用一个只改文档的测试 PR 验证检查会运行；再故意把 `engines.dsh` 改成不覆盖 `.dsh-version` 的范围，确认 CI 变红。

## 非目标

- 不做自动合并或自动发布。
- 不在 CI 中做真实安装/构建。
- 不校验展示文案与包内容是否一致（格式校验器无法判断，仍靠 reviewer）。
