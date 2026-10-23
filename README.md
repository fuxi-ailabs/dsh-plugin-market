# Fuxi DSH 插件市场

Fuxi 团队插件目录

索引地址：**https://fuxi-ailabs.github.io/dsh-plugin-market/index.json**

`public/` 是 Pages 站点根目录，目录名不出现在公开 URL 中。例如 `public/index.json` 对应上面的索引地址，`public/plugins/agentlineage/` 对应 `/dsh-plugin-market/plugins/agentlineage/`。

## 在 DSH 中添加

以 `0.2.1-rc.2` 为例：打开「插件」→「实验性插件」旁的「更多」→ 启用「自定义插件市场」→「发现」→「添加索引源」，输入上面的完整 `index.json` 地址。索引按 profile 保存；以后新增插件仍使用这个地址，重新读取目录即可发现。

## 当前目录

| 插件 | 版本 | DSH 兼容范围 |
|---|---|---|
| AgentLineage | `0.1.0-alpha.3` | `^0.2.1-rc.2` |
| DT 验证组件（@fuxi-ailabs/dsh-dt-verify） | `0.1.0-dev.20` | `^0.2.1-rc.2` |

AgentLineage 支持追溯文件改动来源、查询原生会话证据和打开溯源视图。参见 [插件介绍与效果对比](https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/agentlineage/)。安装准备见 [AgentLineage 使用说明](https://github.com/fuxi-ailabs/AgentLineage/blob/dsh-agentlineage-v0.1.0-alpha.3/integrations/dsh/README.md)。

DT 验证组件按 Spec 整理验收输入、统一审查计划，用 Harmony UT/UI 测试验证鸿蒙工程并汇总证据，只用于鸿蒙 Stage 工程；当前为开发候选（预览版）。参见 [插件介绍与使用步骤](https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/dt-verify/)。包发布在 npm：[@fuxi-ailabs/dsh-dt-verify](https://www.npmjs.com/package/@fuxi-ailabs/dsh-dt-verify)。

## 版本与兼容性

仓库根目录的 `.dsh-version` 声明市场当前对标的 DSH 运行时版本，CI 用它做兼容性门槛。每个插件版本必须在 `versions[].engines.dsh` 里声明语义化版本范围，且该范围要覆盖 `.dsh-version`。

- 默认写范围（如 `^0.2.1-rc.2`），不要写死精确版本；这样后续 `0.2.x` 正式版发布时索引无需改动。
- 来源可以是 npm 包，也可以是 Git 仓库；Git 来源必须固定 40 位 commit SHA，`path` 指向真实子目录。
- 版本范围按 DSH 安装时的同一套 SemVer 规则判定（含 `includePrerelease`，因此 `^0.2.1-rc.2` 覆盖 `0.2.1`、`0.2.x` 正式版，以及不低于 `0.2.1-rc.2` 的 `0.2.x` 预发布版）。
- 索引里的范围决定市场展示和默认版本；安装时 DSH 还会检查插件包自身的 `engines.dsh`，两处应保持一致，插件包同样写范围而不是精确版本。

升级 `.dsh-version` 时：

1. 用单独一个 PR 修改 `.dsh-version`，不要混入新插件或新版本。
2. CI 逐版本检查 `satisfies(.dsh-version, engines.dsh)`。
3. 只有范围没覆盖新版本的插件版本才需要在同一 PR 里更新 `engines.dsh`（或删除该版本）；范围已覆盖的不用动。

## 添加后续插件或版本

1. 在插件自己的仓库准备可安装 Bundle，核实 `package.json` 中的包名、版本、`dsh.bundle` 和 DSH 兼容范围；`engines.dsh` 写范围并与索引一致，验证 npm/Git 安装及构建产物。
2. 在 `public/index.json` 的 `plugins` 数组追加条目；已有插件则向 `versions` 追加版本。Git 来源必须固定完整 40 位 commit SHA，并填写真实的子目录。`publishTimestamp` 使用来源提交的 Unix 秒时间。
3. 图标放进 `public/icons/`。介绍页与经审核的图片放进 `public/plugins/<插件目录>/`，在校验脚本 `publicPages` 中登记逐文件清单，并通过 `homepage` 关联。具体内容与呈现方式由接口负责人维护，before/after 不强制。标题和描述可提供 `en`、`zh`，其中英文必须存在。
4. 运行 `npm ci --ignore-scripts` 和 `npm run ci`（格式与发布目录校验 + 兼容性/来源策略检查）。
5. 提交 PR。合入 `main` 后，GitHub Actions 校验并部署 `public/`。核对工作流成功、索引匿名访问返回 HTTP 200，再在 DSH 的「发现」页重新读取目录。

## PR 与合并规则

`main` 受保护，所有改动（包括 `.dsh-version`）都通过 PR 合入，禁止直接推送。

必需检查 `Validate and publish market / validate` 包含：

- `npm run validate`：官方 `parseMarketIndex` 格式校验、发布目录白名单、页面资源清单/外链/敏感信息检查。
- `npm run check:policy`：`.dsh-version` 覆盖性、`engines.dsh` 范围合法性、Git 来源固定与时间戳单位。

合并条件：

1. 必需检查通过。
2. 至少一名维护者 approval。
3. 使用 Squash merge 合入并删除分支。
4. 合入后确认 Pages 部署成功、索引匿名访问返回 200，再在 DSH 里重新读取目录。

完整规则与上线步骤见 [PR 与合并策略](docs/pr-merge-policy.md)。

官方格式：[DSH 插件市场文档](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.2/docs/user/guide/plugin-market.zh.md)。
