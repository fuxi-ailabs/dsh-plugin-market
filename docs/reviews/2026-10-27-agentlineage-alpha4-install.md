# AgentLineage alpha.4 安装验收

日期：2026-10-27。交付范围为 Windows x64、DSH 0.2.1-rc.2、Node.js 24+。

## 发布来源

- [源码 PR #4](https://github.com/fuxi-ailabs/AgentLineage/pull/4)，已合并。
- 市场固定提交：`211057da3b42eabbf92a7f723ce8c3fa46ce05ef`；合并提交 `b0d7ff8651515521c774ff14eba8e4be6a02cf63` 与其 Git tree 相同。
- [alpha.4 Release](https://github.com/fuxi-ailabs/AgentLineage/releases/tag/dsh-agentlineage-v0.1.0-alpha.4) 保持源码仓库原有私有可见性。
- [源码 CI](https://github.com/fuxi-ailabs/AgentLineage/actions/runs/40444621176) 的 Windows/Linux、Node 22.19/24 及 Python 组件六项检查全部通过。
- [发布工作流](https://github.com/fuxi-ailabs/AgentLineage/actions/runs/40445121772) 从标签重新构建、测试并校验最终安装包。

## 已验证的行为

- 插件测试 15 项通过；Core Python 回归测试 93 项通过。覆盖真实 DSH ToolRuntime 的创建文件、两次修改、三次确认写入、查询、报告、Viewer、历史/子会话、Profile 隔离及重启后会话绑定。
- 默认 managed 模式在 PATH 不提供 Python/Git、环境中的 Python 配置无效、无自定义解释器覆盖的情况下，使用随包隔离环境启动成功。启动不执行 pip、依赖安装脚本或网络下载。
- 运行清单和全部 111 个文件均校验摘要；缓存损坏会重建，包内材料损坏会保留状态入口并提示重新安装；并发启用使用独立、不可变的运行目录。
- 独立 DSH_HOME 的真实 DSH 网页显示「AgentLineage 已就绪」。注入安装清单损坏后，网页显示需要修复；点击「重新安装此版本」后恢复 ready，原有快照仍可查看。
- Viewer 使用 DSH 同源认证入口。未登录状态接口返回 401，登录后的 Viewer 返回 200；Core token 不发送给浏览器。
- 使用 DSH 原生工具测试导出的会话材料核对 Viewer 的三次写入；没有调用真实模型，也没有使用用户的实际会话。

## 验证边界

这是隔离 Profile 和运行依赖不可用条件下的主机验收，未声称完成全新实体 Windows/VM 的验收。Git 来源安装仍需要 DSH 已有的 Git 工具及私有仓库访问权限；无需用户手工安装 Python/Core。

其他平台完整运行包、DSH 通用安装弹窗 readiness 协议和原子升级恢复未包含在 alpha.4。现有版本通过插件详情提供状态、重试、重新安装和 Viewer；升级仍沿用 DSH 的卸载再安装流程，保留分析数据。

## 最终 Release 资产回验

发布工作流已成功，Release 非草稿、标记为 prerelease。通过 GitHub 下载资产并逐项匹配 `SHA256SUMS`：

| 资产 | 大小 / SHA256 |
|---|---|
| `fuxi-ailabs-dsh-agentlineage-0.1.0-alpha.4.tgz` | 11,688,486 bytes；`1e3d9948cecfa537839f0dc36c7ea9dbf54266463c34161829c15802e7fda071` |
| `agentlineage_core-0.1.0a10-py3-none-any.whl` | `7695bf7844259a1a6082539fb833ad1808b515376fcf623a33bfe4929afa7c97` |
| 随包运行 ZIP（111 个文件） | `b9458248303bf129e5e9e51c43bae9f33f727926c3119ae6c94c1d70b11658ba` |

将下载的 tarball 通过官方 DSH 包管理器重新安装到同一隔离 Profile。启动 DSH 时 PATH 只保留 Node 与 Windows System32，并设置无效的 PYTHONHOME/PYTHONPATH；没有自定义 Python 覆盖。网页实际显示 alpha.4「AgentLineage 已就绪」，原快照的 Viewer 仍显示一个文件、一个 agent、三次写入。

市场上线还须满足本仓库维护者 approval、Squash merge、Pages 部署成功及匿名索引检查；源码/Release 发布成功不能代替市场上线成功。
