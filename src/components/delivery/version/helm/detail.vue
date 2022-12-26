<template>
  <div class="helm-version-detail">
    <el-tabs type="border-card">
      <el-tab-pane :label="$t('deliveryCenter.versionInfo')">
        <div v-loading="loading">
          <div class="version-title">{{$t('global.basicInfo')}}</div>
          <div class="basic-info">
            <el-row :gutter="10">
              <el-col :span="10">
                {{$t('deliveryCenter.versionName')}}:
                <span class="dark-color">{{versionInfo.version}}</span>
              </el-col>
              <el-col :span="10">
                {{$t('deliveryCenter.versionTag')}}:
                <el-tag size="mini" v-for="(label,index) in versionInfo.labels" :key="index" style="margin-right: 5px;">{{label}}</el-tag>
              </el-col>
            </el-row>
            <el-row :gutter="10">
              <el-col :span="10">
                {{$t('global.creator')}}:
                <span class="dark-color">{{versionInfo.createdBy}}</span>
              </el-col>
              <el-col :span="10">
               {{$t('deliveryCenter.creationTime')}}:
                <span class="dark-color">{{$utils.convertTimestamp(versionInfo.created_at)}}</span>
              </el-col>
            </el-row>
            <el-row :gutter="10">
              <el-col :span="10">
              {{$t('global.desc')}}:
                <span class="dark-color">{{versionInfo.desc}}</span>
              </el-col>
              <el-col :span="10">
                {{$t('global.status')}}:
                <span
                  class="dark-color"
                  :style="{color: uploadProgressList(versionInfo.status).color}"
                >{{uploadProgressList(versionInfo.status).desc}}</span>
              </el-col>
            </el-row>
          </div>
          <div class="version-title">
            {{$t('deliveryCenter.deliveryContent')}}
            <el-popover placement="right" trigger="hover">
              <div>
                <div>
                  {{$t('deliveryCenter.deliveryProgressDetails')}}
                  <el-button v-if="versionInfo.status !== 'success'" type="text" class="small-btn" @click="retryCreate">{{$t('global.errorMsg')}}</el-button>
                </div>
                <div style="width: 250px; padding: 0 5px; font-size: 13px;">
                  <p> {{$t('deliveryCenter.uploadChartAndImage')}}:{{versionInfo.progress.successChartCount}}/{{versionInfo.progress.totalChartCount}}</p>
                  <p v-if="versionInfo.progress.error">{{$t('global.errorMsg')}}:{{versionInfo.progress.error}}</p>
                </div>
              </div>
              <el-button slot="reference" type="text" class="small-btn">{{$t('deliveryCenter.deliveryProgressDetails')}}</el-button>
            </el-popover>
          </div>
          <div class="push-info">
            <div class="push-title">{{$t('deliveryCenter.chartInfo')}}</div>
            <el-table :data="distributeChart" style="width: 100%;">
              <el-table-column type="expand" width="50px">
                <template slot-scope="{row}">
                  <el-table :data="row.subDistributes" style="width: 100%;">
                    <el-table-column prop="serviceName" :label="$t('deliveryCenter.componentName')"></el-table-column>
                    <el-table-column :label="$t('deliveryCenter.imageName')">
                      <template slot-scope="{row}">
                        <router-link :to="`/v1/delivery/artifacts?image=${row.registryName}`">{{row.registryName}}</router-link>
                      </template>
                    </el-table-column>
                  </el-table>
                </template>
              </el-table-column>
              <el-table-column prop="chartName" :label="$t('deliveryCenter.chartName')"></el-table-column>
              <el-table-column prop="chartRepoName" :label="$t('deliveryCenter.chartRepo')"></el-table-column>
              <el-table-column prop="chartVersion" :label="$t('deliveryCenter.chartVersion')"></el-table-column>
              <el-table-column :label="$t(`global.operation`)">
                <template slot-scope="{row}">
                  <a :download="`${row.chartName}-${row.chartVersion}`" :href="downloadChartUrl(row)">
                    <el-button type="text">{{$t('global.download')}}</el-button>
                  </a>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="packageFile">
              <div class="push-title">{{$t('deliveryCenter.offlinePkgInfo')}}</div>
              <el-table :data="packageFile" style="width: 100%;">
                <el-table-column prop="packageFile" :label="$t('deliveryCenter.offlinePkgName')"></el-table-column>
                <el-table-column :label="$t('deliveryCenter.objectStorage')">
                  <template slot-scope="{row}">{{row.storageUrl}}/{{row.storageBucket}}</template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import store from 'storejs'
