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
    this.restartUsers = new Map()
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
  
  async update (e) {
    if (!e.isMaster) {
      e.reply(`你谁？`, true)
      return false
    }
    await this.checkRestartMessage(e)
    
    let isForce = e.msg.includes('强制')
    let repoPath = `${_path}/plugins/lolomi-calc`
    let command = isForce 
      ? 'git fetch --all && git reset --hard origin/master' 
      : 'git pull origin master'
    
    if (fs.existsSync(repoPath)) {
      e.reply(isForce ? '开始强制更新...' : '开始更新...')
      exec(command, { cwd: repoPath }, (error, stdout, stderr) => {
        if (error) {
          if (/(local changes|would be overwritten|Please, commit your changes or stash them)/.test(error.message)) {
            e.reply('插件存在冲突，请执行强制更新')
          } else {
            e.reply(`更新失败：${error.message}`)
          }
        } else {
          if (isForce) {
            e.reply('强制更新完成，正在尝试重新启动Yunzai以应用更新...')
          } else if (/(Already up[ -]to[ -]date|已经是最新的)/.test(stdout)) {
            e.reply('lolomi_calc已是最新版本~')
            return
          } else {
            e.reply('更新完成，正在尝试重新启动Yunzai以应用更新...')
          }
          
          // 存储信息
          this.restartUsers.set(e.user_id, {
            qq: e.user_id,
            timestamp: Date.now()
          })
          
          // 缓存标记
          this.setCacheJSON('lolomi-calc:pending-restart', {
            qq: e.user_id,
            timestamp: Date.now()
          }, 60)
          setTimeout(() => {
            let restartCommand = 'npm run start'
            if (process.argv[1].includes('pm2')) {
              restartCommand = 'npm run restart'
            }
            
            exec(restartCommand, (error, stdout, stderr) => {
              if (error) {
                e.reply('自动重启失败，请手动重启。\nError code: ' + error.code + '\n' + error.stack + '\n')
                console.error(`重启失败\n${error.stack}`)
                this.restartUsers.delete(e.user_id)
                redis.del('lolomi-calc:pending-restart')
                return
              } else if (stdout) {
                console.log('重启成功，运行已转为后台，查看日志请用命令：npm run log')
                console.log('停止后台运行命令：npm stop')
                process.exit()
              }
            })
          }, 1500)
        }
      })
    }
    return true
  }
  
  async checkRestartMessage(e) {
    try {
      let pendingRestart = await this.getCacheJSON('lolomi-calc:pending-restart')
      
      if (pendingRestart && pendingRestart.qq === e.user_id) {
        await redis.del('lolomi-calc:pending-restart')
        e.reply('重启成功，新版lolomi-calc已生效')
        this.restartUsers.delete(pendingRestart.qq)
      }
    } catch (err) {
      console.log('检查重启消息时出错:', err)
    }
  }
}