# candidate.md — RDKit 原生库加载路径候选方案（资料复盘，非本机验证）

> 定位：本文是对历史资料的复盘与候选方案整理。**不是**本机鸿蒙验证，**不**代表任何测试通过。
> 本机为 darwin 工作区，未安装、未执行 RDKit 或任何原生库，未访问网络。

## 1. 历史报错与目录信息（来自 task.md）

| 项 | 内容 |
|---|---|
| 任务号 | nerdd-module-20261102-093341 |
| 库 | nerdd-module 0.3.59（根库） |
| 依赖 | RDKit（分子数据处理） |
| 报错现象 | `import rdkit` 失败，`rdkit/rdBase.so` 找不到 `libRDKitRDBoost.so.1` |
| 关键事实 1 | 该库文件**存在**于 `site-packages/rdkit/.libs/` |
| 关键事实 2 | `rdBase.so` 的 RUNPATH 只有 `$ORIGIN`，**不含** `$ORIGIN/.libs` |
| 输入来源 | migbot-experience-raw，automemory/host-27，`343c60fd2309dbf1edf6d3169b80838c54e1f1cd`，records/2026/11/am-9eca62129bbb8880a8aaf78a/ |

推论（仅基于上述档案记载）：文件存在但不在动态链接器搜索路径中，与"缺 RPATH"型故障的形态一致。此为诊断假设，需在目标环境复核。

### 1.1 已核对的补充档案（两处来源）

| 档案 | 性质 | 提供了什么 |
|---|---|---|
| `rdkit-loader.md` | 同一历史任务（nerdd-module-20261102-093341）的 platform scope 经验条目，stage=verification | 确认 `.libs/` 存放全部伴生 .so；确认「鸿蒙动态加载器不会自动搜 `$ORIGIN/.libs`」；给出**进程启动条件的确证**——`run_shell_verifier.py` 的 pytest 子进程以 `env=dict(os.environ.copy())` 继承父进程环境，故 export 必须在调用 run-stage 之前完成 |
| `nerdd-final-report.md` | 该任务的迁移汇总报告，更新时间 `2026-11-02T03:21:24Z` | 历史测试统计与最终 verdict（见第 8 节） |

两份档案均为**独立历史任务**的产物，早于本次检索到的记忆记录（2026-11-09）。历史 nerdd-module 任务**没有消费本次写入的记忆**；本次 DSH 复盘才展示该跨库读取。详见 `comparison.md` 第六节。

## 2. 检索到的记录编号

- **record_ref：`lr_01a1be9088207711b6379c03f1c707ab`**
- 标题：鸿蒙 musl 下原生扩展缺 RPATH：启动进程前设置 LD_LIBRARY_PATH
- 出处：本机自动确认 · harmony-python-demo · 2026-11-09 · 记录时会话结局：未知
- 类型：pitfall · 范围：global

该记录为**历史环境的档案记载**，本次未重跑鸿蒙验证，故不构成中心核验通过的结论，也不能把历史上那次 pass 直接套用到 RDKit。

## 3. 适用条件（从记录中提炼，需逐条对齐本库）

记录中的做法成立需同时满足：

1. 产物含 Cython / 原生扩展（`.cpython-312-aarch64-linux-ohos.so` 一类），且 `DT_NEEDED` 指向随包分发的 bundled `.so`；
2. wheel 未嵌入能覆盖该 `.so` 所在目录的 RPATH/RUNPATH；
3. 目标平台为 musl 系（鸿蒙 PC 即如此）。

配套的机制要点：

- musl 下 `DT_NEEDED` **只**走动态链接器搜索路径（`LD_LIBRARY_PATH`、`ld-musl.conf`、默认目录），**不**走 `PYTHONPATH`，**不**认 `RTLD_GLOBAL` 预加载，也**不**认进程运行期改的 `os.environ`；
- 因此必须在**启动进程之前**设置 `LD_LIBRARY_PATH`，事后设置无效；
- 目录必须按**当前库**重新定位，指向 venv 中稳定的包目录（verifier 会重装同一 wheel 到该处），**不可**写死 wheel_site 的 run-id 动态路径；
- 已记录的无效弯路：`ctypes.CDLL` 绝对路径 + `RTLD_GLOBAL` 预加载、运行期覆写环境变量、`chmod` 该 `.so`（hmdfs 将 others 位截为 0）、把 `.so` 写入系统库路径（framework_readonly_guard 只放行 private-path 内 `RPATH=$ORIGIN` 的那类嵌入，`LD_LIBRARY_PATH` 仅作验证阶段的绕过手段）。

