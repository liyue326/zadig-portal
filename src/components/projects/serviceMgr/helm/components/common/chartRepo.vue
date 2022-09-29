<template>
  <div class="chart-repo-container">
    <el-form ref="chartRepoForm" :model="chartForm.createFrom" label-width="140px">
      <el-form-item label="选择 Chart 仓库" prop="chartRepoName" :rules="{
              required: true,
              message: '请选择 Chart 仓库',
              trigger: 'change',
            }">
        <el-select v-model="chartForm.createFrom.chartRepoName"  @change="getHelmRepoChart" placeholder="选择 Chart 仓库"  :disabled="isUpdate" size="small">
          <el-option v-for="(repo,index) in repos" :key="index" :label="repo.repo_name" :value="repo.repo_name"></el-option>
        </el-select>
      </el-form-item>
        <el-form-item label="选择 Chart"  prop="chartName" class="chart-select" :rules="{
              required: true,
              message: '请选择 Chart ',
              trigger: 'change',
            }">
            <el-tooltip :disabled="chartForm.createFrom.chartName.length < 10" effect="dark" :content="chartForm.createFrom.chartName" placement="top-start">
              <el-select
                v-model="chartForm.createFrom.chartName"
                @change="getHelmChartVersion"
                placeholder="请选择 Chart"
                :disabled="isUpdate"
                size="small"
              >
                <el-option v-for="(item,key) in chartWithVersion" :key="key" :label="key" :value="key"></el-option>
              </el-select>
            </el-tooltip>
        </el-form-item>
        <el-form-item prop="chartVersion" class="chart-select last" :rules="{
              required: true,
              message: '请选择版本',
              trigger: 'change',
            }">
            <el-select v-model="chartForm.createFrom.chartVersion" placeholder="选择版本"   size="small">
              <el-option v-for="(versionItem,index) in currentRepoVersions" :key="index" :label="versionItem.version" :value="versionItem.version"></el-option>
            </el-select>
        </el-form-item>
        <div class="footer">
          <el-button size="small" @click="$store.commit('SERVICE_DIALOG_VISIBLE', false)" plain>取消</el-button>
          <el-button size="small" type="primary" :loading="importLoading"  @click="importChartRepo">{{ isUpdate?'更新':'新建' }}</el-button>
        </div>

    </el-form>
  </div>
</template>

<script>
import { getHelmRepoAPI, getHelmRepoChartAPI, createTemplateServiceAPI, updateTemplateServiceAPI } from '@api'
export default {
  name: 'ChartRepo',
  data () {
    return {
      chartForm: {
        createFrom: {
          chartRepoName: '',
          chartName: '',
          chartVersion: ''
        },
        source: 'chartRepo'
      },
      importLoading: false,
      isUpdate: false,
      chartWithVersion: [],
      repos: [],
      currentRepoVersions: []
    }
  },
  props: {
    currentSelect: String,
    currentService: Object
  },
  watch: {
    currentService: {
      handler (val) {
        if (val && val.source && val.source === 'chartRepo') {
          this.isUpdate = true
          this.chartForm.createFrom.chartRepoName = val.create_from.chart_repo_name
          this.chartForm.createFrom.chartName = val.create_from.chart_name
          this.chartForm.createFrom.chartVersion = val.create_from.chart_version
          this.getHelmRepoChartVersionWhenReload(val.create_from.chart_repo_name, val.create_from.chart_name)
        } else {
          this.isUpdate = false
        }
      },
      immediate: true
    }
  },
  methods: {
    getHelmRepo () {
      this.chartWithVersion = []
      this.currentRepoVersions = []
      const key = this.$utils.rsaEncrypt()
      getHelmRepoAPI(key).then(res => {
        this.repos = res
      })
    },
    getHelmRepoChart (repoName) {
      getHelmRepoChartAPI(repoName).then(res => {
        this.chartWithVersion = res.entries
      })
    },
    getHelmChartVersion (chartName) {
      this.chartForm.createFrom.chartVersion = ''
      this.currentRepoVersions = this.chartWithVersion[chartName]
    },
    async getHelmRepoChartVersionWhenReload (repoName, chartName) {
      this.chartWithVersion = (await getHelmRepoChartAPI(repoName)).entries
      this.currentRepoVersions = this.chartWithVersion[chartName]
    },
    closeSelectRepo () {
      this.chartForm = {
        createFrom: {
          chartRepoName: '',
          chartName: '',
          chartVersion: ''
        },
        source: 'chartRepo'
      }
      this.$refs.chartRepoForm.resetFields()
    },
    async importChartRepo () {
      this.importLoading = true
      const projectName = this.$route.params.project_name
      const payload = this.chartForm
      const validateResult = await this.$refs.chartRepoForm.validate().catch((err) => { return err })
      if (validateResult) {
        const reqApi = this.isUpdate ? updateTemplateServiceAPI : createTemplateServiceAPI
        const res = await reqApi(projectName, payload).catch(
          err => {
            this.importLoading = false
            console.log(err)
          }
        )
        if (res) {
          this.importLoading = false
          if (res.successServices.length) {
            this.$message.success(
              `${this.isUpdate ? '更新' : '新建'}服务 ${payload.createFrom.chartName} 成功`
            )
          } else {
            this.$message.error(res.failedServices[0].error)
          }
          this.$store.dispatch('queryService', {
            projectName: this.$route.params.project_name,
            showServiceName: payload.createFrom.chartName
          })
          this.$store.commit('SERVICE_DIALOG_VISIBLE', false)
          this.$store.commit('CHART_NAMES', res.successServices.map(service => {
            return {
              serviceName: service,
              type: 'create'
            }
          }))
        }
      } else {
        this.importLoading = false
      }
    }
  },
  mounted () {
    this.getHelmRepo()
  }
}
</script>

<style lang="less" scoped>
.chart-repo-container {
  /deep/ .el-form {
    .el-select {
      width: 100%;
    }

    .chart-select {
      display: inline-block;
      width: calc(~'50% - 5px');

      .el-select {
        width: 100%;
      }

      &.last {
        .el-form-item__content {
          margin-left: 0 !important;
        }
      }
    }

    .footer {
      display: block;
      text-align: right;
    }
  }
}
</style>
