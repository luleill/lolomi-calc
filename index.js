import fs from 'node:fs'
import Start from './components/Start.js'

Start.init()

logger.info('lolomi-calc 加载成功')
logger.info('---------------------------')
const files = fs.readdirSync('./plugins/lolomi-calc/apps').filter(file => file.endsWith('.js'))

let ret = []

files.forEach((file) => {
  ret.push(import(`./apps/${file}`))
})

ret = await Promise.allSettled(ret)

let apps = {}
for (let i in files) {
  let name = files[i].replace('.js', '')

  if (ret[i].status != 'fulfilled') {
    logger.error(`载入插件错误：${logger.red(name)}`)
    logger.error(ret[i].reason)
    continue
  }
  apps[name] = Object.values(ret[i].value).find(v => typeof v === 'function')
}
export { apps }
