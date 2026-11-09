---
name: rdkit wheel 的 .libs/ 子目录在鸿蒙上需 LD_LIBRARY_PATH 才能被 rdBase.so 加载
description: 任何间接依赖 rdkit 的库在鸿蒙上跑 verification 时，provenance/import 会因 rdkit 的 .so 找不到 .libs/ 子目录里的伴生库而 ImportError，绕法。
stage: verification
scope: platform
---

rdkit wheel 在 site-packages/rdkit/.libs/ 下放了全部伴生 .so（libRDKitRDBoost.so.1 等），但 rdkit/rdBase.so 的 RUNPATH 只到 `$ORIGIN`（即 rdkit/ 本身，不含 .libs/ 子目录）。鸿蒙动态加载器不会自动搜 `$ORIGIN/.libs`，所以 `import rdkit` 时 rdBase.so 找不到 libRDKitRDBoost.so.1 → ImportError → verification provenance 检查直接 fail，0/N 用例。

绕法（不碰 site-packages、不 patchelf、不重签，只设加载器路径）：rerun verification run-stage 时在调用进程环境里 export `LD_LIBRARY_PATH=<venv>/lib/python3.12/site-packages/rdkit/.libs:$LD_LIBRARY_PATH`。verifier (run_shell_verifier.py) 的 pytest 子进程 `env=dict(os.environ.copy())` 会继承，rdBase.so 经加载器就能找到 .libs/ 里的伴生库。注意：这是环境配置（加载器搜索路径），不是改依赖制品，符合 EXP-2024「依赖制品不归 agent 修」的边界——制品没动，只是让加载器多看一个目录。

适用任何「间接依赖 rdkit 的纯 Python 库」在鸿蒙上的 verification。判断标志：verifier.log 出现 `libRDKitRDBoost.so.1: cannot open shared object file` 或 rdkit ImportError，且 find venv 能在 rdkit/.libs/ 下找到该 .so。
