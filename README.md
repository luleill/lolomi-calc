<div style="display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap;">
  <img src="./miku.jpg" alt="Miku" width="300">
  <h1 style="margin: 0;">呀帕里，Miku酱哇卡哇伊哟</h1>
</div>

# Yunzai目录下安装
git clone --depth=1 https://gitee.com/land-route_lu/lolomi-calc.git ./plugins/lolomi-calc/

# 声明
复用liangshi-calc框架
源地址 https://gitee.com/liangshi233/liangshi-calc/tree/master
* 计算只适配了梁氏和喵喵，原神角色计算优先级会高于梁氏和喵喵
* 如果装了其他计算插件导致报错，请直接卸载我的
# 相关依赖
* Miao-Yunzai   https://github.com/yoimiya-kokomi/Miao-Yunzai
* miao-plugin   https://github.com/yoimiya-kokomi/miao-plugin
# 插件说明
* 操作指令说明  #洛洛米帮助 
* 移除其他不必要功能，仅保留原神角色伤害计算和极限/核爆/辅助面板
* 基础重构阶段，角色更新会很慢，有需要先写的角色可提
* 首次安装默认开启lolomi-calc，存在已写好的角色数据默认使用lolomi-calc计算，如果不存在则使用梁氏>喵喵
* 低命辅助角色展示具体增益量，高命辅助根据命座展示作为主c的伤害数据
* 增加组队配队伤害，根据面板主角色命座配置预设队友
* 主角色6命默认配置6+5队友，2-5命默认配置2+1队友，2命以下配置0+0队友