## 4. apriltag 的路径不能直接用于 RDKit

必须区分"**方法**可复用"与"**路径**不可复用"：

| 维度 | apriltag（记录中的库） | RDKit（本次库） |
|---|---|---|
| 依赖 .so 位置 | `site-packages/<pkg>/` 包根目录，与被依赖的扩展**同级** | `site-packages/rdkit/.libs/`，在扩展的**子目录**里 |
| 扩展 RUNPATH | 无 `$ORIGIN` 类 RPATH | 有 `$ORIGIN`，但只覆盖 `rdkit/`，**不覆盖** `rdkit/.libs/` |
| 应加入搜索路径的目录 | `site-packages/<pkg>` | `site-packages/rdkit/.libs` |

即：apriltag 的 `libapriltag.so` 所在目录写法直接搬到 RDKit 上会指向 `rdkit/`，而 `libRDKitRDBoost.so.1` 在 `rdkit/.libs/`，仍然解析不到。

可复用的是记录的**诊断方法**——在启动验证进程前配置原生加载器搜索路径：先确认缺失符号名 → `grep DT_NEEDED`/`readelf -d` 读出扩展声明依赖的 soname → 在目标机全盘定位该 `.so` 的真实目录 → 确认现有 RPATH 是否覆盖该目录 → 把**那个真实目录**加入 `LD_LIBRARY_PATH` 后再启动新进程验证。方法通用，具体目录必须每次重新测量。

## 5. 候选命令（待替换占位符）

### 5.1 修订命令（**唯一推荐**写法）

```sh
export LD_LIBRARY_PATH="<venv>/lib/python3.12/site-packages/rdkit/.libs${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
```

用 `${VAR:+:$VAR}` 只在原变量**非空**时才追加 `:原值`；原变量未设置或为空时结果里**不出现空路径项**（空项在某些加载器实现下会被解析为当前目录，属于应当避免的隐式行为）。

### 5.2 原始命令（档案 `rdkit-loader.md` 中的写法，留存备查）

```sh
export LD_LIBRARY_PATH=<venv>/lib/python3.12/site-packages/rdkit/.libs:$LD_LIBRARY_PATH
```

### 5.3 两条命令的区别

| | 原始（档案） | 修订（5.1） |
|---|---|---|
| 追加原值 | 裸 `$LD_LIBRARY_PATH` | `${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}` |
| 原变量未设置时 | 产生尾随 `/` 分隔符后的**空路径项** | 无空项，仅 `.libs` 一项 |
| 原变量为空串时 | 同上，空路径项 | 无空项 |
| `.libs` 与后续路径分隔 | 靠字面冒号 | 由 `:+` 展开时自带冒号 |
| 语义 | 等价目标 | 等价目标 + 规避空项 |

修订并非否定档案：档案的写法在其运行环境下能跑通，`env=dict(os.environ.copy())` 的继承机制也不受影响；此处只收紧边界条件。**档案原文未改，两份并存。**

### 5.4 使用前提

- `<venv>` 为**待替换占位符**，需填目标机上实际 venv 根目录；`python3.12` 亦需按目标 venv 实际解释器版本核对后替换。
- 必须在**启动** python / pytest 进程**之前**于同一 shell（或作为子进程继承的环境）export，不可在 Python 内部改 `os.environ` 后重试。
- 候选列为 `.libs` 目录；若目标 `.so` 实际不在该处，应以实测目录为准，不要照抄。
- **以上命令本次一律未执行**，属目标平台待执行项。

## 6. 待在目标环境重新执行的验证步骤

以下步骤**本机未执行**，需在鸿蒙目标环境重跑：

