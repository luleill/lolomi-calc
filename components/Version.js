import lodash from 'lodash'
import fs from 'node:fs'

const _path = process.cwd()
const _logPath = `${_path}/plugins/lolomi-calc/CHANGELOG.md`

// 初始化
let logs = {}           // 原始内容
let changelogs = []     // 版本日志数组
let currentVersion      // 当前版本号
let versionCount = 4    // 日志版本数量

let packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

/**
 * 格式化单行日志内容
 * @param {string} line - 原始日志行
 * @returns {string}
 */
const getLine = function (line) {
  line = line.replace(/(^\s*\*|\r)/g, '')
  line = line.replace(/\s*`([^`]+`)/g, '<span class="cmd">$1')
  line = line.replace(/`\s*/g, '</span>')
  line = line.replace(/\s*\*\*([^\*]+\*\*)/g, '<span class="strong">$1')
  line = line.replace(/\*\*\s*/g, '</span>')
  line = line.replace(/ⁿᵉʷ/g, '<span class="new"></span>')
  return line
}

try {
  if (fs.existsSync(_logPath)) {
    logs = fs.readFileSync(_logPath, 'utf8') || ''
    logs = logs.split('\n')

    let temp = {};
    let lastLine = {}
    lodash.forEach(logs, (line) => {
      if (versionCount <= -1) {
        return false
      }
      
      // 匹配版本号（以#开头）
      let versionRet = /^#\s*([0-9a-zA-Z\\.~\s]+?)\s*$/.exec(line)
      if (versionRet && versionRet[1]) {
        let v = versionRet[1].trim()
        if (!currentVersion) {
          currentVersion = v
        } else {
          changelogs.push(temp)
          if (/0\s*$/.test(v) && versionCount > 0) {
            versionCount = 0
          } else {
            versionCount--
          }
        }

        temp = {
          version: v,
          logs: []
        }
      } else {
        if (!line.trim()) {
          return
        }
        
        // 一级变更项（以*开头的行）
        if (/^\*/.test(line)) {
          lastLine = {
            title: getLine(line),
            logs: []
          }
          temp.logs.push(lastLine)
        } 
        // 二级变更项（以两个以上空格加*开头的行）
        else if (/^\s{2,}\*/.test(line)) {
          lastLine.logs.push(getLine(line))
        }
      }
    })
  }
} catch (e) {
  // 忽略错误
}

const yunzaiVersion = packageJson.version
const isV3 = yunzaiVersion[0] === '3'

let Version = {
  isV3,
  get version () {
    return currentVersion
  },
  get yunzai () {
    return yunzaiVersion
  },
  get changelogs () {
    return changelogs
  }
}

export default Version