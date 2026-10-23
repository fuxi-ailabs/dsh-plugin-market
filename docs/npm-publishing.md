# 团队 npm 发布

团队作用域为 `@fuxi-ailabs`，组织管理员账号为 `fuxi-ailabs-admin`。

| 组件 | 组织包名 | 当前迁移版本 | 预发布标签 | 原包维护者 |
|---|---|---|---|---|
| ECAT | `@fuxi-ailabs/dsh-ecat` | `0.1.0-alpha.1` | `alpha` | `thomsonhuawei` |
| DT Verify | `@fuxi-ailabs/dsh-dt-verify` | `0.1.0-dev.20` | `next` | `tao_12232` |

## 组件侧

构建产物的 `package.json.name` 与 Bundle patch 中负责加载本组件的 `name` 都必须使用上表中的完整包名。Skill 名、命令名和 `dt-verify.*` / `fuxi.ecat` 实例 ID 保持原有标识。

每个包在 `publishConfig` 中设置 `registry: "https://registry.npmjs.org/"`、`access: "public"` 与对应预发布标签。Verify 的配置来自 harmony-verify 的 `tools/deepseek.ts` 和 `packaging/deepseek/cordis.patch.yml`，使用 `npm run pack:deepseek` 从源码生成，不手改 `dist/`。ECAT 的 DSH 适配器源码应由组件维护者在其发布源中同步包名、patch 和发布配置。

发布前核对包内容，在全新 DSH Profile 中安装候选 tarball，并复验命令、Skill 与相对资源可以加载。DT Verify 还运行 `npm run verify:deepseek`。这些检查不代替真实模型或设备业务验收。

```sh
npm whoami --registry=https://registry.npmjs.org/
npm publish ./fuxi-ailabs-dsh-ecat-0.1.0-alpha.1.tgz --registry=https://registry.npmjs.org/ --access public --tag alpha
npm publish ./fuxi-ailabs-dsh-dt-verify-0.1.0-dev.20.tgz --registry=https://registry.npmjs.org/ --access public --tag next
```

## 市场侧

从 registry 回读实际版本、`dist.integrity` 和版本发布时间，与验收过的 tarball 对照。市场条目的 `name` 使用完整组织包名，`publishTimestamp` 使用该组织包版本的实际发布时间（Unix 秒），同时同步安装文档中的包名与链接。旧的无作用域包仍是独立包。

按市场现有 PR 流程运行 `npm run ci`、取得维护者 approval 后合入，再核对 Pages 部署和线上索引。
