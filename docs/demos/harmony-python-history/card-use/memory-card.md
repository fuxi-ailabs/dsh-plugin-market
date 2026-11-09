# 原生库启动脚本卡

- **卡片编号**：lr_01a1bec35c267fd68370ff34663f6058（rev 2）
- **触发条件**：wheel 的 Cython 扩展以 DT_NEEDED 依赖同目录 .so 却无 RPATH，子进程报 Error loading shared library。
- **原因**：musl 仅按链接器搜索路径解析 DT_NEEDED，LD_LIBRARY_PATH 只在进程启动时读一次；脚本收了目录参数却未导出。
- **代码修法**：
  ```sh
  export LD_LIBRARY_PATH="$native_dir${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
  exec "$@"  # 换库时按该库 site-packages/<pkg> 重定位 native_dir
  ```
- **来源**：am-347d912831feb751855892df（migbot-experience-raw），提交 343c60fd2309dbf1edf6d3169b80838c54e1f1cd。
- **验证范围**：仅本机启动脚本的子进程环境传递，3 项启动测试通过；历史库结论留在来源中。