import { getVersionDetailAPI, createHelmVersionAPI } from '@api'
export default {
  data () {
    return {
      loading: false,
      versionInfo: {
        progress: {}
      },
      distributeChart: [],
      packageFile: null
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    versionId () {
      return this.$route.params.id
    },
    uploadProgress () {
      return this.uploadProgressList(this.versionInfo.progress.packageStatus)
    }
  },
  methods: {
    uploadProgressList (status) {
      const statusEnum = {
        success: {
          desc: this.$t('deliveryCenter.uploadStatus.success'),
          color: '#67c23a'
        },
        failed: {
          desc: this.$t('deliveryCenter.uploadStatus.failed'),
          color: '#f56c6c'
        },
        waiting: {
          desc: this.$t('deliveryCenter.uploadStatus.waiting'),
          color: '#0066ff'
        },
        uploading: {
          desc: this.$t('deliveryCenter.uploadStatus.uploading'),
          color: '#e6a23c'
        },
        creating: {
          desc: this.$t('deliveryCenter.uploadStatus.creating'),
          color: '#e6a23c'
        },
        retrying: {
          desc: this.$t('deliveryCenter.uploadStatus.retrying'),
          color: '#0066ff'
        },
        undefine: {
          desc: this.$t('deliveryCenter.uploadStatus.undefine'),
          color: '#909399'
        }
      }
      return statusEnum[status] || statusEnum.undefine
    },
    retryCreate () {
      const payload = {
        productName: this.projectName,
        version: this.versionInfo.version,
        retry: true
      }
      this.loading = true
      createHelmVersionAPI(this.projectName, payload).then(() => {
        this.$message.success(this.$t('deliveryCenter.retrySuccess'))
        this.getVersionDetail()
      })
    },
    getVersionDetail () {
      this.loading = true
      const versionId = this.versionId
      const projectName = this.projectName
      getVersionDetailAPI(projectName, versionId).then(res => {
        this.loading = false
        this.versionInfo = res.versionInfo

        const distributeChart = []
        res.distributeInfo.forEach(info => {
          if (info.distributeType === 'chart') {
            distributeChart.push(info)
          } else if (info.distributeType === 'file') {
            this.packageFile = [info]
          }
        })
        this.distributeChart = distributeChart
      })
    },
    downloadChartUrl (data) {
      const projectName = this.projectName
      const chartName = data.chartName
      const version = this.versionInfo.version
      const token = store.get('userInfo').token
      return `/api/aslan/delivery/releases/helm/charts?projectName=${projectName}&chartName=${chartName}&version=${version}&token=${token}`
    }
  },
  created () {
    this.getVersionDetail()
  }
}
</script>

<style lang="less" scoped>
.helm-version-detail {
  padding: 24px 24px;

  /deep/.el-tabs {
    .el-tabs__nav.is-top {
      width: 100%;

      .el-tabs__item.is-disabled {
        float: right;

        .version-push {
          color: @themeColor;
          cursor: pointer;
        }
      }
    }
  }

  .version-title {
    padding-bottom: 5px;
    color: #999;
    font-size: 16px;
    line-height: 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .basic-info {
    padding: 12px 20px;
    color: #8d9199;
    font-size: 13px;

    /deep/.el-row {
      margin-bottom: 15px;
    }
  }

  .push-title {
    width: 200px;
    margin: 20px 0 15px;
    color: #666;
    font-size: 14px;
    line-height: 2;
    border-bottom: 1px solid #eee;
  }

  .push-info {
    padding: 0 20px 12px;
  }

  /deep/.el-table {
    .el-table__cell {
      padding: 6px 0;

      &.el-table__expanded-cell {
        padding: 10px 50px;
      }
    }
  }

  .dark-color {
    color: #303133;
  }
}

.small-btn {
  margin-left: 5px;
  font-size: 12px;
}
</style>
