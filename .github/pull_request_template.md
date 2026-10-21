## 改动

<!-- 新增/更新了哪个插件、哪个版本，或为什么调整 .dsh-version -->

## 检查清单

- [ ] 本地跑过 `npm ci --ignore-scripts && npm run ci`
- [ ] 新版本 `engines.dsh` 是范围（默认 `^0.2.1-rc.2`）且覆盖 `.dsh-version`
- [ ] Git 来源固定完整 40 位 commit SHA，`path` 指向真实子目录
- [ ] `publishTimestamp` 是来源提交的 Unix 秒
- [ ] 新增页面资源已登记到 `scripts/validate.mjs` 的 `publicPages`
- [ ] 若升级 `.dsh-version`：已列出受影响的插件版本，并确认范围覆盖或已在本 PR 内更新

## 合并

必需检查通过 + 维护者 approval 后 Squash merge。合入后核对 Pages 部署与索引 HTTP 200。
