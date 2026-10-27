# Fuxi DSH 插件市场

Fuxi 团队插件目录

索引地址：**https://fuxi-ailabs.github.io/dsh-plugin-market/index.json**

介绍页模板：[独立网页预览与评审](https://fuxi-ailabs.github.io/dsh-plugin-market/templates/plugin-page/) · [填写与复用说明](docs/plugin-page-template.md)。预览展示六段通用结构，支持开关填写提示和下载内容骨架。

`public/` 是 Pages 站点根目录，目录名不出现在公开 URL 中。例如 `public/index.json` 对应上面的索引地址，`public/plugins/agentlineage/` 对应 `/dsh-plugin-market/plugins/agentlineage/`。

## 在 DSH 中添加

以 `0.2.1-rc.2` 为例：打开「插件」→「实验性插件」旁的「更多」→ 启用「自定义插件市场」→「发现」→「添加索引源」，输入上面的完整 `index.json` 地址。索引按 profile 保存；以后新增插件仍使用这个地址，重新读取目录即可发现。

## 当前目录

| 插件 | 版本 | DSH 兼容范围 |
|---|---|---|
| AgentLineage | `0.1.0-alpha.4` | `^0.2.1-rc.2` |
| workflow-rsi 操作台 | `0.1.0-alpha.1` | `0.1.6-alpha.2 \|\| ^0.2.1-rc.2` |
| Crowd Memory · 群体记忆 | `0.1.0` | `0.1.6-alpha.2 \|\| ^0.2.0-rc.2` |
| DT 验证组件（@fuxi-ailabs/dsh-dt-verify） | `0.1.0-dev.20` | `^0.2.1-rc.2` |

AgentLineage 支持追溯文件改动来源、查询原生会话证据和打开溯源视图。参见 [插件介绍与效果对比](https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/agentlineage/)。Windows x64 随插件提供完整运行环境，安装后自动启动。参见 [AgentLineage 安装与使用说明](https://github.com/fuxi-ailabs/AgentLineage/blob/dsh-agentlineage-v0.1.0-alpha.4/integrations/dsh/README.md)。

Crowd Memory 把一个 DSH Agent 解决问题时形成的经验，变成后续会话和 workflow 中其他 Agent 可以复用的群体记忆；在下一步前给出相关修法、出处和命中理由，并在本机统计使用与恢复结果。0.1.0 提供本机跨会话和工作流记忆，跨机器的团队共享目前为内部预览。使用前需要安装本机记忆服务 `@fuxi-ailabs/crowdmemory-runtime`。参见 [Crowd Memory 介绍、例子与安装说明](https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/crowdmemory/)。
workflow-rsi 操作台在 DSH 里查看 workflow-rsi 的会话、请求、评测资产、Run、闭环与工作计划，写操作只由人在 `/wrsi … --confirm` 执行。使用前需要安装并启动 workflow-rsi 本体 `@fuxi-ailabs/workflow-rsi` 提供的 `wrsi-server`。参见 [workflow-rsi 操作台文档](https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/workflow-rsi/)。

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
3. 图标放进 `public/icons/`。每个插件都需要按[统一深色介绍页模板](docs/plugin-page-template.md)准备六段内容：作用、使用场景、最小例子、前后对比、使用条件、安装与验证。内容写入 `content/plugins/<slug>.json`，运行 `npm run build:pages` 输出介绍页；经审核的图片放进 `public/plugins/<slug>/assets/`，在校验脚本 `publicPages` / `publicLinks` 登记逐文件清单与文档链接，并通过 `homepage` 关联。标题和描述可提供 `en`、`zh`，其中英文必须存在。
4. 运行 `npm ci --ignore-scripts` 和 `npm run ci`（生成结果一致性、格式与发布目录校验、兼容性/来源策略检查）。`npm run preview` 启动本地页面预览。AgentLineage 材料与录屏分镜见[页面材料](docs/agentlineage-page-materials.md)。
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
