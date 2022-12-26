<template>
  <component :is="currentComponent"></component>
</template>
<script>
import { getSingleProjectAPI } from '@/api'
import bus from '@utils/eventBus'

export default {
  name: 'service',
  data () {
    return {
      projectInfo: {},
      projectName: null,
      currentComponent: null
    }
  },
  methods: {
    async checkProjectFeature () {
      const projectName = this.projectName
      this.projectInfo = await getSingleProjectAPI(projectName)
      if (this.projectInfo.product_feature) {
        if (this.projectInfo.product_feature.basic_facility === 'kubernetes') {
          if (this.projectInfo.product_feature.create_env_type === 'external') {
            this.currentComponent = () => import('./serviceHost')
            return
          }
          if (this.projectInfo.product_feature.deploy_type === 'helm') {
            this.currentComponent = () => import('./helm/code')
          } else {
            this.currentComponent = () => import('./serviceK8s')
          }
        } else if (
          this.projectInfo.product_feature.basic_facility === 'cloud_host'
        ) {
          this.currentComponent = () => import('./servicePm')
        }
      } else {
        this.currentComponent = () => import('./serviceK8s')
      }
    }
  },
  created () {
    this.projectName = this.$route.params.project_name
    this.checkProjectFeature()
    bus.$emit(`show-sidebar`, false)
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: this.$t('subTopbarMenu.services'), url: '' }
      ]
    })
  }
}
</script>
