<template>
  <div class="micro-container" v-loading="!hasMounted" element-loading-text="加载中...">
    <div id="container"></div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import {
  /* loadMicroApp */ addGlobalUncaughtErrorHandler,
  initGlobalState
} from 'qiankun'
import { /* microApps, */ registerApps } from './index'
import bus from '@utils/eventBus'

// hack
let rawAppendChild = null
let rawAddEventListener = null

export default {
  data () {
    return {
      // microList: {}
      currentInfo: {
        mount: false,
        title: '',
        breadcrumb: []
      }
    }
  },
  // methods: {
  //   async activationHandleChange (path) {
  //     const activeRules = microApps.map((app) => app.activeRule)
  //     const isMicro = activeRules.some((rule) => path.startsWith(rule))
  //     if (!isMicro) return
  //     const microItem = microApps.find((app) => path.startsWith(app.activeRule.toString()))
  //     if (!microItem) return
  //     const current = this.microList[microItem.activeRule.toString()]
  //     if (current) return
  //     const micro = loadMicroApp({ ...microItem })
  //     this.microList[microItem.activeRule.toString()] = micro
  //     try {
  //       await micro.mountPromise
  //     } catch (e) {
  //       console.error('mountPromise error:', e)
  //     }
  //   }
  // },
  // watch: {
  //   '$route.path': function (newValue) {
  //     this.activationHandleChange(newValue)
  //   }
  // },
  methods: {
    initGlobalStateFn () {
      this.actions = initGlobalState(this.currentInfo)
      this.actions.onGlobalStateChange((state, prev) => {
        console.log('onGlobalStateChange', state, prev)
        this.currentInfo = state
        if (!state.breadcrumb.filter(bc => !bc).length) {
          bus.$emit(`set-topbar-title`, {
            title: '',
            breadcrumb: state.breadcrumb.map(bc => {
              return {
                ...bc,
                // 目前只有这里的url需要/v1前缀，其他的在跳转时在前面加上，这里后面可以改成非/v1开头
                url: bc.url ? '/v1' + bc.url : ''
              }
            })
          })
        }
      })
    }
  },
  computed: {
    hasMounted () {
      return this.currentInfo.mount
    },
    ...mapState({
      signatureFeatures: state => state.checkPlutus.features
    })
  },
  mounted () {
    addGlobalUncaughtErrorHandler(event => console.log('global error: ', event))
    this.initGlobalStateFn()
    // if (window.qiankunStarted) return
    // window.qiankunStarted = true
    registerApps(this.signatureFeatures)
    // this.activationHandleChange(this.$route.path)
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [{ title: '客户交付', url: '' }]
    })
  },
  beforeRouteEnter (to, from, next) {
    rawAppendChild = HTMLHeadElement.prototype.appendChild
    rawAddEventListener = window.addEventListener
    next()
  },
  beforeRouteLeave (to, from, next) {
    HTMLHeadElement.prototype.appendChild = rawAppendChild
    window.addEventListener = rawAddEventListener
    next()
  }
  // destroyed () {
  // window.qiankunStarted = false
  // Object.values(this.microList).forEach((mic) => {
  //   mic.unmount()
  // })
  // }
}
</script>

<style lang="less" scoped>
.micro-container {
  box-sizing: border-box;
  height: calc(~'100% - 41px');
  max-height: calc(~'100% - 41px');
  padding: 15px 24px;

  #container {
    position: relative;
    height: 100%;
    max-height: 100%;
    overflow: hidden;
  }
}
</style>

<style lang="less">
// popover style
@import url('./css/popover-pcc.less');
</style>
