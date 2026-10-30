# Codex 订阅自动审查

只为 `fuxi-ailabs/dsh-plugin-market` 和 `fuxi-ailabs/HMBot` 请求自动审查。
两个仓库的 Codex 专有设置保持「自动审查开启 / 所有 PR / 每次推送时」；个人自动审查保持关闭，避免扩大到其他仓库。

原生推送触发没有稳定产生审查记录时，`Codex subscription review` 工作流接收 PR 的 opened、reopened、synchronize 和 ready_for_review 事件，自动评论请求原生 Codex 审查。它使用现有 Codex 订阅与 GitHub 临时令牌，不需要 OpenAI API key，也不复制任何登录凭据。

## 触发和结果

- 每次推送都会运行事件钩子，包括 fork PR；草稿 PR 也可发起请求。
- 同一 head 已有完成的原生审查时不重复请求；已有运行中的审查时等待其结果。
- 原生失败或长时间没有结果时，最多自动请求两次。仍未完成则工作流失败，不能把「请求已发送」当成「审查已通过」。
- 多次快速推送时，过期任务标记为 superseded，由新事件处理当前 head。
- Codex Summary 中的 Review trigger 会显示 Manual request，因为它识别的是评论入口；自动触发证据是请求评论中的 Actions 链接、工作流事件和对应 head。
- 只做审查，不修改、批准或合并 PR。

可在 Actions 中手动运行此工作流，并填写 PR 编号，补审当前 head。原生服务的失败详情仍以 PR 上的 Codex Summary 为准。

## 权限边界

发起请求的作业只从默认分支读取维护者已合入的脚本，不检出或执行 PR 的代码，只持有读取代码、写入 PR 评论的权限。PR 修改的单元测试在另一个只读作业中运行。工作流和脚本都检查仓库白名单。

验证命令：

```bash
node --test .github/scripts/codex-review-bridge.test.cjs
```
