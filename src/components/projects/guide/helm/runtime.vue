<template>
  <div class="projects-runtime-container">
    <div class="guide-container">
      <Step :activeStep="2" :thirdStepTitle="$t('project.onboardingComp.configureEnv')" />
      <div class="current-step-container">
        <div class="title-container">
          <span class="first">{{$t('project.onboardingComp.thirdStep')}}</span>
          <span class="second">{{$t('project.onboardingComp.thirdStepTip')}}</span>
        </div>
        <div class="account-integrations block-list">
          <div class="second">{{$t('project.onboardingComp.configureTheFollowingEnvironments')}}</div>
          <el-tabs v-model="activeName" type="card" @edit="handleTabsEdit">
            <el-tab-pane
              v-for="env in envInfos"
              :key="env.envName"
              :label="env.envName"
              :name="env.initName"
              :closable="!env.isEdit && canHandle"
            >
              <span slot="label">
                <span v-if="env.isEdit && canHandle" class="tab-label">
                  <el-input
                    v-model="env.envName"
                    :placeholder="env.initName"
                    v-focus
                    @keyup.enter.native="validateEnvName(env.envName, env)"
                  ></el-input>
                  <i class="el-icon-finished" @click="validateEnvName(env.envName, env)" v-if="canHandle"></i>
                </span>
                <span v-else class="tab-label">
                  <span @dblclick="env.isEdit = true">{{env.envName}}</span>
                  <i class="el-icon-edit" @click="env.isEdit = true" v-if="canHandle"></i>
                </span>
              </span>
            </el-tab-pane>
            <el-tab-pane name="addNew" v-if="canHandle">
              <span slot="label" @click="handleTabsEdit('', 'add')">{{$t('environments.common.envCreation')}}</span>
            </el-tab-pane>
          </el-tabs>
          <div v-loading="loading">
            <el-form
              label-width="120px"
              ref="createEnvRef"
              :model="currentInfo"
              :rules="rules"
              label-position="left"
              inline-message
              class="common-parcel-block primary-form"
            >
              <el-form-item :label="$t('environments.common.k8sCluster')" prop="cluster_id">
                <el-select filterable v-model="currentInfo.cluster_id" size="small" placeholder="请选择 K8s 集群" @change="changeCluster">
                  <el-option v-for="cluster in allCluster" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item :label="$t('environments.common.k8sNamespace')" prop="namespace">
                <el-select
                  v-model="currentInfo.namespace"
                  :disabled="editButtonDisabled"
                  size="small"
                  :placeholder="$t('environments.common.selectK8sNamespace')"
                  filterable
                  allow-create
                  clearable
                >
                  <el-option :value="`${projectName}-env-${currentInfo.env_name}`">{{ projectName }}-env-{{ currentInfo.env_name }}</el-option>
                  <el-option v-for="(ns,index) in (hostingNamespace[currentInfo.cluster_id] || [])" :key="index" :label="ns" :value="ns"></el-option>
                </el-select>
                <span class="editButton" @click="editButtonDisabled = !editButtonDisabled">
                  <i :class="[editButtonDisabled ? 'el-icon-edit-outline': 'el-icon-finished' ]"></i>
                </span>
                <span class="ns-desc" v-show="nsIsExisted">{{$t('environments.common.namespaceAlreadyExistsTip')}}</span>
              </el-form-item>
              <el-form-item :label="$t(`status.imageRepo`)">
                <el-select filterable v-model.trim="currentInfo.registry_id" :placeholder="$t('environments.common.selectImageRepository')" size="small">
                  <el-option
                    v-for="registry in imageRegistry"
                    :key="registry.id"
                    :label="registry.namespace ? `${registry.reg_addr}/${registry.namespace}` : registry.reg_addr"
                    :value="registry.id"
                  ></el-option>
                </el-select>
              </el-form-item>
              <el-form-item :label="$t(`workflow.selectService`)" prop="selectedService">
                <div class="select-service">
                  <el-select
                    v-model="currentInfo.selectedService"
                    size="small"
                    placeholder="选择服务"
                    value-key="serviceName"
                    filterable
                    clearable
                    multiple
                    collapse-tags
                  >
                    <el-option
                      disabled
                      label="全选"
                      value="ALL"
                      :class="{selected: currentInfo.selectedService.length === projectChartNames.length}"
                      style="color: #606266;"
                    >
                      <span
                        style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
                        @click="currentInfo.selectedService = projectChartNames"
                      >全选</span>
                    </el-option>
                    <el-option
                      v-for="(chartName, index) in projectChartNames"
                      :key="index"
                      :label="chartName.serviceName"
                      :value="chartName"
                    ></el-option>
                  </el-select>
                  <el-button size="mini" plain @click="currentInfo.selectedService = []">清空</el-button>
                </div>
              </el-form-item>
            </el-form>
            <EnvConfig class="common-parcel-block" ref="envConfigRef" :envName="activeName" />
            <HelmEnvTemplate
              class="chart-value"
              ref="helmEnvTemplateRef"
              :chartNames="currentInfo.selectedService"
              :envNames="envNames"
              :handledEnv="activeName"
              :envScene="`createEnv`"
              :checkResource="checkResource"
            />
            <div class="ai-bottom">
              <el-button type="primary" size="small" @click="createHelmProductEnv" :loading="isCreating" :disabled="!cantNext">{{$t('environments.common.envCreation')}}</el-button>
              <div v-for="(env, index) in createRes" :key="index" class="ai-status">
                <span class="env-name">{{env.name}}:</span>
                <span>{{getStatusDesc(env)}}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="controls__wrap">
      <div class="controls__right">
        <router-link :to="`/v1/projects/create/${projectName}/helm/delivery`">
          <el-button type="primary" size="small" :disabled="cantNext">{{$t('project.onboardingComp.nextStep')}}</el-button>
        </router-link>
      </div>
    </div>
  </div>
