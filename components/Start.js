import CharCfg from '../../miao-plugin/models/character/CharCfg.js'
import ProfileDmg from '../../miao-plugin/models/ProfileDmg.js'
import Common from '../../miao-plugin/components/Common.js'
import _CharCfg from '../replace/CharCfg.js'
import Config from './Config.js'
import fs from 'node:fs'

const cfg = Config.getConfig('user', 'config')

const Start = {
  init () {
    ProfileDmg.dmgRulePath = (name, game = 'gs') => {
      const _path = process.cwd()
      let dmgFile = [
        { file: 'calc_llm', name: 'lolomicalc', test: () => cfg.lolomicalc },
        { file: 'calc', name: 'miao-plugin' }
      ]
      let newName = name
      for (let ds of dmgFile) {
        let path = `${_path}/plugins/miao-plugin/resources/meta-${game}/character/${name}/${ds.file}.js`
        if (cfg.lolomicalc) {
            path = `${_path}/plugins/lolomi-calc/damage/lolomi-gs/${newName}/${ds.file}.js`
          if (!fs.existsSync(path)) {
            path = `${_path}/plugins/lolomi-calc/damage/lolomi-gs/${newName}/${ds.file}.js`
          }
          if (!fs.existsSync(path)) {
            path = `${_path}/plugins/miao-plugin/resources/meta-${game}/character/${name}/${ds.file}.js`
          }
        }
        if (ds.test && !ds.test()) {
          continue
        }
        if (fs.existsSync(path)) {
          return { path, createdBy: ds.name }
        }
      }
      return false
    }
    CharCfg.getCalcRule = _CharCfg.getCalcRule
    CharCfg.getArtisCfg = _CharCfg.getArtisCfg
  }
}

export default Start
