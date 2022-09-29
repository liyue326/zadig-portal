<template>
  <div class="mobile-env-detail">
    <van-nav-bar left-arrow fixed @click-left="mobileGoback">
      <template #title>
        <i v-if="envSource==='helm'" class="iconfont iconhelmrepo"></i>
        <i v-else-if="envSource ==='spock'" class="iconfont iconk8s"></i>
        <i v-else-if="envSource ==='pm'" class="iconfont iconwuliji"></i>
        <span>{{`${envName}`}}</span>
        <van-tag v-if="envSource==='external'" plain type="primary">托管</van-tag>
      </template>
    </van-nav-bar>
    <div class="tabs-container">
      <van-divider content-position="left">基本信息</van-divider>
      <div class="env-info">
        <van-row>
          <van-col v-if="envSource !== 'pm'" span="12">
            <div class="mobile-block">
              <h2 class="mobile-block-title">k8s 集群</h2>
              <div v-if="envInfo.is_local" class="mobile-block-desc">本地集群</div>
              <div v-else class="mobile-block-desc">{{envInfo.is_prod?envInfo.cluster_name+' (生产集群)':envInfo.cluster_name +' (测试集群)'}}</div>
            </div>
          </van-col>
          <van-col span="12">
            <div class="mobile-block">
              <h2 class="mobile-block-title">更新时间</h2>
              <div class="mobile-block-desc">{{$utils.convertTimestamp(envInfo.update_time)}}</div>
            </div>
          </van-col>
        </van-row>
        <van-row>
          <van-col v-if="envSource !== 'pm'" span="12">
            <div class="mobile-block">
              <h2 class="mobile-block-title">K8s 命名空间</h2>
              <div class="mobile-block-desc">{{ envInfo.namespace}}</div>
            </div>
          </van-col>
          <van-col span="12">
            <div class="mobile-block">
              <h2 class="mobile-block-title">环境状态</h2>
              <div class="mobile-block-desc">{{getProdStatus(envInfo.status,envStatus.updatable)}}</div>
            </div>
          </van-col>
        </van-row>
        <van-row v-if="envSource !== 'pm'">
          <van-col span="24">
            <div class="mobile-block">
              <h2 class="mobile-block-title">镜像仓库</h2>
              <div class="mobile-block-desc">{{imageRegistry}}</div>
            </div>
          </van-col>
        </van-row>
      </div>
      <van-divider content-position="left">服务列表</van-divider>
      <div class="service-list">
        <van-cell
          v-for="(item,index) in k8sServices"
          :to="`/mobile/projects/detail/${projectName}/envs/${envName}/k8s/${item.service_name}?envName=${envName}&projectName=${projectName}&namespace=${envInfo.namespace}&originProjectName=${item.product_name}&isProd=${isProd}&clusterId=${clusterId}&envSource=${envSource}&workLoadType=${item.workLoadType}`"
          :key="index"
        >
          <template #title>
            <span class="create-info">{{ item.service_name}}</span>
          </template>
          <template #label>
            <span class="imgs">
              <template v-if="item.type==='k8s'">
                <el-tooltip v-for="(image,index) in item.images" :key="index" effect="dark" :content="image" placement="top">
                  <span style="display: block;">{{imageNameSplit(image) }}</span>
                </el-tooltip>
              </template>
            </span>
          </template>

          <template #default>
            <van-tag plain :type="statusIndicator[item.status]">{{ item.status }}</van-tag>
          </template>
        </van-cell>
      </div>
      <div class="service-list">
        <van-cell
          v-for="(item,index) in externalServices"
          :to="`/mobile/projects/detail/${projectName}/envs/${envName}/k8s/${item.service_name}?envName=${envName}&projectName=${projectName}&namespace=${envInfo.namespace}&originProjectName=${item.product_name}&isProd=${isProd}&clusterId=${clusterId}&envSource=${envSource}&workLoadType=${item.workLoadType}`"
          :key="index"
        >
          <template #title>
            <span class="create-info">{{ item.service_name}}</span>
          </template>
          <template #label>
            <span class="imgs">
              <template v-if="item.type==='k8s'">
                <el-tooltip v-for="(image,index) in item.images" :key="index" effect="dark" :content="image" placement="top">
                  <span style="display: block;">{{imageNameSplit(image) }}</span>
                </el-tooltip>
              </template>
            </span>
          </template>

          <template #default>
            <van-tag plain :type="statusIndicator[item.status]">{{ item.status }}</van-tag>
          </template>
        </van-cell>
      </div>
      <div class="service-list">
        <van-cell
          v-for="(item,index) in helmServices"
          :to="`/mobile/projects/detail/${projectName}/envs/${envName}/helm/${item.service_name}?envName=${envName}&projectName=${projectName}&namespace=${envInfo.namespace}&originProjectName=${item.product_name}&isProd=${isProd}&clusterId=${clusterId}&envSource=${envSource}&workLoadType=${item.workLoadType}`"
          :key="index"
        >
          <template #title>
            <span class="create-info">{{ item.service_name}}</span>
          </template>
          <template #label>
            <span class="imgs">
              <template v-if="item.type==='k8s'">
                <el-tooltip v-for="(image,index) in item.images" :key="index" effect="dark" :content="image" placement="top">
                  <span style="display: block;">{{imageNameSplit(image) }}</span>
                </el-tooltip>
              </template>
            </span>
          </template>

          <template #default>
            <van-tag plain :type="statusIndicator[item.status]">{{ item.status }}</van-tag>
          </template>
        </van-cell>
      </div>
      <div class="service-list">
        <van-cell
          v-for="(item,index) in pmServices"
          :to="`/mobile/projects/detail/${projectName}/envs/${envName}/pm/${item.service_name}?envName=${envName}&projectName=${projectName}&namespace=${envInfo.namespace}&originProjectName=${item.product_name}&isProd=${isProd}`"
          :key="index"
        >
          <template #title>
            <span class="create-info">{{ item.service_name}}</span>
          </template>
          <template #label>
            <span class="imgs">
              <template v-if="item.type==='pm'">
                <div v-for="(item,index) in item.serviceHostStatusArr" :key="index">
                  <span class="pm-service-status" :class="item['color']">{{item.host}}</span>
                </div>
              </template>
            </span>
          </template>

          <template #default>
            <span>{{calcPmServiceStatus(item.env_statuses)}}</span>
            <el-tooltip effect="dark" placement="top">
              <div slot="content">实际正常运行的服务数量/预期正常运行服务数量</div>
              <i @click.stop.prevent class="el-icon-question"></i>
            </el-tooltip>
          </template>
        </van-cell>
      </div>
    </div>
  </div>