</template>
<script>
import HelmEnvTemplate from '@/components/projects/env/env_detail/components/updateHelmEnvTemp.vue'
import EnvConfig from '@/components/projects/env/env_detail/common/envConfig.vue'
import bus from '@utils/eventBus'
import Step from '../common/step.vue'
import { cloneDeep } from 'lodash'
import {
  createHelmEnvAPI,
  getEnvironmentsAPI,
  getClusterListAPI,
  getRegistryWhenBuildAPI,
  productHostingNamespaceAPI,
  initProjectEnvAPI
} from '@api'

const envConfig = {
  product_name: '',
  cluster_id: '',
  env_name: '',
  source: 'system',
  baseEnvName: '',
  namespace: '',
  isPublic: true,
  registry_id: '',
  is_existed: false,
  selectedService: [] // will delete
}

export default {
  data () {
    this.envConfigInit = cloneDeep(envConfig)
    return {
      loading: true,
      envInfos: [
        {
          envName: 'dev',
          isEdit: false,
          initName: 'dev',
          infos: null
        },
        {
          envName: 'qa',
          isEdit: false,
          initName: 'qa',
          infos: null
        }
      ],
      cantNext: true,
      activeName: 'dev',
      isCreating: false,
      createRes: [],
      sId: null,
      allCluster: [],
      imageRegistry: [],
      editButtonDisabled: true,
      hostingNamespace: {},
      projectChartNames: []
    }
  },
  methods: {
    validateEnvName (name, env) {
      let message = ''
      if (typeof name === 'undefined' || name === '') {
        message = this.$t('environments.common.inputEnvName')
      } else if (!/^[a-z0-9-]+$/.test(name)) {
        message = this.$t('environments.common.checkEnvName')
      }
      if (message) {
        this.$message.error(message)
        return false
      }
      if (env) {
        env.isEdit = false
        if (!this.nsIsExisted) {
          this.currentInfo.namespace = this.projectName + '-env-' + name
        }
        this.currentInfo.env_name = name
      }
      return true
    },
    async getProducts () {
      const res = await getEnvironmentsAPI(this.projectName).catch(err => {
        console.log(err)
      })
      if (res && res.length > 0) {
        this.envInfos = res.map(re => {
          return {
            envName: re.name,
            isEdit: false,
            initName: re.name,
            infos: {
              ...cloneDeep(envConfig),
              cluster_id: re.cluster_id || '',
              registry_id: re.registry_id || ''
            }
          }
        })
        this.activeName = this.envInfos[0].initName

        this.isCreating = true
        this.sId = setTimeout(this.checkEnvStatus, 0)
      }
    },
    getStatusDesc (envInfo) {
      let res = ''
      switch (envInfo.status) {
        case 'creating':
          res = this.$t('environments.common.envIsCreating')
          break
        case 'success':
          res = this.$t('environments.common.environmentHasBeenSuccessfullyCreated')
          break
        case 'failed':
          res = this.$t('environments.common.environmentCreationFailedWithError', { error: envInfo.error })
          break
        case 'Unstable':
          res = this.$t('environments.common.environmentCreationUnstable')
          break
        default:
          res = envInfo.status
      }
      return res
    },
    async createHelmProductEnv () {
      const { envInfo, chartInfo } = this.$refs.helmEnvTemplateRef.getAllInfo()
      const envConfigs = this.$refs.envConfigRef.getEnvConfig()
      const payloadObj = {}
      const projectName = this.projectName

      const filteredSvc = {}
      this.envInfos.forEach(info => {
        const infos = info.infos
        filteredSvc[info.initName] = infos.selectedService.map(
          service => service.serviceName
        )
        payloadObj[info.initName] = {
          env_name: infos.env_name,
          cluster_id: infos.cluster_id,
          registry_id: infos.registry_id,
          chartValues: [],
          defaultValues: envInfo[info.initName].envValue || '',
          namespace: infos.namespace,
          valuesData: envInfo[info.initName].valuesData,
          is_existed: infos.is_existed,
          env_configs: envConfigs[info.initName] || []
        }
      })
      chartInfo.forEach(chart => {
        if (filteredSvc[chart.envName].includes(chart.serviceName)) {
          payloadObj[chart.envName].chartValues.push(chart)
          chart.envName = payloadObj[chart.envName].env_name
        }
      })

      const payload = Object.values(payloadObj)

      this.isCreating = true
      const res = await createHelmEnvAPI(projectName, payload).catch(err => {
        console.log(err)
        this.isCreating = false
      })
      if (res) {
        this.sId = setTimeout(this.checkEnvStatus, 0)
      }
    },
    async checkEnvStatus () {
      const res = await getEnvironmentsAPI(this.projectName).catch(err => {
        console.log(err)
        if (this.sId) this.sId = setTimeout(this.checkEnvStatus, 2000)
      })
      if (res) {
        this.createRes = res
        const notValid = res.filter(r => r.status === 'creating')
        if (notValid.length && this.sId) {
          this.sId = setTimeout(this.checkEnvStatus, 2000)
        } else {
          clearTimeout(this.sId)
          this.sId = null
          this.isCreating = false
          this.cantNext = false
        }
      }
    },
    handleTabsEdit (targetName, action) {
      this.envLength = this.envLength + 1 || this.envInfos.length
      if (action === 'add') {
        const newTabName = `env-${this.envLength}`
        this.envInfos.push({
          envName: newTabName,
          isEdit: true,
          initName: newTabName,
          infos: null
        })
        setTimeout(() => {
          this.activeName = newTabName
        })
      }
      if (action === 'remove') {
        this.envInfos = this.envInfos.filter(env => env.initName !== targetName)
        if (this.activeName === targetName) {
          this.activeName = this.envInfos[0] ? this.envInfos[0].envName : ''
        }
      }
    },
    async getClusterAndRegistry () {
      this.loading = true
      await Promise.all([
        getClusterListAPI(this.projectName).then(res => {
          this.allCluster = res.filter(element => {
            if (element.local) {
              this.envConfigInit.cluster_id = element.id
              this.changeCluster(element.id)
            }
            return element.status === 'normal'
          })
        }),
        getRegistryWhenBuildAPI(this.projectName).then(res => {
          this.imageRegistry = res
          const defaultRegistry = res.find(reg => reg.is_default)
          this.envConfigInit.registry_id = defaultRegistry
            ? defaultRegistry.id
            : ''
        }),
        this.getTemplateAndImg()
      ])
      this.envInfos.forEach(info => {
        info.infos = {
          ...cloneDeep(this.envConfigInit),
          env_name: info.envName,
          namespace: this.projectName + '-env-' + info.envName
        }
      })
      this.loading = false
    },
    async getTemplateAndImg () {
      const template = await initProjectEnvAPI(this.projectName)
      this.projectChartNames = template.chart_infos
        ? template.chart_infos.map(chart => {
          return {
            serviceName: chart.service_name,
            chartVersion: chart.chart_version,
            type: 'common'
          }
        })
        : []
      this.envConfigInit.selectedService = this.projectChartNames
      this.envConfigInit.source = 'system'
    },
    changeCluster (clusterId) {
      if (this.hostingNamespace[clusterId]) {
        return
      }
      productHostingNamespaceAPI(clusterId, 'create').then(res => {
        this.$set(
          this.hostingNamespace,
          clusterId,
          res.map(ns => ns.name)
        )
      })
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    envNames () {
      return this.envInfos.map(info => info.initName)
    },
    canHandle () {
      return !this.isCreating && this.cantNext
    },
    currentInfo () {
      const cur = this.envInfos.find(info => info.initName === this.activeName)
      if (!cur) {
        return cloneDeep(this.envConfigInit)
      }
      if (!cur.infos) {
        cur.infos = cloneDeep(this.envConfigInit)
      }
      return cur.infos
    },
    nsIsExisted () {
      if (!this.hostingNamespace[this.currentInfo.cluster_id]) {
        this.$set(this.hostingNamespace, this.currentInfo.cluster_id, [])
      }
      const nsIsExisted = this.hostingNamespace[
        this.currentInfo.cluster_id
      ].includes(this.currentInfo.namespace)
      this.currentInfo.is_existed = nsIsExisted
      return nsIsExisted
    },
    checkResource () {
      if (this.activeName === 'addNew') {
        return null
      }
      const activeName = this.activeName
      const infos = this.envInfos.find(info => info.initName === activeName)
        .infos
      return {
        env_name: infos.env_name,
        cluster_id: infos.cluster_id,
        namespace: infos.namespace
      }
    },
    rules () {
      return {
        cluster_id: [
          { required: true, trigger: 'change', message: this.$t('environments.common.selectK8sCluster') }
        ],
        namespace: [
          { required: true, trigger: 'change', message: this.$t('environments.common.selectK8sNamespace') }
        ],
        selectedService: {
          type: 'array',
          required: true,
          message: this.$t('environments.common.selectServices'),
          trigger: 'change'
        }
      }
    }
  },
  created () {
    bus.$emit(`show-sidebar`, true)
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' },
        { title: this.projectName, isProjectName: true, url: '' }
      ]
    })

    this.getProducts()
    this.getClusterAndRegistry()
  },
  beforeDestroy () {
    this.sId = null
  },
  components: {
    Step,
    HelmEnvTemplate,
    EnvConfig
  },
  directives: {
    focus: {
      inserted: function (el) {
        el.querySelector('input').focus()
      }
    }
  },
  onboardingStatus: 3
}
</script>

