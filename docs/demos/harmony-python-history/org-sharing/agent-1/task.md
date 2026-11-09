# apriltag-python 验证准备
库用于 AprilTag 视觉标记识别。原生依赖为 libapriltag.so。
适配记录注明文件存在于包目录，但验证进程曾报 Error loading shared library libapriltag.so: No such file or directory。
工作区提供验证启动脚本和子进程环境测试，先复现当前脚本问题，再修复并测试。
来源 am-347d912831feb751855892df，migbot-experience-raw，固定提交 343c60fd2309dbf1edf6d3169b80838c54e1f1cd。
