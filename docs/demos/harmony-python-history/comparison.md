# comparison.md — 历史档案与本次候选方案的对照

> 三分状态，不得混同：
> - **A 历史档案记载**（archive-asserted）：`rdkit-loader.md`、`nerdd-final-report.md`，2026-11-02 独立历史任务。
> - **B 本次候选方案**（candidate）：`candidate.md`，资料复盘产物，未在目标平台执行。
> - **C 本次本机事实**（local-only）：本机为 darwin 工作区，只读文件、只跑 `ls`/`wc`。

---

## 一、目录与进程启动条件的逐项核对

| 核对项 | 本次候选（B） | 档案（A） | 结论 |
|---|---|---|---|
| 伴生 .so 目录 | `site-packages/rdkit/.libs` | `site-packages/rdkit/.libs/`，存放「全部伴生 .so（libRDKitRDBoost.so.1 等）」 | **一致** |
| `rdBase.so` 的 RUNPATH | 仅 `$ORIGIN`，不含 `.libs` | 同；并补充机制说明「鸿蒙动态加载器不会自动搜 `$ORIGIN/.libs`」 | **一致**，档案更完整 |
| 进程启动条件 | 必须在启动 python / pytest 前 export；不可在进程内改 `os.environ` 后重试 | 在 run-stage 调用进程环境里 export，`run_shell_verifier.py` 的 pytest 子进程以 `env=dict(os.environ.copy())` 继承 | **一致，且档案给出了继承机制的确证** |
| 命令形式 | 修订：`export LD_LIBRARY_PATH="<venv>/lib/python3.12/site-packages/rdkit/.libs${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"` | 原始：`export LD_LIBRARY_PATH=<venv>/lib/python3.12/site-packages/rdkit/.libs:$LD_LIBRARY_PATH` | **等价目标，附加空项规避**；原始命令原样留存于 `candidate.md` 5.2 |
| 占位符 | `<venv>` 待替换 | 同为 `<venv>` | 一致 |
| 失败标志 | 建议 `readelf -d` 读 `DT_NEEDED` | verifier.log 出现 `libRDKitRDBoost.so.1: cannot open shared object file`，或 rdkit ImportError 且 `find venv` 能在 `.libs/` 下找到该 .so | 互补；档案给的是运行期日志标志，候选给的是静态检查 |

**两处真实差异（已处理）**

1. **环境变量拼接** — 档案原作裸 `$LD_LIBRARY_PATH`；候选初稿用 `${LD_LIBRARY_PATH:-}`（空值兜底，但仍会在变量未设置时留下**空路径项**）。**已在 `candidate.md` 第 5.1 节改为 `${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}`**：仅当原变量非空才追加 `:原值`，彻底避免空项。档案的原始写法作为 5.2 节**原样留存**，两条命令的区别在 5.3 节列表对照。
   - 对照结论：`.libs` 目录、`<venv>` 占位符、export 时机三点仍然一致；改进只在边界条件，**不否定档案**。
2. **「不改制品」边界** — 档案明确：**不碰 site-packages、不 patchelf、不重签**，只设加载器路径，援引 EXP-2024「依赖制品不归 agent 修」。候选初稿遗漏。**已补入 `candidate.md` 第 7 节**（含该绕法仅覆盖加载阶段、不修复原生 ABI 语义差异、失败日志标志等 6 条）。

---

## 二、历史测试统计（A，档案记载）

| 库 | 状态 | 用例 | 说明 |
|---|---|---|---|
| `pydantic-core==2.50.2` | conditional_pass | **5977 / 6173 通过** | 119 个测试文件全 passed，0 failed / 0 error / 0 crashed；**196 skipped 全为上游 skipif/xfail 主动跳过**，0 迁移回归；分类 L1 |
| `nerdd-module==0.3.59` | conditional_pass | **65 / 66 通过** | provenance `verified=true` |

`verification` 框架的 pass 门槛是 `passed == total`，故两者都停在 conditional_pass 而非 pass——**pydantic-core 的 196 个 skip 是上游预期行为，无法转为 passed**，属稳态而非缺陷。

规模摘要：done/pass **0**、conditional_pass **2**、其余各类 **0**、合计 **2**。

## 三、遗留失败（A）

仅一处，属于 `nerdd-module`：

- 用例：`tests/basic/input/test_read_inchi_file.py::test_read_inchi_file`
- 现象：**期望 5 条结果，实得 1 条**
- 根因：依赖的原生库 rdkit 的 `MolFromInchi` 在 HarmonyOS 上对**带末尾换行的 bytes 输入返回 None**（stripped 后可正常解析）
- 归类：**TC-0110 原生 ABI 不兼容**；`is_library_defect=no`、`impact_scope=optional`
- 判定：**非本库纯 Python 代码缺陷**

