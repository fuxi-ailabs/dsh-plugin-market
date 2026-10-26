# 插件介绍页模板

目标：第一次打开页面的人，可以迅速回答四个问题：它做什么、什么情况下用、能看到什么例子、怎么开始。所有市场插件都需要一个介绍页。

**独立网页预览：** [通用模板预览与评审](https://fuxi-ailabs.github.io/dsh-plugin-market/templates/plugin-page/)。会议中可直接查看六段布局、切换填写提示、操作示例、放大 Before / After 占位图，或下载内容 JSON 骨架。

预览由同一份内容骨架、HTML 生成器、CSS 和交互脚本生成。它位于 `public/templates/plugin-page/`，不加入可安装插件索引；占位图和视频位均明确标为示意。填写提示与评审工具只出现在此预览页。

## 六段固定结构

| 顺序 | Section | 必须讲清楚 | 材料 |
|---|---|---|---|
| 首屏 | Overview | 插件名；一句话作用；具体问题；输入到结果的简图；版本与使用入口 | 一句话定位、版本、已验证环境 |
| 01 | 最小例子 | 一个问题、一组小输入、明确输出；让用户有东西可点 | 固定示意数据、复现提示词；可选录屏 |
| 02 | Before / After | 同一任务之前怎么做、之后怎么做 | 同一场景的两张截图、每张一句解释 |
| 03 | Use cases | 谁在什么情况下遇到什么问题，能得到什么 | 至少两个独立场景，每个附可复制提问 |
| 04 | 使用步骤 | 从准备环境到第一次成功的 1–5 步 | 实际命令/提问、预期结果、安装文档 |
| 05 | 使用条件 | 环境、输入覆盖与结果的范围 | 已核对的版本文档与已知限制 |

首屏先回答“是什么”；最小例子要比概念介绍更具体。比如 REA 可以问“Chrome 恐龙游戏的速度从哪里读到？”，AgentLineage 则问“谁把发布说明从草稿改成待评审？”。不要用“赋能研发”“全流程洞察”替代结果。

## 样式与交互

- 固定 dark mode：近黑背景、低对比边框、荧光绿强调。中文用无衬线，命令、标签和引用用等宽字。
- 顶部导航直达例子、对比、场景和使用步骤。手机保留例子与使用入口。
- 最小例子支持步骤选择、输入/输出变化、运行细节、手动启动的自动演示。术语由 `example.ui` 配置，不要求其他插件使用溯源术语。
- Before / After 同时显示；截图可点击放大，支持 Escape 关闭。
- 场景提问和操作命令支持复制；剪贴板不可用时提供手动复制框。
- 自动演示默认不启动，离开页面或手动选择步骤时停止。支持减少动态效果与键盘操作。

## 文件与生成方式

```text
templates/plugin-page/
  content.example.json   # 新插件内容骨架，先替换所有填写提示
  render.mjs             # 通用 HTML，统一修改
  styles.css             # 通用深色样式，统一修改
  page.js                # 通用交互，统一修改
  preview.mjs            # 独立预览的数据映射与 SVG 占位图
  review.css / review.js # 预览页的填写提示与评审工具
content/plugins/<slug>.json
public/plugins/<slug>/
  index.html             # 以下四个文件由生成器输出
  styles.css
  page.js
  demo-data.js
  assets/                # 人工审核的截图/录屏
public/templates/plugin-page/
  ...                    # 同源生成的独立预览与可下载内容骨架
```

新增插件：

1. 将 `templates/plugin-page/content.example.json` 复制到 `content/plugins/<slug>.json`。改 `slug`、插件名与所有示例文案；不要沿用 AgentLineage 的工具名或运行条件。`links[0]` 必须是该版本的安装文档。
2. 填齐六段。`headline` 是首屏两行标题；`preview` 控制首屏简图术语；`example.operations` 是可点选的步骤；`removed`/`added` 是输入输出的删减行，也可以表达非代码文本变化。上下文及输入/输出引用的字段标题由 `example.ui` 改名。固定演示数据的引用使用 `demo:` 前缀，不冒充真实运行证据。
3. 准备两张已审核的 JPEG 截图到 `public/plugins/<slug>/assets/`，在 `comparison.before/after` 指定路径、描述和 alt。目录与文件只用小写字母、数字和连字符。
4. 在 `scripts/validate.mjs` 的 `publicPages` 以 `plugins/<slug>` 为键登记该页每个文件，在 `publicLinks` 的同名条目登记精确的 HTTPS 文档地址。保留逐页资源审核，不能改成允许任意外链。
5. 在 `public/index.json` 的插件条目填写对应 `/plugins/<slug>/` 的 `homepage`。每个索引插件都必须指向已登记的市场介绍页。
6. 运行 `npm run build:pages`、`npm run ci`、`npm run preview`。预览路径为 `http://127.0.0.1:4173/plugins/<slug>/`。提交生成结果与源内容，`check:pages` 会发现漏生成或手改输出。

不要直接编辑生成后的四个页面文件。修改内容只改 JSON，修改模板只改 `templates/plugin-page/`，然后重新生成。

## 可选视频

AgentLineage 已同时提供固定交互示例和真实 DSH 实录。其他插件准备好经审核的录屏后，可在 `example` 添加：

```json
"video": {
  "title": "用一个具体问题解释这段操作",
  "description": "说明真实运行的版本、预期结果和必要的剪辑处理",
  "src": "assets/demo.webm",
  "poster": "assets/demo-poster.jpg",
  "captions": "assets/demo-zh.vtt"
}
```

模板输出原生 `video`（带控制、字幕、手机尺寸约束、`preload="none"`，不自动播放）。支持 `.mp4` / `.webm`；视频、封面与 VTT 字幕必须一并加入发布资源清单。视频文件是二进制资产，需要 reviewer 手工审阅内容及脱敏情况，不依赖文本扫描。

推荐 30–60 秒：0–5 秒说清问题；5–15 秒展示最小输入；15–40 秒完成操作；最后展示结果与可复制的提问。对比使用同一任务，不把页面交互的录屏标成插件真实运行录像。

## Review 问题

- 看完首屏，能否用一句话说出它做什么？
- 不装插件能否理解最小例子？输入、步骤、答案能否互相核对？
- Before / After 是否为同一任务，是否标明示意/真实截图？
- 场景是否包含触发问题、操作和结果，而不是功能名列表？
- 五步是否从真实依赖开始，包含可复制内容及成功标志？
- 文案是否对应市场里固定的插件版本，而不是别的集成方式？
- 手机有无横向滚动，键盘能否完成操作，弹窗能否退出？
- 所有资源和文档链接是否经过逐项审核，有无凭据与私有信息？

机器校验与独立代理评审不能替代仓库要求的维护者 approval。上线仍按 [PR 与合并策略](pr-merge-policy.md) 执行。
