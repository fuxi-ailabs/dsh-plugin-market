# 插件介绍页模板

介绍页帮助第一次来的用户判断：插件解决什么问题、自己是否需要、实际效果如何，以及怎么开始使用。

[模板预览](https://fuxi-ailabs.github.io/dsh-plugin-market/templates/plugin-page/)和 [AgentLineage 页面](https://fuxi-ailabs.github.io/dsh-plugin-market/plugins/agentlineage/)使用同一个生成器和样式。预览页提供图片、视频占位和内容模板下载。填写方法放在本文中。

## 页面顺序

| 位置 | 用户要知道什么 | 填写内容 |
|---|---|---|
| 用途与安装命令 | 它能帮我完成什么，怎么安装？ | 名称、版本、一句话说明；标题下提供可复制安装命令，右侧放插件截图、概览图或代表图 |
| 使用场景与适合人群 | 适合谁，什么时候会用？ | 至少两个具体问题，每个标明适合人群，说明输入、操作和结果，并附可复制提问 |
| 功能演示 | 实际怎么用，结果长什么样？ | 自由组合文字、截图、列表、代码和视频；标明示例数据或真实运行 |
| 使用前后效果对比 | 原来的操作发生了什么变化？ | 同一任务的两张截图及说明 |
| 安装与验证 | 安装前要准备什么，怎样完成第一次使用？ | 开头简列系统、版本和依赖；一至五步，每步一条描述和一个命令框；检查结果收起显示 |

安装验证尽量使用演示中的同一任务。安装、配置、工具参考和排错的完整说明放在文档中。

## 文案怎么写

直接写用户遇到的问题、要做的操作和能看到的结果。例如“查询这个文件的三次改动”，比“洞察完整任务链路”更容易理解。

- 场景写具体问题，例如“昨天的 Agent 改了哪些文件”，并说明用户下一步可以做什么。
- 标题说明这一段的内容。去掉装饰性的英文小标题、重复口号和与操作无关的标注。
- 页面不添加阅读引导或编写说明，例如“看看哪种情况与你有关”“用一个小例子说明操作”“按顺序完成下面五步”。标题下只有具体信息时才保留说明，描述字段可留空；填写提示放在文档中。
- 用完整、自然的句子解释必要内容。不要把所有说明拆成“一个问题、一个输入、一个结果”一类的短口号。
- 英文保留产品名、实际工具名、代码和引用。中文说明不需要再附一遍英文标签。
- 区分固定示意、真实截图和真实录屏。版本、依赖和已知限制会影响用户选择，应当说清楚。
- 不编造命令、工具名、效果数据或加速比例。安装内容应与市场固定的插件版本一致。

## 字号与布局

模板和插件页面统一使用浅色背景、深色正文和绿色强调色，不随系统主题切换。各节标题下面有横向分隔线。代码块、交互演示和模板占位图使用同一套浅色样式；真实截图和录屏保留原始内容。

浏览器保持 100% 缩放即可阅读。桌面正文为 17px，首屏介绍为 19px；手机正文为 16px。代码为 15px，辅助文字不小于 14px。字号使用 `rem`，随浏览器的默认字号设置变化。

按钮点击区域至少 44px 高。窄屏使用单列布局、换行和纵向步骤，不靠缩小字体容纳内容。正文、代码和次要说明保持足够对比度。

页面支持复制和图片放大；无法自动复制时，会显示手动复制框。图片可按 Escape 关闭。AgentLineage 自己的交互演示还支持步骤切换、文件变化、调用记录和自动播放，其他插件不必使用这套布局。页面保留键盘操作和减少动态效果设置。

## 内容与生成

```text
templates/plugin-page/
  content.example.json   # 内容骨架
  render.mjs             # 页面结构
  file-history.mjs       # AgentLineage 使用的可选交互演示
  styles.css             # 共用样式
  page.js                # 共用交互
  preview.mjs            # 预览映射与占位图
  review.css            # 仅预览页的工具栏样式
content/plugins/<slug>.json
public/plugins/<slug>/
  index.html / styles.css / page.js / demo-data.js
  assets/                # 已审核的截图和录屏
public/templates/plugin-page/
  ...                    # 同源生成的预览与可下载骨架
```

不要直接编辑生成后的页面文件。修改内容时编辑 JSON，修改结构或样式时编辑 `templates/plugin-page/`，然后重新生成。

首屏右侧由 `heroMedia` 配置：`image` 指向已审核的本地 JPEG，`alt` 描述图中内容，`title` 说明图片内容，`description` 可选。可以使用界面截图、功能概览图或插件代表图，点击可放大。模板预览使用图片占位图；发布时替换为实际素材，并登记到资源清单。

1. 将 `content.example.json` 复制到 `content/plugins/<slug>.json`，替换插件名和所有填写示例。`links[0]` 指向对应版本的安装文档。
2. `install` 提供标题下的安装摘要：`code` 使用 `dsh plugin --profile web add <插件安装地址>` 形式，填写与市场版本一致的真实安装地址；`codeLabel` 说明安装对象和运行环境，`note` 提醒替换 Profile 并说明必要前置步骤。命令须与下方完整步骤一致，Core 等额外依赖的准备放在完整步骤中。`requirements.summary` 在首屏简要说明依赖，`description` 和 `items` 在安装前列出条件。每个 `items` 条目包含 `label`、`value`。
3. `useCases` 写具体问题和提问，每项用 `audience` 标明适合人群。功能演示使用 `example.blocks` 自由组合内容，见下方说明。
4. `quickstart.steps` 填一至五步，每步必须有 `title`、`description`、`code`、`codeLabel` 和 `expected`。`expected` 说明完成后应看到的结果；额外说明用可选的 `note`。
5. 将已审核的两张 JPEG 截图放在 `public/plugins/<slug>/assets/`，填写 `comparison.before/after` 的路径、说明和 alt。文件名使用小写字母、数字和连字符。
6. 在 `scripts/validate.mjs` 的 `publicPages` 逐项登记发布资源，在 `publicLinks` 登记精确的 HTTPS 文档地址，并在 `public/index.json` 设置介绍页 `homepage`。
7. 运行 `npm run build:pages`、`npm run ci` 和 `npm run preview`。本地预览地址为 `http://127.0.0.1:4173/plugins/<slug>/`。提交源内容和生成结果。

## 功能演示

`example.title` 是这一节的标题。正文由 `example.blocks` 按顺序排列，不限制块数，也不要求时间线、文件差异或调用回执。每个块都可以带 `title`：

| `type` | 内容字段 |
|---|---|
| `text` | `text`：文字 |
| `image` | `src`：本地 JPEG；`alt`：图片内容；可选 `caption`：图片说明 |
| `list` | `items`：列表 |
| `code` | `code`：代码或命令；可选 `codeLabel`：运行环境 |

可以只放视频，也可以组合截图、说明和示例。只放视频时，`blocks` 可省略或留空。`example.prompt` 可选，有内容时才显示复现提问。需要其他布局时，可以在渲染器中增加内容块，文案和素材仍按插件填写。

AgentLineage 的文件操作演示放在 `example.interactive` 中，类型为 `file-history`，由 `file-history.mjs` 单独渲染。它保留 `operations`、`ui`、`file`、`session` 等字段，演示引用使用 `demo:` 前缀。普通插件无需填写这些字段。

## 可选视频

有已审核的真实录屏时，在 `example` 添加：

```json
"video": {
  "title": "说明这次操作的任务",
  "description": "说明真实运行的版本、结果和必要的剪辑处理",
  "src": "assets/demo.webm",
  "poster": "assets/demo-poster.jpg",
  "captions": "assets/demo-zh.vtt"
}
```

支持 `.mp4`、`.webm`，提供播放控件、封面和中文字幕，默认不播放、不预加载视频内容。视频、封面与字幕必须加入发布资源清单，并人工核对来源和隐私信息。页面演示的录屏不能标成插件真实运行录像。

## 提交前检查

确认首屏能说明用途，使用场景具体。如有可运行的示例，安装验证使用同一任务。使用条件放在安装步骤开头，适用范围和限制可以展开查看；每步只显示一条描述和一个命令框，注意事项并入描述，预期结果放在末尾的“检查结果”中。检查 100% 缩放下的正文、手机换行、标题分隔线、复制、图片放大和键盘操作；使用交互演示的页面还要检查步骤和标签页切换。

提交与上线遵循 [PR 与合并策略](pr-merge-policy.md)。
