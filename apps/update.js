import fs from 'fs'
import { exec } from 'child_process'
import plugin from '../../../lib/plugins/plugin.js'

const _path = process.cwd()

export class calc extends plugin {
  constructor () {
    super(
       {
         name: '插件更新',
         dsc: '插件更新',
         event: 'message',
         priority: 5000,
         rule: [
          {
            reg: '^#*(强制)?更新(洛洛米|lolomi)(计算|插件)?$',
            fnc: 'update'
          }
        ]
      }
    )
    this.key = 'lolomi-calc:restart'
    this.restartUsers = new Map()
  }
  init() {
    Bot.once('online', this.restartMsg.bind(this))
  }
  async setCacheJSON (key, data, EX = 3600 * 24 * 365) {
    await redis.set(key, JSON.stringify(data), { EX })
  }
  async getCacheJSON (key) {
    let data = await redis.get(key)
    if (data) {
      return JSON.parse(data)
    }
    return null
  }
  
  async restartMsg() {
    try {
      let restart = await redis.get(this.key)
      if (!restart) return
      await redis.del(this.key)
      restart = JSON.parse(restart)
      const msg = [`重启成功，新版lolomi-calc已生效，用时${Bot.getTimeDiff(restart.time)}`]
      if (restart.group_id) {
        await Bot.sendGroupMsg(restart.bot_id, restart.group_id, msg)
      } else if (restart.user_id) {
        await Bot.sendFriendMsg(restart.bot_id, restart.user_id, msg)
      }
    } catch (err) {
      console.log('发送重启消息时出错:', err)
    }
  }
  async update (e) {
    if (!e.isMaster) {
      e.reply(`你谁？`, true)
      return false
    }
    
    let isForce = e.msg.includes('强制')
    let repoPath = `${_path}/plugins/lolomi-calc`
    let command = isForce 
      ? 'git fetch --all && git reset --hard origin/master' 
      : 'git pull origin master'
    
    if (fs.existsSync(repoPath)) {
      exec(command, { cwd: repoPath }, (error, stdout) => {
        if (error) {
          if (/(local changes|would be overwritten|Please, commit your changes or stash them)/.test(error.message)) {
            e.reply('插件存在冲突，请执行强制更新')
          } else {
            e.reply(`更新失败：${error.message}`)
          }
        } else {
          if (isForce) {
            e.reply('强制更新完成，正在尝试重启以应用更新...')
          } else if (/(Already up[ -]to[ -]date|已经是最新的)/.test(stdout)) {
            e.reply('lolomi-calc已是最新版本~')
            return
          } else {
            e.reply('更新完成，正在尝试重启以应用更新...')
          }
          
          // 存储重启信息到Redis
          const restartInfo = {
            group_id: e.group_id,
            user_id: e.user_id,
            bot_id: e.self_id,
            time: Date.now(),
            isForce: isForce
          }
          
          redis.set(this.key, JSON.stringify(restartInfo), { EX: 3600 })
          
          setTimeout(() => {
            let restartCommand = 'npm run start'
            if (process.argv[1].includes('pm2')) {
              restartCommand = 'npm run restart'
            }
            
            exec(restartCommand, (error, stdout) => {
              if (error) {
                e.reply('自动重启失败，请手动重启。\nError code: ' + error.code + '\n' + error.stack + '\n')
                console.error(`重启失败\n${error.stack}`)
                redis.del(this.key)
                return
              } else if (stdout) {
                console.log('重启成功，运行已转为后台，查看日志请用命令：npm run log')
                console.log('停止后台运行命令：npm stop')
                process.exit()
              }
            })
          }, 3000)
        }
      })
    }
    return true
  }
}