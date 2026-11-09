# memory-card

- 编号：lr_01a1bf3a299479fbbcebc9b447798c29
- 触发条件：musl 下 import 报 `Error loading shared library lib*.so: No such file or directory`，而该 .so 就在 site-packages/<pkg>/
- 原因：wheel 未嵌 RPATH，DT_NEEDED 只查动态链接器路径；启动脚本收了目录却没导出
- 代码修法（exec 前）：
  ```bash
  export LD_LIBRARY_PATH="$native_dir${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
  ```
- 来源：am-347d912831feb751855892df，提交 343c60fd2309dbf1edf6d3169b80838c54e1f1cd
- 验证范围：启动脚本的子进程环境传递
