# Crowd Memory 介绍页材料核对

介绍页改用与 AgentLineage 相同的市场模板、生成器及浅色绿色样式。内容源为 `content/plugins/crowdmemory.json`，生成 `index.html`、`styles.css`、`page.js` 和 `demo-data.js`；不再用文档目录式首页。已有详细文档保留。范围仅为 CrowdMemory 内容及资源白名单；其他组件目录、版本和清单保留。

| 模板元素 | 页面位置或资源 | 性质 |
| --- | --- | --- |
| a 名称 | 首屏 plugin-name | Crowd Memory 及版本 |
| b 一句话用途 | 标题后 lede | 不同 Agent 间的经验复用 |
| c 代表图 | heroMedia / coding-memory.jpg | 实际 coding 会话中的记忆记录，可放大 |
| d 安装命令 | 标题后代码块、安装第 4 步 | 可复制，adapter 固定 0.1.0 |
| e 使用场景 | #use-cases | 适用人群、具体问题、说明及可复制提问 |
| f 功能演示 | #example / #recording | 日常前端 bug 修复、回归测试和另一个 Agent 复用；真实 DSH 录像 |
| g 前后对比 | #comparison | 实际失败/通过局部截图，另列公开受控评测口径 |
| h 安装与验证 | #quickstart | 独立本地 npm、Runtime 前台启动、端点、profile、status；五步与折叠检查结果 |
| i FAQ | #faq | 原生 details，含版本/profile/范围/失效处理 |
| j 使用文档 | 导航及页脚 | 配置、工具、评测、运行依据 |

a–i 无缺项，不申请例外。顶部固定市场横幅的两个名称分别链接市场主页和组件页，手机保留两个链接。

coding 视频展示真实仓库快照中的 JavaScript 修复与测试，不再用 zlib 配置错误充当日常 coding 任务。实际 prompt、patch、验证范围及剪辑说明见 [coding 录像说明](demos/crowdmemory-coding-recording.md)。旧 zlib 对比图仍作为受控示例；其复现、版本、剪辑说明与限制见 [zlib 录像说明](demos/crowdmemory-recording.md)。安装支持范围包含市场基准 0.2.1-rc.2，但实际录像是 DSH 0.1.6-alpha.2，不声称已用新基准版本实测。

评测页链接公开数据与 PR #7：120 对 E1 控制任务 45/120 → 104/120 不能解读为 PR #4 的收益。固定 Episode 的 PR #4 前后实验受中继错误和执行噪声影响；恢复轮默认模式与旧版重复对照的内容和提示摘要 10/10 相同，不能证明提炼改进。可选切分丢失修复内容的机械回放也独立标注，不当作 Agent 成功率。

## 新模板与 coding 视频验证（2026-11-02）

- 基线 `b069e04a755aaaae4c89cb382a578621d84d4a80` 及本次 CrowdMemory 内容源、生成结果、演示材料与白名单差异；其他组件文件未改动。
- `npm run build:pages` 与 `npm run ci` 通过。新增 CrowdMemory 生成一致性检查；共享 CSS / page.js 与模板源逐字节一致。
- Chromium 1440×1000、390×844、320×844：文档宽度等于视口宽度，市场两条链接都在视口内；首屏、分节、手机换行已截图查看。
- 实际播放 coding H.264 视频：72 秒、readyState 4、播放进度前进；默认中文字幕 showing，共 8 条。Range 请求返回 206。逐场景抽帧检查实际代码 diff、测试与记忆来源，没有重画结果。
- 实际剪贴板内容与固定 adapter@0.1.0 安装命令一致；代表图可以放大、Escape 关闭，FAQ 可以展开。
- 两个 coding 任务在独立临时目录中复核：A 的同一份新增测试在原始代码上退出 1（2/4），最终代码退出 0（4/4）；B 对应为 3/5 与 5/5。实际 patch、prompt、来源与回执公开，完整仓库依赖缺失的限制单独说明。
- public/content/docs 中的本次模型凭据匹配扫描为 0，媒体哈希与运行依据一致；完整原始日志、浏览器鉴权和数据库快照保留本机，不提交。
