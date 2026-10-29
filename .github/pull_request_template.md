## 改动

<!-- 新增/更新了哪个插件、哪个版本，或为什么调整 .dsh-version -->

## 介绍页元素

UI 可以不同。请填写页面位置；a–i 某项不适用时，逐项解释原因。使用文档可选。
Top banner 必须保留两个链接，且手机端和滚动后仍可返回市场主页。

| 元素 | 页面位置 / 不适用的具体原因 |
| --- | --- |
| Top banner：市场名称 / 组件名称，分别链接市场主页与组件页 | |
| a) 名称 | |
| b) 一句话用途 | |
| c) 代表图 | |
| d) `dsh plugin add` 命令（可通过 npx 调用） | |
| e) 使用场景 | |
| f) 功能演示图、demo 视频或流程图 | |
| g) 使用前后效果对比 | |
| h) 安装与验证 / 简易 SOP | |
| i) FAQ | |
| j) 使用文档（可选） | |

## 检查清单

- [ ] 本地跑过 `npm ci --ignore-scripts && npm run ci`
- [ ] 新版本 `engines.dsh` 是范围（默认 `^0.2.1-rc.2`）且覆盖 `.dsh-version`
- [ ] Git 来源固定完整 40 位 commit SHA，`path` 指向真实子目录
- [ ] `publishTimestamp` 是来源提交的 Unix 秒
- [ ] 新增页面资源已登记到 `scripts/validate.mjs` 的 `publicPages`
- [ ] 若升级 `.dsh-version`：已列出受影响的插件版本，并确认范围覆盖或已在本 PR 内更新

## 合并

必需检查通过 + 维护者 approval 后 Squash merge。合入后核对 Pages 部署与索引 HTTP 200。