<style lang="less" scoped>
.projects-runtime-container {
  position: relative;
  flex: 1;
  height: 100%;
  overflow: auto;
  background-color: @globalBackgroundColor;

  .guide-container {
    min-height: calc(~'100% - 70px');
    margin-top: 10px;

    .current-step-container {
      .title-container {
        margin-left: 20px;

        .first {
          display: inline-block;
          width: 130px;
          padding: 8px;
          color: #fff;
          font-weight: 300;
          font-size: 16px;
          text-align: center;
          background: @themeColor;
        }

        .second {
          color: #4c4c4c;
          font-size: 13px;
        }
      }

      .account-integrations {
        .second {
          margin-bottom: 8px;
          color: #4c4c4c;
          font-size: 13px;
        }

        .el-tabs__new-tab {
          color: #06f;
          border-color: #06f;
        }

        .tab-label {
          display: inline-flex;
          align-items: center;

          .el-input {
            width: auto;

            .el-input__inner {
              border-color: #fff;
            }
          }

          .el-icon-edit,
          .el-icon-finished {
            width: 0;
            overflow: hidden;
            transform-origin: 100% 50%;
          }
        }

        .el-tabs--card > .el-tabs__header .el-tabs__item.is-active {
          border-bottom-color: @globalBackgroundColor;
        }

        .el-tabs--card > .el-tabs__header .el-tabs__item.is-active,
        .el-tabs--card > .el-tabs__header .el-tabs__item:hover {
          .el-icon-close {
            font-size: 16px;
          }

          .el-icon-edit,
          .el-icon-finished {
            width: 14px;
            margin-left: 10px;
          }
        }

        .editButton {
          display: inline-block;
          margin-left: 6px;
          padding: 0 6px;
          font-size: 14px;
          line-height: 24px;
          border: 1px solid rgba(118, 122, 200, 0.5);
          border-radius: 4px;
          cursor: pointer;
        }

        .ns-desc {
          display: inline-block;
          margin-left: 8px;
          color: #e6a23c;
          font-size: 13px;
        }

        .select-service {
          position: relative;
          display: inline-block;
          width: 410px;

          /deep/.el-button {
            position: absolute;
            right: 12px;
            bottom: 6px;
          }
        }

        .ai-bottom {
          margin-top: 10px;

          .ai-status {
            margin: 8px 0;
            font-size: 13px;

            .env-name {
              display: inline-block;
              margin-right: 8px;
              color: #e6a23c;
            }
          }
        }
      }

      .block-list {
        flex: 1;
        margin-top: 15px;
        padding: 0 30px;
        overflow-y: auto;
        background-color: inherit;
      }
    }
  }

  .controls__wrap {
    position: relative;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    height: 60px;
    padding: 0 10px;
    background-color: #fff;
  }
}
</style>
