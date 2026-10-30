# Codex 自动审查触发验证

这是临时测试分支，不合入 main。

- 仓库：仅 `fuxi-ailabs/dsh-plugin-market`。
- 阶段 1：创建 PR，记录原生自动审查是否启动。
- 阶段 2：推送后续提交，验证 GitHub Actions 自动发出的 `@codex review` 是否能进入 Codex 审查。
- 不使用 OpenAI API key，不读取或复制 Codex/GitHub 登录凭据。
- 工作流不检出、运行 PR 代码，只通过 GitHub API 发起审查请求。

当前阶段：2。此提交用于验证 PR 已创建之后的新推送能否自动进入 Codex 审查。
