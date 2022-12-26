import Vue from 'vue'
import VueI18n from 'vue-i18n'
import locale from 'element-ui/lib/locale'
import storejs from 'storejs'

// Element UI locale
import elementUIEn from 'element-ui/lib/locale/lang/en'
import elementUIZhCN from 'element-ui/lib/locale/lang/zh-CN'

// Zadig locale
import zadigZhCN from './zh-CN'
import zadigEn from './en'

Vue.use(VueI18n)

function initLang () {
  let lang = (navigator.language || navigator.browserLanguage).toLowerCase()
  if (storejs.get('language')) {
    lang = storejs.get('language')
  } else if (lang === 'zh-cn') {
    lang = 'zh-cn'
  } else if (/en/.test(lang) === true) {
    lang = 'en'
  } else {
    lang = 'zh-cn'
  }
  return lang
}

const i18n = new VueI18n({
  locale: initLang(),
  messages: {
    en: {
      ...elementUIEn,
      ...zadigEn
    },
    'zh-cn': {
      ...elementUIZhCN,
      ...zadigZhCN
    }
  }
})
locale.i18n((key, value) => i18n.t(key, value))

if (module.hot) {
  module.hot.accept(['./zh-CN', './en'], function () {
    i18n.setLocaleMessage('en', require('./en').default)
    i18n.setLocaleMessage('zh-cn', require('./zh-CN').default)
  })
}

export default i18n
