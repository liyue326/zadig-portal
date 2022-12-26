<template>
  <FunctionSummary :basePath="`projects`"/>
</template>

<script>
import FunctionSummary from '@/components/projects/test/common/function/functionSummary.vue'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
    }
  },
  computed: {
    workflowName () {
      return this.$route.params.test_name
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  created () {
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' },
        { title: this.projectName, isProjectName: true, url: `/v1/projects/detail/${this.projectName}/detail` },
        { title: this.$t('subTopbarMenu.tests'), url: `/v1/projects/detail/${this.projectName}/test` },
        { title: this.workflowName, url: '' }]
    })
  },
  components: {
    FunctionSummary
  }
}
</script>
