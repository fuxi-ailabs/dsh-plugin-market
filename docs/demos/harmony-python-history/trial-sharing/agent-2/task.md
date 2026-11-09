# nerdd-module 验证准备
nerdd-module 使用 RDKit 处理分子数据。依赖扩展 rdkit/rdBase.so 引用 libRDKitRDBoost.so.1。
适配记录注明伴生库位于 rdkit/.libs/，rdBase.so 的 RUNPATH 仅为 $ORIGIN，导入曾报依赖库找不到。
修复当前工作区的验证启动脚本，运行 test-launch.py 检查子进程获得的环境。
来源 am-9eca62129bbb8880a8aaf78a，migbot-experience-raw，固定提交 343c60fd2309dbf1edf6d3169b80838c54e1f1cd。
