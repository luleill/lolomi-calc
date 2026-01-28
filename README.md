# Yunzai目录下安装
git clone --depth=1 https://gitee.com/land-route_lu/lolomi-calc.git ./plugins/lolomi-calc/

# 声明
复用liangshi-calc框架
源地址 https://gitee.com/liangshi233/liangshi-calc/tree/master

# 插件说明
* 基础重构阶段，角色更新会很慢，有需要先写的角色可提
* 移除其他不必要功能，仅保留原神角色伤害计算和极限/核爆/辅助面板
* 首次安装默认开启lolomi-calc，存在已写好的角色数据默认使用lolomi-calc计算，如果不存在则使用喵喵计算
* 低命辅助角色展示具体增益量，高命辅助根据命座展示作为主c的伤害数据
* 增加组队配队伤害，根据面板主角色命座配置预设队友
* 主角色6命默认配置6+5队友，2-5命默认配置2+1队友，2命以下配置0+0队友