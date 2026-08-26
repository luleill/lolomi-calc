<div style="display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap;">
  <img src="./miku.gif" alt="Miku" width="300">
  <h2 style="margin: 0;">Miku Miku Beeeeeeeeam</h2>
</div>

# Yunzai目录下安装
git clone --depth=1 https://gitee.com/land-route_lu/lolomi-calc.git ./plugins/lolomi-calc/

# 声明
复用liangshi-calc基础框架模版，组队和计算逻辑已重构
* 梁氏源地址 https://gitee.com/liangshi233/liangshi-calc/tree/master
* 计算只适配了梁氏和喵喵，原神角色计算优先级会高于梁氏和喵喵
* 由于miao-plugin更新实在过慢，原神7.0版本迁移miao框架的计算逻辑至lolomi，同时迁移miao-plugin的LICENSE许可文件，相关迁移文件附有注释来源说明
* 原神7.0版本新反应公式及后续计算逻辑lolomi自行维护，计算不再依赖miao-plugin，lolomi未写角色依旧由梁氏和喵喵基础计算兜底，更新后可直接使用jx命令查看下个版本测试角色面板，也可使用面板变换功能提前使用下个版本新武器，前提是lolomi有写
# 相关依赖
建议用 TRSS-Yunzai
* TRSS-Yunzai   https://github.com/TimeRainStarSky/Yunzai
* Miao-Yunzai   https://github.com/yoimiya-kokomi/Miao-Yunzai
* miao-plugin   https://github.com/yoimiya-kokomi/miao-plugin
# 插件说明
* 操作指令说明  #洛洛米帮助
* 移除其他不必要功能，仅保留原神角色伤害计算和极限/核爆/辅助面板
* 精力有限，一般按最新角色和当前卡池五星角色更新，有需要先加的角色可提，已写角色可查看 character.md 文件
* 首次安装默认开启 lolomi-calc，默认开启前后命座提升对比，默认关闭预设2+1标配队友
* 伤害计算优先级：存在已写好的角色数据默认使用 lolomi-calc 计算，如果不存在则使用梁氏>喵喵
* 增加组队配队伤害，根据面板主角色命座配置对应的预设队友，标配计算开关的作用就是不管你主角色几命都会额外再返回 2+1 和 6+5的队友配置伤害
* 主角色 6 命默认配置五星 6+5 队友，2-5 命默认配置 2+1 队友，2 命以下配置 0+0 队友，四星队友默认配置6命
* 队伍伤害计算一般不考虑buff覆盖率和生效次数，高配情况下存在几十万的队伍伤害差异属于正常现象

<details>
<summary><b>效果图预览</b></summary>

<div align="center">
  <img src="./resources/preview/Chiori.png" alt="计算效果图" width="300">
</div>

</details>

<details>
<summary><b>已写角色</b></summary>

- 七七
- 丽莎
- 八重神子
- 兹白
- 初音未来
- 刻晴
- 哥伦比娅
- 夜兰
- 宵宫
- 枫原万叶
- 法尔伽
- 温迪
- 玛拉妮
- 玛薇卡
- 珊瑚宫心海
- 琴
- 甘雨
- 申鹤
- 神里绫人
- 神里绫华
- 胡桃
- 芭芭拉
- 茜特菈莉
- 莉奈娅
- 莫娜
- 达达利亚
- 钟离
- 雷电将军
- 魈
- 菲林斯
- 伊涅芙
- 爱可菲
- 丝柯克
- 尼可
- 洛恩
- 布伦妮
- 恰斯卡
- 奈芙尔
- 菈乌玛
- 桑多涅
- 杜林
- 雅珂达
- 千织
- 希格雯
- 阿蕾奇诺
- 克洛琳德
- 闲云
- 娜维娅
- 爱诺
- 塔利雅
- 伊法
- 瓦蕾莎
- 伊安珊
- 蓝砚
- 奥黛塔
- 阿罗夏
- 梦见月瑞希
- 薇斯纳
- 沃雅妮莎

</details> 