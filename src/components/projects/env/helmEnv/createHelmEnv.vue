<template>
  <div class="create-product-detail-container" v-loading="loading" :element-loading-text="$t('global.loading')" element-loading-spinner="el-icon-loading">
    <div v-if="showEmptyServiceModal" class="no-resources">
      <div>
        <img src="@assets/icons/illustration/environment.svg" alt />
      </div>
      <div class="description">
        <p>
          <span>{{$t('environments.common.environmentWithoutService')}}</span>
          <router-link :to="`/v1/projects/detail/${projectName}/services`">
            <el-button type="primary" size="mini" round plain>{{$t('project.services')}}</el-button>
          </router-link>
          <span>{{$t('environments.common.toCreateService')}}</span>
        </p>
      </div>
    </div>
    <div v-else>
      <el-form
        class="common-parcel-block primary-form"
        label-width="120px"
        label-position="left"
        ref="create-env-ref"
        :model="projectConfig"
        :rules="rules"
        inline-message
      >
        <el-form-item :label="$t('environments.common.envName')" prop="env_name">
          <el-input @input="changeEnvName" v-model="projectConfig.env_name" size="small"></el-input>
        </el-form-item>
        <el-form-item v-if="!createShare" :label="$t('environments.common.creationMethod')" prop="source">
          <el-select class="select" @change="changeCreateMethod" v-model="projectConfig.source" size="small" :placeholder="$t('environments.common.selectCreationMethod')">
            <el-option :label="$t('environments.common.createNewEnv')" value="system"></el-option>
            <el-option :label="$t('environments.common.copyEnv')" value="copy"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="projectConfig.source === 'copy'" :label="$t('environments.common.copyFrom')" prop="baseEnvName">
          <el-select class="select" @change="changeBaseEnv" v-model="projectConfig.baseEnvName" size="small" :placeholder="$t('environments.common.selectSourceEnv')">
            <el-option v-for="name in projectEnvNames" :key="name" :label="name" :value="name"></el-option>
          </el-select>
        </el-form-item>
        <div class="primary-title">{{$t('environments.common.selectResources')}}</div>
        <el-form-item :label="$t('environments.common.k8sCluster')" prop="cluster_id" class="secondary-label">
          <el-select
            class="select"
            filterable
            :disabled="createShare"
            v-model="projectConfig.cluster_id"
            @change="changeCluster"
            size="small"
            :placeholder="$t('environments.common.selectK8sCluster')"
          >
            <el-option v-for="cluster in allCluster" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item  :label="$t('environments.common.k8sNamespace')" prop="defaultNamespace" class="secondary-label">
          <el-select
            v-model="projectConfig.defaultNamespace"
            :disabled="editButtonDisabled"
            size="small"
            :placeholder="$t('environments.common.selectK8sNamespace')"
            filterable
            allow-create
            clearable
          >
            <el-option :value="`${projectName}-env-${projectConfig.env_name}`">{{ projectName }}-env-{{ projectConfig.env_name }}</el-option>
            <el-option v-for="(ns,index) in hostingNamespace" :key="index" :label="ns" :value="ns"></el-option>
          </el-select>
          <span class="editButton" @click="editButtonDisabled = !editButtonDisabled">
            <i :class="[editButtonDisabled ? 'el-icon-edit-outline': 'el-icon-finished' ]"></i>
          </span>
          <span class="ns-desc" v-show="nsIsExisted">{{$t('environments.common.namespaceAlreadyExistsTip')}}</span>
        </el-form-item>
        <el-form-item :label="$t(`status.imageRepo`)" class="secondary-label">
          <el-select class="select" filterable v-model.trim="projectConfig.registry_id" :placeholder="$t('environments.common.selectImageRepository')" size="small">
            <el-option
              v-for="registry in imageRegistry"
              :key="registry.id"
              :label="registry.namespace ? `${registry.reg_addr}/${registry.namespace}` : registry.reg_addr"
              :value="registry.id"
            ></el-option>
          </el-select>
          <div class="image-secret">imagePullSecret:default-registry-secret</div>
        </el-form-item>
        <el-form-item :label="$t('environments.common.services')" prop="selectedService">
          <div class="select-service">
            <el-select
              v-model="projectConfig.selectedService"
              size="small"
              :placeholder="$t('environments.common.selectServices')"
              value-key="serviceName"
              filterable
              clearable
              multiple
              collapse-tags
            >
              <el-option
                disabled
                :label="$t('environments.common.checkAllServices')"
                value="ALL"
                :class="{selected: projectConfig.selectedService.length === projectChartNames.length}"
                style="color: #606266;"
              >
                <span
                  style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
                  @click="projectConfig.selectedService = projectChartNames"
                >{{$t('environments.common.checkAllServices')}}</span>
              </el-option>
              <el-option v-for="(chartName, index) in projectChartNames" :key="index" :label="chartName.serviceName" :value="chartName"></el-option>
            </el-select>
            <el-button size="mini" plain @click="projectConfig.selectedService = []">{{$t('environments.common.clearServices')}}</el-button>
          </div>
        </el-form-item>
      </el-form>
      <EnvConfig class="common-parcel-block" ref="envConfigRef" />
      <HelmEnvTemplate
        class="chart-value"
        ref="helmEnvTemplateRef"
        :chartNames="projectConfig.selectedService"
        :envNames="envNames"
        :handledEnv="envName"
        :envScene="`createEnv`"
        :checkResource="checkResource" />
      <el-form label-width="35%" class="ops">
        <el-form-item>
          <el-button @click="$router.back()" :loading="startDeployLoading" size="medium">{{$t(`global.cancel`)}}</el-button>
          <el-button v-hasPermi="{projectName: projectName, action: 'create_environment',isBtn:true}" @click="deployHelmEnv" :loading="startDeployLoading" type="primary" size="medium">{{$t('environments.common.createEnv')}}</el-button>
        </el-form-item>
      </el-form>
      <footer v-if="startDeployLoading" class="create-footer">
        <div class="description">
          <el-tag type="primary">{{$t('environments.common.envIsCreating')}}</el-tag>
        </div>
        <div class="deploy-loading">
          <div class="spinner__item1"></div>
          <div class="spinner__item2"></div>
          <div class="spinner__item3"></div>
          <div class="spinner__item4"></div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script>
