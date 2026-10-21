# PR 与合并策略

本仓库的 `main` 是线上市场索引的发布分支，所有改动都必须经过 PR 和同一套检查。

## 目标

- 合并前就能发现格式错误、失效的发布路径、越界的页面资源和不兼容的 DSH 版本声明。
- 用仓库根目录的 `.dsh-version` 作为唯一版本基准，避免"索引写的是什么版本"靠人记。
- 让版本升级的改动范围可预期：范围覆盖新版本就不改插件，不覆盖才改。

## 强制检查

工作流 `Validate and publish market` 的 `validate` job 在 PR 和 `main` 推送时都会运行：

1. `npm ci --ignore-scripts`：按锁文件安装，不执行依赖脚本。
2. `npm run validate`：官方 `parseMarketIndex` 校验格式，检查 `public/` 顶层白名单、页面资源逐文件清单、页面外链、图片/敏感信息。
3. `npm run check:policy`：检查 `.dsh-version` 合法、每个版本的 `engines.dsh` 是合法且非空的范围并覆盖 `.dsh-version`、Git 来源固定 40 位 commit、`publishTimestamp` 是 Unix 秒。

`main` 的 ruleset 应把 `Validate and publish market / validate` 设为 required status check；PR 分支需与 `main` 同步后才能合并。

## 版本策略

- `engines.dsh` 写范围（默认 `^0.2.1-rc.2`），不写精确版本。
- 判定使用与 DSH 安装时相同的 `semver.satisfies(..., { includePrerelease: true })`：`^0.2.1-rc.2` 覆盖 `0.2.1`、`0.2.x` 正式版和不低于 `0.2.1-rc.2` 的 `0.2.x` 预发布版。
- 升 `.dsh-version` 的 PR 通常只需要改这一个文件；若 CI 指出某些版本的范围不覆盖新版本，再在同一 PR 里更新这些版本的 `engines.dsh` 或删除它们。
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
