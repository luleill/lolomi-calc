# config设置内容
# 启用lolomi计算
lolomicalc: true
# 启用lolomi评分规则，目前lolomi评分规则基本没配，这个参数基本用不上
lolomiartis: true
# 计算面板添加标配队友预设
templateteam: false
# 极限预设面板
panelmodel: 1
# 计算面板添加前后命座伤害提升对比
conscompare: true
# 计算框架，auto默认使用lolomi计算公式，miao兜底，不读源码的完全不建议修改此项配置
# lolomi 仅使用lolomi计算，无兜底，lolomi计算出错会直接日志报错，用于调试
# miao 使用miao计算公式，仅原神7.0及后续版本可能出现与lolomi公式不一致的情况
engineMode: auto