import {
  initProjectEnvAPI,
  getClusterListAPI,
  createHelmEnvAPI,
  getEnvironmentsAPI,
  getEnvInfoAPI,
  getRegistryWhenBuildAPI,
  productHostingNamespaceAPI
} from '@api'
import bus from '@utils/eventBus'
import { cloneDeep, flattenDeep } from 'lodash'
import HelmEnvTemplate from '../env_detail/components/updateHelmEnvTemp.vue'
import EnvConfig from '../env_detail/common/envConfig.vue'
export default {
  data () {
    return {
      editButtonDisabled: true,
      projectConfig: {
        product_name: '',
        cluster_id: '',
        env_name: '',
        source: 'system',
        baseEnvName: '',
        namespace: '',
        defaultNamespace: '',
        isPublic: true,
        registry_id: '',
        selectedService: [] // will delete
      },
      allCluster: [],
      startDeployLoading: false,
      loading: false,
      projectEnvNames: [],
      projectChartNames: [],
      // chartNames: null, // envNames and envName || chartNames
      envNames: [],
      envName: '',
      imageRegistry: [],
      hostingNamespace: []
    }
  },

  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    showEmptyServiceModal () {
      return this.projectChartNames.length === 0
    },
    nsIsExisted () {
      return this.hostingNamespace.includes(this.projectConfig.defaultNamespace)
    },
    clusterId () {
      return this.$route.query.clusterId
    },
    baseEnvName () {
      return this.$route.query.baseEnvName ? this.$route.query.baseEnvName : ''
    },
    createShare () {
      return this.$route.query.createShare === 'true'
    },
    createEnvType () {
      return this.createShare ? 'share' : 'general'
    },
    isBaseEnv () {
      return !this.baseEnvName
    },
    checkResource () {
      return {
        env_name: this.projectConfig.env_name,
        cluster_id: this.projectConfig.cluster_id,
        namespace: this.projectConfig.defaultNamespace
      }
    },
    rules () {
      const validateEnvName = (rule, value, callback) => {
        if (typeof value === 'undefined' || value === '') {
          callback(new Error(this.$t('environments.common.inputEnvName')))
        } else {
          if (!/^[a-z0-9-]+$/.test(value)) {
            callback(new Error(this.$t('environments.common.checkEnvName')))
          } else {
            callback()
          }
        }
      }
      return {
        cluster_id: [
          { required: true, trigger: 'change', message: this.$t('environments.common.selectK8sCluster') }
        ],
        source: [
          { required: true, trigger: 'change', message: this.$t('environments.common.selectCreationMethod') }
        ],
        baseEnvName: [
          { required: true, trigger: 'change', message: this.$t('environments.common.selectSourceEnv') }
        ],
        namespace: [
          { required: true, trigger: 'change', message: this.$t('environments.common.selectK8sNamespace') }
        ],
        defaultNamespace: [
          { required: true, trigger: 'change', message: this.$t('environments.common.selectK8sNamespace') }
        ],
        env_name: [
          { required: true, trigger: 'change', validator: validateEnvName }
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
  methods: {
    changeEnvName (value) {
      if (!this.nsIsExisted) {
        this.projectConfig.defaultNamespace = this.projectName + '-env-' + value
      }
    },
    async getCluster () {
      const projectName = this.projectName
      const res = await getClusterListAPI(projectName)
      const cluster_id = this.projectConfig.cluster_id
      this.allCluster = res.filter(element => {
        return element.status === 'normal'
      })
      if (this.createShare && this.clusterId) {
        this.projectConfig.cluster_id = this.clusterId
      } else {
        res.forEach(element => {
          if (element.local && !cluster_id) {
            this.projectConfig.cluster_id = element.id
          }
        })
      }
      if (this.projectConfig.cluster_id) {
        this.changeCluster(this.projectConfig.cluster_id)
      }
    },
    async getTemplateAndImg () {
      const projectName = this.projectName
      const isStcov = this.isStcov
      const createEnvType = this.createEnvType
      const isBaseEnv = this.isBaseEnv
      const baseEnvName = this.baseEnvName
      this.loading = true
      const template = await initProjectEnvAPI(projectName, isStcov, createEnvType, isBaseEnv, baseEnvName)
      this.loading = false
      this.projectChartNames = template.chart_infos
        ? template.chart_infos.map(chart => {
          return {
            serviceName: chart.service_name,
            chartVersion: chart.chart_version,
            type: 'common'
          }
        })
        : []
      this.projectConfig.selectedService = this.projectChartNames
      this.projectConfig.source = 'system'
    },
    changeCluster (clusterId) {
      productHostingNamespaceAPI(clusterId, 'create').then(res => {
        this.hostingNamespace = res.map(ns => ns.name)
      })
    },
    changeCreateMethod () {
      const source = this.projectConfig.source
      if (source === 'system') {
        this.projectConfig.selectedService = this.projectChartNames
        this.envNames = []
        this.envName = ''
        // this.getTemplateAndImg()
      } else if (source === 'copy') {
        if (!this.projectConfig.baseEnvName) {
          this.projectConfig.baseEnvName = this.projectEnvNames[0]
        }
        this.changeBaseEnv(this.projectEnvNames[0])
      }
    },
    async changeBaseEnv (envName) {
      const projectName = this.projectName
      const envInfo = await getEnvInfoAPI(projectName, envName)
      const availableServices = flattenDeep(envInfo.services)
      const projectChartNames = this.projectChartNames.filter(item => {
        return availableServices.indexOf(item.serviceName) >= 0
      })
      this.projectChartNames = projectChartNames
      this.projectConfig.registry_id = envInfo.registry_id
      this.projectConfig.cluster_id = envInfo.cluster_id
      this.projectConfig.selectedService = projectChartNames
      this.envNames = [this.projectConfig.baseEnvName]
      this.envName = this.projectConfig.baseEnvName
    },
    async deployHelmEnv () {
      const res = await this.$refs.helmEnvTemplateRef.validate().catch(err => {
        console.log(err)
      })
      if (!res) {
        return
      }
      this.$refs['create-env-ref'].validate(valid => {
        if (valid) {
          const valueInfo = cloneDeep(
            this.$refs.helmEnvTemplateRef.getAllInfo()
          )

          const isCopy = this.projectConfig.source === 'copy'
          const baseEnvName = this.projectConfig.baseEnvName
          if (isCopy) {
            valueInfo.chartInfo.forEach(info => {
              info.envName = ''
            })
          }
          const selectedServices = this.projectConfig.selectedService.map(
            service => service.serviceName
          )
          valueInfo.chartInfo = valueInfo.chartInfo.filter(chart => selectedServices.includes(chart.serviceName))

          const defaultEnv = isCopy ? baseEnvName : 'DEFAULT'
          const payload = {
            env_name: this.projectConfig.env_name,
            cluster_id: this.projectConfig.cluster_id,
            registry_id: this.projectConfig.registry_id,
            base_env_name: isCopy ? baseEnvName : '',
            chartValues: valueInfo.chartInfo,
            defaultValues: valueInfo.envInfo[defaultEnv].envValue || '',
            valuesData: valueInfo.envInfo[defaultEnv].valuesData,
            namespace: this.projectConfig.defaultNamespace,
            is_existed: this.nsIsExisted,
            env_configs: this.$refs.envConfigRef.getEnvConfig()
          }
          if (this.createShare && this.baseEnvName) {
            payload.share_env = {
              enable: true,
              isBase: false,
              base_env: this.baseEnvName
            }
          }

          this.startDeployLoading = true
          function sleep (time) {
            return new Promise(resolve => setTimeout(resolve, time))
          }
          this.$store.commit('SET_MASK_STATUS', true)
          createHelmEnvAPI(
            this.projectConfig.product_name,
            [payload],
            isCopy ? 'copy' : ''
          ).then(
            res => {
              // Add delay to solve the back-end permission synchronization problem
              sleep(5000).then(() => {
                const envName = payload.env_name
                this.startDeployLoading = false
                this.$message({
                  message: this.$t('environments.common.environmentHasBeenSuccessfullyCreated'),
                  type: 'success'
                })
                this.$router.push(
                  `/v1/projects/detail/${this.projectName}/envs/detail?envName=${envName}`
                )
              })
            },
            () => {
              this.startDeployLoading = false
              this.$store.commit('SET_MASK_STATUS', false)
            }
          )
        }
      })
    },
    getEnvNames () {
      getEnvironmentsAPI(this.projectName).then(res => {
        this.projectEnvNames = res.map(re => re.name)
      })
    }
  },
  created () {
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        {
          title: this.$t('subTopbarMenu.projects'),
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: this.$t('subTopbarMenu.environments'), url: '' },
        { title: this.$t('environments.common.envCreation'), url: '' }
      ]
    })
    this.projectConfig.product_name = this.projectName
    this.getCluster()
    this.getEnvNames()
    getRegistryWhenBuildAPI(this.projectName).then(res => {
      this.imageRegistry = res
      if (!this.projectConfig.registry_id) {
        const registry = res.find(reg => reg.is_default)
        this.projectConfig.registry_id = registry ? registry.id : ''
      }
      this.getTemplateAndImg()
    })
  },
  components: {
    HelmEnvTemplate,
    EnvConfig
  }
}
</script>