</template>
<script>
import {
  Col,
  Row,
  NavBar,
  Tag,
  Loading,
  Notify,
  Cell,
  CellGroup,
  Icon,
  Divider
} from 'vant'
import { translateEnvStatus } from '@utils/wordTranslate'
import {
  getEnvInfoAPI,
  productServicesAPI,
  getRegistryWhenBuildAPI,
  envRevisionsAPI
} from '@api'
export default {
  components: {
    [NavBar.name]: NavBar,
    [Tag.name]: Tag,
    [Loading.name]: Loading,
    [Notify.name]: Notify,
    [Cell.name]: Cell,
    [CellGroup.name]: CellGroup,
    [Icon.name]: Icon,
    [Col.name]: Col,
    [Row.name]: Row,
    [Divider.name]: Divider
  },
  data () {
    return {
      envInfo: {},
      envNameList: [],
      k8sServices: [],
      externalServices: [],
      helmServices: [],
      pmServices: [],
      imageRegistries: [],
      envStatus: {
        updateble: false
      },
      statusIndicator: {
        Running: 'success',
        Succeeded: 'success',
        Error: 'danger',
        Unstable: 'warning',
        Unstart: 'info'
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    isProd () {
      return this.envInfo.is_prod
    },
    envSource () {
      return this.envInfo.source || ''
    },
    envName () {
      return this.$route.params.env_name
    },
    clusterId () {
      return this.envInfo.cluster_id ? this.envInfo.cluster_id : ''
    },
    imageRegistry () {
      let findImage = ''
      let defaultImage = ''
      const registryId = this.envInfo.registry_id
      this.imageRegistries.forEach(image => {
        if (image.id === registryId) {
          findImage = image.namespace
            ? `${image.reg_addr}/${image.namespace}`
            : image.reg_addr
        } else if (image.is_default) {
          defaultImage = image.namespace
            ? `${image.reg_addr}/${image.namespace}`
            : image.reg_addr
        }
      })
      return findImage || defaultImage
    }
  },
  methods: {
    backToProject () {
      this.$router.push(`/mobile/projects/detail/${this.projectName}`)
    },
    imageNameSplit (name) {
      if (name.includes(':')) {
        return name.split('/')[name.split('/').length - 1]
      } else {
        return name
      }
    },
    async getEnvInfo () {
      const projectName = this.projectName
      const envName = this.envName
      const envInfo = await getEnvInfoAPI(projectName, envName)
      if (envInfo) {
        if (!envInfo.registry_id) {
          envInfo.registry_id = ''
        }
        this.envInfo = envInfo
      }
    },
    async getEnvServices () {
      const projectName = this.projectName
      const envName = this.envName
      const envSource = this.envSource
      const perPage = 999
      const page = 1
      const query = envSource === 'helm' ? `serviceName=*,name=` : ''
      const res = await productServicesAPI(
        projectName,
        envName,
        envSource,
        query,
        perPage,
        page
      )
      if (res) {
        if (envSource === 'helm') {
          this.helmServices = res.data.services
        } else if (envSource === 'external') {
          this.externalServices = res.data.services
        } else if (envSource === 'spock' || envSource === '') {
          this.k8sServices = res.data
        } else if (envSource === 'pm') {
          this.pmServices = res.data
          if (this.pmServices.length > 0) {
            this.pmServices.forEach(serviceItem => {
              if (serviceItem.env_statuses) {
                serviceItem.serviceHostStatus = {}
                serviceItem.env_statuses.forEach(hostItem => {
                  const host = hostItem.address.split(':')[0]
                  serviceItem.serviceHostStatus[host] = {
                    status: [],
                    color: ''
                  }
                  serviceItem.serviceHostStatus[host].status.push(
                    hostItem.status
                  )
                  serviceItem.serviceHostStatus[host].color = checkStatus(
                    serviceItem.serviceHostStatus[host].status
                  )
                })
                serviceItem.serviceHostStatusArr = this.$utils.mapToArray(
                  serviceItem.serviceHostStatus,
                  'host'
                )
              }
            })
            function checkStatus (arr) {
              let successCount = 0
              let errorCount = 0
              for (let index = 0; index < arr.length; index++) {
                const element = arr[index]
                if (element === 'Running') {
                  successCount = successCount + 1
                }
                if (element === 'Error') {
                  errorCount = errorCount + 1
                }
              }
              if (successCount === arr.length) {
                return 'green'
              } else if (errorCount === arr.length) {
                return 'red'
              } else {
                return 'yellow'
              }
            }
          }
        }
      }
    },
    async getRegistries () {
      const projectName = this.projectName
      this.imageRegistries = await getRegistryWhenBuildAPI(projectName)
    },
    async fetchAllData () {
      await this.getRegistries()
      await this.getEnvInfo()
      await this.getEnvServices()
      this.getEnvRevision()
    },
    getEnvRevision () {
      const projectName = this.projectName
      const envName = this.envName
      envRevisionsAPI(projectName, envName)
        .then(revisions => {
          const envStatus = revisions.find(element => {
            return (
              element.product_name === projectName &&
              element.env_name === this.envName
            )
          })
          this.envStatus = envStatus
        })
        .catch(err => {
          if (err === 'CANCEL') {
            console.log(err)
          }
        })
    },
    calcPmServiceStatus (envStatus) {
      if (envStatus) {
        const runningCount = envStatus.filter(
          s => s.status === 'Running' || s.status === 'Succeeded'
        ).length
        return `${runningCount}/${envStatus.length}`
      } else {
        return 'N/A'
      }
    },
    getProdStatus (status, updatable) {
      // k8s and helm don't show updatable status
      const hiddenUpdatable =
        this.envSource === '' ||
        this.envSource === 'spock' ||
        this.envSource === 'helm'
      return translateEnvStatus(status, hiddenUpdatable ? false : updatable)
    }
  },
  created () {
    this.fetchAllData()
  }
}
</script>
<style lang="less">
.mobile-env-detail {
  padding-top: 46px;
  padding-bottom: 50px;

  .pm-service-status {
    &.Running,
    &.green {
      color: @success;
    }

    &.Error,
    &.red {
      color: #ff1949;
    }

    &.yellow {
      color: #e6a23c;
    }
  }
}
</style>
