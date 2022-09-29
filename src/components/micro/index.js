import { registerMicroApps, start } from 'qiankun'
// import store from '@/store'
// import utils from '@/utilities/utilities'
import router from '@/router/index.js'

// debug address
const prefix = process.env.NODE_ENV === 'development' ? '//localhost:10000' : ''

export const activeRule = []

export const microApps = [
  {
    name: 'plutusVendor',
    entry: `${prefix}/plutus-vendor/`,
    container: '#container',
    activeRule,
    props: {
      routerBase: '/v1',
      //   mainStore: store,
      //   user: utils.getStorage('user'),
      mainAppRouter: router
    }
  }
]

export const registerApps = ({ delivery, release_center }) => {
  activeRule.splice(0, activeRule.length, '/v1/enterprise')

  if (delivery) {
    activeRule.push('/v1/plutus')
  }
  if (release_center) {
    activeRule.push('/v1/release')
  }

  registerMicroApps(microApps, {
    beforeLoad: (app) => {
    //   store.commit('app/loadingMicro', true)
      console.log('before load app.name====>>>>>', app.name)
    },
    beforeMount: [
      (app) => {
        console.log('[LifeCycle] before mount %c%s', 'color: green;', app.name)
      }
    ],
    afterMount: [
      (app) => {
        // store.commit('app/loadingMicro', false)
        console.log('[LifeCycle] after mount %c%s', 'color: green;', app.name)
      }
    ],
    beforeUnmount: [
      (app) => {
        console.log('[LifeCycle] before unmount %c%s', 'color: green;', app.name)
      }
    ],
    afterUnmount: [
      (app) => {
        console.log('[LifeCycle] after unmount %c%s', 'color: green;', app.name)
      }
    ]
  })

  start({
    sandbox: {
      prefetch: 'all',
      // strictStyleIsolation: true // true,
      experimentalStyleIsolation: true // true
    }
  })
}
