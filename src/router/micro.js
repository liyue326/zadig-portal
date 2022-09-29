
export const plutusRoute = ({ release_center, delivery }) => {
  const plutus = delivery ? '|plutus' : ''
  const release = release_center ? '|release' : ''

  return [
    {
      path: `/v1/(enterprise${plutus}${release})`,
      component: () => import(/* webpackChunkName: "micro-app" */ '@/components/entry/home.vue'),
      meta: {
        requiresAuth: true
      },
      children: [
        {
          path: '*',
          component: () => import(/* webpackChunkName: "micro-app" */ '@/components/micro/index.vue'),
          meta: {
            title: '企业功能'
          }
        }
      ]
    }
  ]
}
