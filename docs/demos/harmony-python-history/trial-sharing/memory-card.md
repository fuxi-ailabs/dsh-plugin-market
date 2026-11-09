# memory-card

- 卡片编号: lr_01a1c03b862d7f35ab9de9b21692d7b3
- 触发条件: 启动脚本收下原生库目录参数后，子进程报 libapriltag.so: No such file or directory
- 原因: musl 下 DT_NEEDED 只查动态链接器搜索路径，wheel 未嵌 RPATH，脚本又只 shift 未导出
- 代码修法: 在 `exec "$@"` 前加 `export LD_LIBRARY_PATH="$native_dir${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"`
- 来源: am-347d912831feb751855892df @343c60fd2309dbf1edf6d3169b80838c54e1f1cd
- 验证范围: 启动脚本的子进程环境传递
