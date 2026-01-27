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
  }
  async setCacheJSON (key, data, EX = 3600 * 24 * 365) {
    await redis.set(key, JSON.stringify(data), { EX })
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
      exec(command, { cwd: repoPath }, (error, stdout, stderr) => {
        if (error) {
          if (/(local changes|would be overwritten|Please, commit your changes or stash them)/.test(error.message)) {
            e.reply('插件存在冲突，请执行强制更新')
          } else {
            e.reply(`更新失败：${error.message}`)
          }
        } else {
          if (isForce) {
            e.reply('lolomi-calc 强制更新完成')
          } else if (/(Already up[ -]to[ -]date|已经是最新的)/.test(stdout)) {
            e.reply('lolomi_calc已是最新版本')
          } else {
            e.reply('lolomi-calc 更新完成')
            
            let timer
            timer && clearTimeout(timer)
            this.setCacheJSON('lolomi-calc:restart-msg', {
              msg: '重启成功，新版lolomi_calc已生效',
              qq: e.user_id
            }, 30)
            timer = setTimeout(function () {
              let command = 'npm run start'
              if (process.argv[1].includes('pm2')) {
                command = 'npm run restart'
              }
              exec(command, function (error, stdout, stderr) {
                if (error) {
                  e.reply('自动重启失败，请手动重启。\nError code: ' + error.code + '\n' + error.stack + '\n')
                  console.error(`重启失败\n${error.stack}`)
                  return
                } else if (stdout) {
                  console.log('重启成功，运行已转为后台，查看日志请用命令：npm run log')
                  console.log('停止后台运行命令：npm stop')
                  process.exit()
                }
              })
            }, 1000)
          }
        }
      })
    }
    return true
  }
}