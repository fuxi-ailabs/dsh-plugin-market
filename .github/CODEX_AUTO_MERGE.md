# 市场自动合并试点

仅对 `fuxi-ailabs/dsh-plugin-market` 的非草稿、目标为 `main` 的 PR 生效。HMBot 和其他仓库不启用。

`Codex market auto-merge` 在审查或 CI 工作流完成、PR 评论更新时重新检查；每 10 分钟补查，覆盖讨论解决、人工审查更新等情况。没有变化或不满足条件时只写 Actions 记录，不反复评论 PR。

## 合并条件

- 仓库变量 `CODEX_AUTO_MERGE_ENABLED` 为 `true`。
- 原生 Codex Summary 的审查 SHA 与当前 PR head 完全一致，状态为 `completed`，并明确没有未解决的问题。
- 没有未解决的审查讨论，也没有仍有效的人工“请求修改”。评论或旧提交上的审查完成不能代替这些条件。
- 当前 SHA 的 `pages.yml` 和审查桥接工作流的 PR 检查成功；其他工作流、Checks 和 commit status 均已结束且无失败。
- 分支没有冲突、没有落后于当前基线，GitHub 允许合并；保留现有 `validate` 分支保护，不使用管理员绕过。
- 合并前再次读取 PR。head、base 或 PR 更新状态改变就留待下一次检查；调用合并 API 时也传入已审查的 head SHA。

满足条件后执行 Squash merge，不替用户或机器人提交 approval。它是独立的合并工作流，不把“审查任务完成”当作“审查无问题”。

## 权限与发布

脚本只从默认分支读取，不检出、执行 PR 中的代码，不读取 PR 附件或上传的 Actions 产物。工作流和脚本都限制为本仓库；使用 GitHub 临时 `GITHUB_TOKEN`，不需要 OpenAI API key、PAT 或新增登录凭据。

GitHub 会抑制由 `GITHUB_TOKEN` 产生的后续 push 工作流。合并成功后，脚本因此显式 dispatch 现有 `pages.yml` 的 `main`，继续校验并发布网页。Pages 调用最多尝试三次；仍失败则合并工作流报错。可手动运行本工作流，填已由此试点合并的 PR 编号并勾选 `publish_only`，重试发布请求。实际部署结果查看 `Validate and publish market`。

GitHub 仓库的原生“Allow auto-merge”开关不控制这套脚本；自动合并依据上述完整条件，而不是只看 `validate`。

## 开关与验证

关闭试点：把仓库 Actions 变量 `CODEX_AUTO_MERGE_ENABLED` 改为 `false`。不更改原生 Codex 自动审查。

手动运行时可填 PR 编号并勾选 `dry_run`，只报告是否满足条件。留空 PR 编号会检查全部打开的 main PR。

```bash
node --test .github/scripts/*.test.cjs
```