**这一点必须与本次候选方案分开看**：`LD_LIBRARY_PATH` 解决的是 *import 阶段的动态链接器找不到 .so*；上述遗留失败是 *rdkit 已成功加载之后、函数语义层面的原生 ABI 差异*。档案中的绕法**并未修复**该用例——档案只记载 `import rdkit` 能走通、provenance 通过，65/66 里那 1 个失败仍然存在。候选方案不可被误读为对这一失败的修复。

## 四、最终 verdict（A）

- `migration_finished: True`，验证模式 `shell`，`auto_mode: True`，更新时间 `2026-11-02T03:21:24Z`
- 目标库结论：`nerdd-module` → **⚠️ conditional pass**
- 全批：**2 个条件通过，0 个 pass**，无 blocked / dep_failed / give-up / 降级 / ungated / pending

注意：**档案没有 pass**。历史上是 conditional pass，不等于通过。

---

## 五、状态分离声明

| 层级 | 本次 DSH 复盘实际做到了什么 |
|---|---|
| A 历史档案 | 仅**读取并转录**。数字、verdict、根因均照抄档案原文，未重新计算、未重新验证。 |
| B 候选方案 | **未执行**。`candidate.md` 中的命令、import 步骤、`MolFromSmiles('CCO')` 功能验证全部是待执行清单，在鸿蒙目标环境尚未跑过。 |
| C 本机 | 只读了 4 个文件、执行了 `pwd`/`ls`/`wc`。**未安装、未执行任何原生库**（含 RDKit），未联网，未调用其他 Agent，未调用 `memory_note`。本机为 darwin，不具备鸿蒙 musl 环境，也无从在此复现。 |

因此：**本次不声称任何测试通过**，也不把档案里的 conditional pass 认领为本次结果。

## 六、两份档案是独立历史任务，未消费本次记忆

- 时间线：`nerdd-final-report.md` 更新于 **2026-11-02T03:21:24Z**，`rdkit-loader.md` 出自同一 historical 工作区 `nerdd-module-20261102-093341`。本次检索到的经验记录 `lr_01a1be9088207711b6379c03f1c707ab` 日期为 **2026-11-09**（harmony-python-demo / apriltag）。
- 即**档案早于该记录**。历史上跑 nerdd-module 的调度器与 agent 在 11-02 时，该记忆尚不存在，**没有也不可能消费它**。档案里那条 `LD_LIBRARY_PATH ... rdkit/.libs` 是当时**就地得出**的结论（`rdkit-loader.md` 属 platform scope 经验条目，出自该任务自身的诊断），不是从本次记忆里读来的。
- 反过来说：本次记忆对 RDKit 的复用在**本次 DSH 复盘**才发生——这是我们在 11-09 用一条 apriltag 的经验去核对 RDKit 档案的**跨库读取**。档案本身与这次读取无因果关系。
- 由此得出一条更谨慎的口径：apriltag 记录提供的是**方法**（启动进程前配置加载器搜索路径、musl 不认运行期改环境变量），RDKit 的**具体目录**（`.libs/` 子目录）是档案独立确认的。两者来源不同，不可互相"背书"。

---

## 七、待办

1. ✅ **已补充** — 在 `candidate.md` 补上「不改制品」边界（不碰 site-packages / 不 patchelf / 不重签，只设加载器路径）。落于 `candidate.md` **第 7 节**，共 6 条，含 EXP-2024 援引与该绕法不修复原生 ABI 语义差异的说明。
2. ✅ **已补充** — 候选环境变量拼接改为 `${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}`，避免原变量未设置时产生空路径项。落于 `candidate.md` **第 5.1 节**（修订命令）；**5.2 节原样保留档案的原始命令**，5.3 节列出两者区别，占位符说明移至 5.4 节。
3. ⏳ **待执行（目标平台）** — 在鸿蒙目标环境按 `candidate.md` 第 6 节步骤实测后，再回来与本文件第二节、第四节的历史数字并列；届时仍需标明"档案记载"与"实测所得"两栏。
4. ⏳ **待执行（目标平台）** — 若实测 `import rdkit` 通过但仍出现 `test_read_inchi_file` 类失败，应如实记为**加载问题已解决、原生 ABI 问题依旧**，不得合并为单一结论。

> 第 3、4 项依赖目标平台运行，**本次未执行**。本次仅改动 `candidate.md` 与 `comparison.md` 两个文件，属资料核对与文档修订。
