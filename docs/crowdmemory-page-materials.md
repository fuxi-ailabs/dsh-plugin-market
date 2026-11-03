# Crowd Memory 介绍页材料核对

介绍页改用与 AgentLineage 相同的市场模板、生成器及浅色绿色样式。内容源为 `content/plugins/crowdmemory.json`，生成 `index.html`、`styles.css`、`page.js` 和 `demo-data.js`；不再用文档目录式首页。已有详细文档保留。范围仅为 CrowdMemory 内容及资源白名单；其他组件目录、版本和清单保留。

页面、市场中英文描述及 README 统一面向使用 coding Agent 的开发者和开发 workflow 的集成与维护者。场景限定为代码修复、构建排错、接口测试与开发流程；FAQ 说明经验如何交付、如何核对代码与依赖并重新测试。“团队”仅指开发协作，跨机器共享仍为内部预览；其他业务场景的适用性未在当前公开示例与评测中验证。

| 模板元素 | 页面位置或资源 | 性质 |
| --- | --- | --- |
| a 名称 | 首屏 plugin-name | Crowd Memory 及版本 |
| b 一句话用途 | 标题后 lede | 不同 Agent 间的经验复用 |
| c 代表图 | heroMedia / coding-memory.jpg | 四个 Agent 的真实运行画面及角色标注，可放大 |
| d 安装命令 | 标题后代码块、安装第 4 步 | 可复制，adapter 固定 0.1.1 |
| e 使用场景 | #use-cases | 适用人群、具体问题、说明及可复制提问 |
| f 功能演示 | #example / #recording | 四分屏不共享 / 共享对照，C 记录、D 读取来源并验证后端 API 修复 |
| g 前后对比 | #comparison | 实际失败/通过局部截图，另列公开受控评测口径 |
| h 安装与验证 | #quickstart | 独立本地 npm、Runtime 前台启动、端点、profile、status；五步与折叠检查结果 |
| i FAQ | #faq | 原生 details，含版本/profile/范围/失效处理 |
| j 使用文档 | 导航及页脚 | 配置、工具、评测、运行依据 |

a–i 无缺项，不申请例外。顶部固定市场横幅的两个名称分别链接市场主页和组件页，手机保留两个链接。

coding 视频采用 54 秒 4K 四分屏：左列 A、B 独立排查，右列 C 修复 GET 并记录经验、D 读取后接手 POST。四个独立工作区起点同源；原始接口失败、最终接口通过和 C→D 读取回执均独立核对。按阶段整理，不作同步计时或成功率收益结论。实际 prompt、四份 patch、停止原因及剪辑说明见 [coding 录像说明](demos/crowdmemory-coding-recording.md)。zlib 对比图与既有 eval 保留。安装支持范围包含市场基准 0.2.1-rc.2，实际录像使用 DSH 0.1.6-alpha.2、Runtime/adapter 0.1.1。

评测页链接公开数据与 PR #7：120 对 E1 控制任务 45/120 → 104/120 不能解读为 PR #4 的收益。固定 Episode 的 PR #4 前后实验受中继错误和执行噪声影响；恢复轮默认模式与旧版重复对照的内容和提示摘要 10/10 相同，不能证明提炼改进。可选切分丢失修复内容的机械回放也独立标注，不当作 Agent 成功率。

## 四 Agent 对照视频验证（2026-11-03）

- 市场页面基线 `88e6799211199da2879f8e66869983a5cf59f23a`；后端任务源快照 `f81435bb8c6e11cc52a4b6d873e026879cf31963`，任务 patch 未改动市场插件包及版本。
- `npm run build:pages` 与 `npm run ci` 通过。新增 CrowdMemory 生成一致性检查；共享 CSS / page.js 与模板源逐字节一致。
- Chromium 1440×1000、390×844、320×844：文档宽度等于视口宽度，市场两条链接都在视口内；首屏、分节、手机换行已截图查看。
- coding H.264 视频为 3840×2160、30 fps、54 秒；实际播放、默认六条中文字幕与 Range 206 均复核。四个浏览器画面按阶段组合，标签板不改写代码、工具结果或来源。
- 实际剪贴板内容与固定 adapter@0.1.1 安装命令一致；代表图可以放大、Escape 关闭，FAQ 可以展开。
- 后端验证必须在独立临时目录应用公开 patch，核对实际导入的源码路径；分别验证原始代码失败、最终代码通过、既有 Unix socket 接口测试通过，并直接检查 GET/POST 的 HTTP 响应与后续正常请求。具体结果见 coding-evidence.json。
- public/content/docs 中的本次模型凭据匹配扫描为 0，媒体哈希与运行依据一致；完整原始日志、浏览器鉴权和数据库快照保留本机，不提交。
