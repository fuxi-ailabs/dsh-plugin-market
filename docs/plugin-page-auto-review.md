# 组件介绍页自动审查

审查要求在根目录 [AGENTS.md](../AGENTS.md)，PR 模板要求作者逐项说明元素位置或缺项原因。
只写 Bash 命令可以；不要求同一套 UI，也不要求演示必须是视频。使用文档可选，Top banner 不能省略。

## 触发和结果

`Review component pages` 在 PR 新建、推送新提交、重新打开、修改正文或转为待审查时触发。
它检查页面、内容源、模板、市场索引或审查规则的变动；不相关 PR 不调用 AI。
修改 PR 正文也会重审，避免缺项原因补充后仍保留旧判断。

每个 PR 保留一条由 `github-actions[bot]` 发布的审查评论，重审时更新它，显示对应的完整 head SHA。
发布前再次读取 PR；如果 head、正文或打开状态变化，就丢弃旧报告。它不批准、合并或修改组件 PR。
AI 评论不能代替已有的 `validate` 检查和维护者 approval，也不能证明真实安装、页面显示或设备验收通过。

## 启用

此工作流默认不调用 AI。合并到 main 后，在仓库 Settings → Secrets and variables → Actions 配置：

1. Repository secret `OPENAI_API_KEY`：有 API 使用权限的 OpenAI key，只在 GitHub 的 Secret 输入框填写，不放进代码、Issue 或聊天。
2. Repository variable `PLUGIN_PAGE_AI_REVIEW_ENABLED`：设为 `true`。
3. 在一个组件 PR 推送新提交或修改正文，检查 `Review component pages` 和该 PR 的机器人评论。

工作流调用 OpenAI API，会产生对应 API 用量；ChatGPT/Codex 订阅不能当成这个 Secret。
未配 key 却启用变量时，工作流会明确失败，不会发布“审查通过”。暂停时把变量改为 `false`。
本地测试不调用 AI；真实事件、API 调用和机器人评论需在上述配置完成后验收。

若不使用 API key，也可以在 [Codex 的代码审查设置](https://chatgpt.com/settings/code-review) 连接仓库并开启自动审查。
这是独立的产品设置，本仓库的工作流不会代为开启；其默认高优先级问题筛选不等同于本工作流逐项检查页面元素。

## 执行边界

只自动处理同仓库分支的非草稿 PR；Codex Action 默认要求触发者有仓库 write 权限。
fork 和草稿不调用 AI。工作流从 base 读取可信提示词和辅助脚本，把 head 单独检出为审查材料，
不执行候选代码、构建或安装命令。AI 在只读权限下运行，调用步骤不持有发评论的写权限。
发评论使用独立 job，只检出 base 的辅助脚本。

参考：[GitHub PR 事件](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request)、
[Codex GitHub Action](https://learn.chatgpt.com/docs/github-action)、
[Codex 自定义审查规则](https://developers.openai.com/blog/custom-code-review-rules-for-codex)。