1. **目录与依赖核对**
   - 确认 `<venv>/lib/python3.12/site-packages/rdkit/.libs/libRDKitRDBoost.so.1` 是否存在（`ls`）。
   - `readelf -d <venv>/.../rdkit/rdBase.so`（或 `objdump -p`）确认 `DT_NEEDED` 中的 `libRDKitRDBoost.so.1` 与现有 `RUNPATH` 仅 `$ORIGIN`。
2. **导入验证**（新进程，export 之后）
   - `python -c "import rdkit; print(rdkit.__version__)"`
   - `python -c "from rdkit import rdBase; print(rdBase.rdkitVersion)"` —— 直接触碰历史上失败的那条加载链。
3. **功能验证**
   - `python -c "from rdkit import Chem; m=Chem.MolFromSmiles('CCO'); print(m.GetNumAtoms())"` —— 期望 `3`。
   - 若有 nerdd-module 自带的 RDKit 相关用例，再跑对应子集；无上游用例时如实标注覆盖范围。
4. **对照历史报告**
   - 把本次实测结果与 records/2026/11/am-9eca62129bbb8880a8aaf78a/ 中的历史结论并列，区分"档案记载的历史结论"与"当前可复现的结论"。

## 7. 边界声明（核对 `rdkit-loader.md` 后补入）

**本次复核发现的边界，原文遗漏，现补入：**

1. **只设加载器搜索路径，不碰制品。** 不修改 `site-packages`、不 `patchelf`、不重签任何 `.so`。`LD_LIBRARY_PATH` 属于**环境配置**，不是对依赖制品的修改。
2. **EXP-2024 边界。** 援引档案原文：「依赖制品不归 agent 修」——制品没动，只是让加载器多看一个目录。因此本方案不构成对 RDKit 本身的修复。
3. **该绕法的生效范围仅限 import / 加载阶段。** 它解决的问题是动态链接器找不到 `.libs/` 里的伴生库。
4. **它不修复原生 ABI 层面的函数语义差异。** 档案记载的遗留失败（`MolFromInchi` 对带末尾换行的 bytes 返回 None）在 rdkit 成功加载之后发生，与本方案无因果关系；即便本方案生效，该用例仍可能失败。**二者不可合并为单一结论。**
5. **仍是环境配置层面的绕过，不是发布形态。** 面向最终用户时，正解是 wheel 嵌入覆盖 `$ORIGIN/.libs` 的 RPATH；`LD_LIBRARY_PATH` 只是验证阶段的可行绕法。
6. **失败判定标志**（档案给出，补充本文）：`verifier.log` 出现 `libRDKitRDBoost.so.1: cannot open shared object file`，或 rdkit `ImportError`，且 `find <venv>` 能在 `rdkit/.libs/` 下找到该 `.so`。

## 8. 历史条件通过结论（来自 `nerdd-final-report.md`，档案记载）

| 库 | 状态 | 用例 | 说明 |
|---|---|---|---|
| `pydantic-core==2.50.2` | conditional_pass | 5977 / 6173 | 119 个测试文件全 passed，0 failed/0 error/0 crashed；196 skipped 全为上游 skipif/xfail，0 迁移回归，L1 |
| `nerdd-module==0.3.59` | conditional_pass | 65 / 66 | provenance `verified=true`；唯一失败 `test_read_inchi_file`，归类 TC-0110 原生 ABI 不兼容，`is_library_defect=no`、`impact_scope=optional` |

- `migration_finished: True`；目标库结论 **⚠️ conditional pass**；全批 0 个 pass、2 个条件通过。
- 这些数字**属于档案记载的历史结论**，本次未重跑，不可当作当前可复现的结果。

## 9. 状态总表

| 层级 | 状态 |
|---|---|
| 历史档案（A） | 已读取并转录；数字与 verdict 照抄，未重验 |
| 本次候选方案（B） | 已形成；命令与验证步骤**全部未执行**，待目标平台 |
| 本次本机（C） | 只读文件与 `ls`/`wc`；无原生库执行、无联网、无其他 Agent |

## 10. 最终声明

- 本文仅为**资料复盘 + 候选方案**；未在鸿蒙上验证，也未在本机执行 RDKit。
- 未安装、未执行任何原生库；未访问网络；未调用其他 Agent；未调用 `memory_note`。
- **不声称任何测试通过**；不把档案的 conditional pass 认领为本次结果。
