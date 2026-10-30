# 使用 Codex 订阅审查组件介绍页

使用 Codex 原生的 GitHub Code Review，不需要在 GitHub 配置 OpenAI API key。
GitHub 自动审查使用订阅中的 Code Review 额度，具体额度以当前计划和账号用量页面为准。

审查要求保存在根目录 [AGENTS.md](../AGENTS.md) 的 `Code Review Rules`。
PR 模板要求负责人逐项填写 a–i 元素的位置或缺项原因；使用文档可选，双链接 Top banner 不能省略。
允许不同 UI、图片或流程图替代视频，也允许只写 Bash 命令。

## 账号设置

1. 打开 [Codex 代码审查设置](https://chatgpt.com/settings/code-review)，确认 GitHub 仓库已连接。
2. 选择 `fuxi-ailabs/dsh-plugin-market`，在 `Review code` 下开启 `Automatic review`。
3. 仓库策略选择 `All PRs`，覆盖各组件负责人的 PR。仅开启个人偏好可能只覆盖自己的 PR。
4. 在 `Review trigger` 配置触发时机，并确认它覆盖 PR 的后续提交。
5. 在一个组件 PR 推送新提交，检查新 head 是否收到 Codex review；也可在 PR 评论中手动发送 `@codex review`。

仓库规则和 PR 清单不能代替账号中的开关。必须实际检查设置，并用新提交验证触发，才能确认自动审查已开启。

本仓库另有 [GitHub 事件钩子](../.github/CODEX_REVIEW.md)：在 PR 更新后自动通过评论入口请求原生 Codex 审查，并检查它是否完成。它继续使用订阅，不需要 OpenAI API key；只允许市场仓库和 HMBot。
不要把“PR 刚创建时会审查”当成“每次更新都会重审”；如果账号没有所需的触发选项，记录限制并手动请求重审。
修改 PR 正文是否触发重审也需实际验证，不能沿用自建工作流的触发承诺。

## 结果和验收范围

审查结果由 Codex 发布到 GitHub PR，具体格式由原生服务决定；不承诺每次都更新同一条评论或输出完整的元素对照表。
官方文档说明 GitHub Code Review 侧重 P0/P1 问题，因此没有评论不代表 a–i 和横幅全部合格。
`AGENTS.md` 提供判断依据，PR 清单、已有的 `validate` 检查和维护者审查继续保留。
不为绕过优先级筛选而抬高问题级别，也不把代码审查当成真实安装、浏览器或设备验收。

参考：[GitHub Code Review 设置与自定义规则](https://learn.chatgpt.com/docs/third-party/github)、
[订阅与 Code Review 用量](https://learn.chatgpt.com/docs/pricing)、
[自定义审查规则说明](https://developers.openai.com/blog/custom-code-review-rules-for-codex)。
