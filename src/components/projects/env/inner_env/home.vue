<template>
  <div class="project-home"
       v-loading="loading"
       :element-loading-text="$t(`global.loading`)"
       element-loading-spinner="iconfont iconfont-loading iconrongqi">
    <div v-if="loading"
         class="no-show">
      <img src="@assets/icons/illustration/environment.svg"
           alt="" />
    </div>
    <router-view v-else></router-view>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import { listProductAPI } from '@api'

export default {
  data () {
    return {
      loading: true,
      jumpPath: ''
    }
  },
  methods: {
    async getEnvNameList () {
      const projectName = this.projectName
      const envNameList = await listProductAPI(projectName)
      this.loading = false
      if (envNameList.length) {
        this.jumpPath = `/v1/projects/detail/${this.projectName}/envs/detail?envName=${envNameList[0].name}`
      } else {
        this.jumpPath = `/v1/projects/detail/${this.projectName}/envs/create`
      }
      if (this.$route.params.service_name || this.$route.query.envName || this.$route.params.env_name) {
        return
      }
      this.jumpPath && this.$router.push(this.jumpPath)
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  beforeRouteUpdate (to, from, next) {
    if (!this.jumpPath || to.meta.createEnv) {
      next()
    } else if (!to.params.service_name && !to.query.envName && !to.params.env_name) {
      next({ path: this.jumpPath })
    } else {
      next()
    }
  },
  mounted () {
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [] })

    if (this.$route.query.outer) {
      this.loading = false
      return
    }
    this.getEnvNameList()
  }
}
</script>

<style lang="less" >
.project-home {
  position: relative;
  display: flex;
  flex: 1;
  height: 100%;
  overflow-y: auto;

  .no-show {
    margin: auto;
    padding: 16px 24px;

    img {
      width: 460px;
      height: 460px;
    }

    p {
      color: #606266;
      font-size: 15px;
    }
  }
}
</style>
