<template>
  <div v-loading="loading" :element-loading-text="$t('global.loading')" element-loading-spinner="el-icon-loading" class="config-overview-container">
    <div v-if="configMaps.length === 0" class="no-config">
      <h3>暂无配置</h3>
    </div>
    <div v-else class="config-container">
      <div class="type">注意：修改服务配置会重启服务</div>
      <el-table :data="configMaps" style="width: 100%;">
        <el-table-column label="Name" prop="cm_name"></el-table-column>
        <el-table-column label="Value">
          <template slot-scope="{ row }">
            <span>{{ $utils.tailCut(row.yaml_data || '', 80) }}</span>
          </template>
        </el-table-column>
        <el-table-column width="300">
          <template slot-scope="{ row }">
            <el-button @click="jumpEnvConfig('edit', row)" size="mini" icon="el-icon-edit">{{$t(`global.edit`)}}</el-button>
            <el-button @click="jumpEnvConfig('history', row)" size="mini" icon="el-icon-notebook-2">历史版本</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import bus from '@utils/eventBus'
import { getConfigMapObjectAPI } from '@api'

export default {
  data () {
    return {
      window: window,
      editConfigValueVisable: {},
      configMaps: [],
      loading: false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    serviceName () {
      return this.$route.params.service_name
    },
    envName () {
      return this.$route.query.envName
    }
  },
  methods: {
    async getConfigMap () {
      this.loading = true
      await getConfigMapObjectAPI(
        this.projectName,
        this.envName,
        this.serviceName
      ).then(res => {
        this.loading = false
        this.configMaps = res
      })
    },
    jumpEnvConfig (action, data) {
      // action: edit/history
      this.$router.push(
        `/v1/projects/detail/${this.projectName}/envs/detail/${this.envName}/envConfig?type=ConfigMap&cmName=${data.cm_name}&action=${action}`
      )
    }
  },
  created () {
    this.getConfigMap()
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        {
          title: this.$t('subTopbarMenu.environments'),
          url: `/v1/projects/detail/${this.projectName}/envs/detail?envName=${this.envName}`
        },
        {
          title: this.envName,
          url: `/v1/projects/detail/${this.projectName}/envs/detail?envName=${this.envName}`
        },
        {
          title: this.serviceName,
          url: `/v1/projects/detail/${this.projectName}/envs/detail/${this.serviceName}${window.location.search}`
        },
        { title: '配置管理', url: `` }
      ]
    })
  }
}
</script>

<style lang="less">
.config-overview-container {
  position: relative;
  flex: 1;
  padding: 10px 20px;
  overflow: auto;
  font-size: 15px;

  .no-config {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;

    h3 {
      color: #ccc;
    }
  }
}

.config-container {
  margin-bottom: 35px;

  .type {
    margin-bottom: 1rem;
    color: #e6a23c;
  }
}
</style>
