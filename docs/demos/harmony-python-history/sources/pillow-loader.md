---
name: ohos-pc-pil-brotli-needs-ld-library-path
description: 鸿蒙 PC 真机上 PIL wheel 内嵌的 libbrotlidec/libbrotlicommon 报 Permission denied 加载失败时，给进程注入 LD_LIBRARY_PATH 指到 PIL 目录即可修复
scope: platform
stage: verification
---

OHOS 真机 musl loader 对 Pillow ohos wheel 内嵌的 `libbrotli*.so.1`（位于 `site-packages/PIL/`）解析 `$ORIGIN` RUNPATH 失败，报 `libbrotlicommon.so.1: cannot open shared object file` 或 `Permission denied`（后者易误导去查权限/xattr，实际不是权限问题）。同目录下 `/usr/local/lib` 里的另一份 brotli 是 glibc 构建产物，永远加载不了，别在那上面浪费时间。

修法（验证阶段实测有效）：
- 确认 `.so` 有执行位（pip 装出来有时是 644，`chmod 0755` 一下）
- 让 pytest 进程带上 `LD_LIBRARY_PATH=<venv>/lib/python3.12/site-packages/PIL`；验证器 `run_shell_verifier.py` 的 pytest 子进程 env 来自 `os.environ.copy()`，所以在调用 run-stage 的 shell 里 export（或命令前缀）即可透传，prepare_verify_env 不会覆盖它

症状指纹：`_imagingft` 模块加载失败 → `ImageFont.truetype` 报错 → visual conformity 类测试 2 个 fail，其余全过。
