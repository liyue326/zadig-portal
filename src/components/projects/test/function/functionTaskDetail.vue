<template>
  <FunctionTaskDetail :basePath="`projects`"/>
</template>

<script>
import FunctionTaskDetail from '@/components/projects/test/common/function/functionTaskDetail.vue'
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
    taskID () {
      return this.$route.params.task_id
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    setTitleBar () {
      bus.$emit(`set-topbar-title`, {
        title: '',
        breadcrumb: [
          { title: '项目', url: '/v1/projects' },
          { title: this.projectName, isProjectName: true, url: `/v1/projects/detail/${this.projectName}/detail` },
          { title: '测试', url: `/v1/projects/detail/${this.projectName}/test` },
          { title: this.workflowName, url: `/v1/projects/detail/${this.projectName}/test/detail/function/${this.workflowName}` },
          { title: `#${this.taskID}`, url: '' }]
      })
    }
  },
  watch: {
    $route (to, from) {
      this.setTitleBar()
    }
  },
  created () {
    this.setTitleBar()
  },
  components: {
    FunctionTaskDetail
  }
}
</script>