<style lang="less" scoped>
.create-product-detail-container {
  position: relative;
  flex: 1;
  box-sizing: border-box;
  height: 100%;
  padding: 16px 24px;
  overflow: auto;

  .ns-desc {
    display: inline-block;
    margin-left: 8px;
    color: #e6a23c;
    font-size: 13px;
  }

  .image-secret {
    margin-left: 3px;
    color: #cdcfd4;
    font-size: 12px;
    line-height: 1.5;
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

  .no-resources {
    padding: 45px;
    border-style: hidden;
    border-radius: 4px;
    border-collapse: collapse;
    box-shadow: 0 0 0 2px #f1f1f1;

    img {
      display: block;
      width: 360px;
      height: 360px;
      margin: 10px auto;
    }

    .description {
      margin: 16px auto;
      text-align: center;

      p {
        color: #8d9199;
        font-size: 15px;
      }
    }
  }

  .create-footer {
    position: fixed;
    bottom: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    min-height: 36px;
    padding: 15px 0 10px;

    .description {
      flex: 0 0 auto;
      line-height: 36px;

      p {
        margin: 0;
        color: #676767;
        font-size: 16px;
        line-height: 36px;
        text-align: left;
      }
    }

    .deploy-loading {
      flex: 0 0 100px;
      margin-left: 20px;
      line-height: 36px;
      text-align: center;

      div {
        display: inline-block;
        width: 8px;
        height: 8px;
        margin-right: 4px;
        background-color: @themeColor;
        border-radius: 100%;
        animation: sk-bouncedelay 1.4s infinite ease-in-out both;
      }

      .spinner__item1 {
        animation-delay: -0.6s;
      }

      .spinner__item2 {
        animation-delay: -0.4s;
      }

      .spinner__item3 {
        animation-delay: -0.2s;
      }

      @keyframes sk-bouncedelay {
        0%,
        80%,
        100% {
          -webkit-transform: scale(0);
          transform: scale(0);
          opacity: 0;
        }

        40% {
          -webkit-transform: scale(1);
          transform: scale(1);
          opacity: 1;
        }
      }
    }
  }

  /deep/.el-tag {
    background-color: rgba(64, 158, 255, 0.2);
  }

  .ops {
    margin-top: 25px;
  }
}
</style>
