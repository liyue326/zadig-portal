<template>
  <envDetail :envBasePath="envBasePath">
  </envDetail>
</template>

<script>
import envDetail from '../env_detail/envDetailComp.vue'
import bus from '@utils/eventBus'
export default {
  data () {
    return {

    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    envBasePath () {
      return `/v1/projects/detail/${this.projectName}/envs/detail`
    }
  },
  created () {
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        { title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: this.$t('subTopbarMenu.environments'), url: '' }
      ]
    })
  },
  components: {
    envDetail
  }
}
</script>
