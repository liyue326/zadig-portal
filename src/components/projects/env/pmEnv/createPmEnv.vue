<template>
  <div class="create-pm-env-container" v-loading="loading" :element-loading-text="$t('global.loading')" element-loading-spinner="el-icon-loading">
    <div v-if="$utils.isEmpty(this.pmServiceMap) && !loading" class="no-resources">
      <img src="@assets/icons/illustration/environment.svg" alt />
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
        ref="createEnvRef"
        :model="projectConfig"
        :rules="rules"
        inline-message
      >
        <el-form-item :label="$t('environments.common.envName')" prop="env_name">
          <el-input v-model="projectConfig.env_name" size="small"></el-input>
        </el-form-item>
      </el-form>
      <div class="common-parcel-block">
        <div class="primary-title">{{$t('environments.pm.serviceList')}}</div>
        <div class="box-card-service">
          <div slot="header" class="clearfix">
            <span class="second-title">{{$t('environments.pm.secondTitle')}}</span>
            <span class="small-title">{{$t('environments.pm.smallTitle')}}</span>
          </div>
          <el-form class="service-form-block" label-width="50%" label-position="left">
            <div class="service-item" v-for="(typeServiceMap, serviceName) in pmServiceMap" :key="serviceName">
              <div class="primary-title">{{ serviceName }}</div>
              <div class="service-content">
                <div v-for="service in typeServiceMap" :key="`${service.service_name}-${service.type}`" class="service-block">
                  <template v-if="service.type==='pm'" class="container-images">
                    <el-form-item :label="$t('environments.pm.linkToHosts')" label-width="40%">
                      <el-button v-if="allHost.reduce((pre, cur) => pre + cur.options.length, 0) === 0" @click="$router.push('/v1/system/host')" type="text">{{$t('environments.pm.createHost')}}</el-button>
                      <el-select
                        v-else
                        v-model="service.host_with_labels"
                        filterable
                        multiple
                        @change="addHost(service)"
                        :placeholder="$t('environments.pm.selectHosts')"
                        size="small"
                      >
                        <el-option-group
                          v-for="group in allHost"
                          :key="group.label"
                          :label="group.label">
                          <el-option
                            v-for="item in group.options"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value">
                          </el-option>
                        </el-option-group>
                      </el-select>
                    </el-form-item>
                  </template>
                </div>
              </div>
            </div>
          </el-form>
        </div>
      </div>
      <el-form label-width="35%" class="ops">
        <el-form-item>
          <el-button @click="$router.back()" :loading="startDeployLoading" size="medium">{{$t(`global.cancel`)}}</el-button>
          <el-button @click="deployPmEnv" :loading="startDeployLoading" type="primary" size="medium">{{$t('environments.common.createEnv')}}</el-button>
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
  createEnvAPI,
  getHostListAPI,
  getProjectHostListAPI,
  getHostLabelListAPI
} from '@api'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      projectConfig: {
        product_name: '',
        cluster_id: '',
        env_name: '',
        source: 'pm',
        namespace: '',
        defaultNamespace: '',
        revision: null,
        isPublic: true,
        roleIds: [],
        registry_id: '',
        services: []
      },
      allHost: [],
      startDeployLoading: false,
      loading: false,
      pmServiceMap: {}
    }
  },

  computed: {
    projectName () {
      return this.$route.params.project_name
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
      return { env_name: { required: true, trigger: 'change', validator: validateEnvName } }
    }
  },
  methods: {
    getHosts () {
      getHostLabelListAPI().then(res => {
        this.allHostLabels = res
      })
      const key = this.$utils.rsaEncrypt()
      Promise.all([getProjectHostListAPI(key, this.projectName), getHostListAPI(key)]).then(res => {
        const projectOptions = res[0].map(item => {
          item.label = item.name
          item.value = item.id
          return item
        })
        const systemOptions = res[1].map(item => {
          item.label = item.name
          item.value = item.id
          return item
        })
        this.allHost = [
          {
            label: this.$t('environments.pm.projectResources'),
            options: projectOptions
          },
          {
            label: this.$t('environments.pm.systemResources'),
            options: systemOptions
          }
        ]
      })
    },
    addHost (service) {
      const allHostIds = this.allHost.map(item => {
        return item.options.map(option => option.id)
      }).flat()
      const labels = service.host_with_labels.filter(item => {
        return allHostIds.indexOf(item) < 0
      })
      const hostIds = service.host_with_labels.filter(item => {
        return allHostIds.indexOf(item) >= 0
      })
      service.host_ids = hostIds
      service.labels = labels
    },
    async getTemplateAndImg () {
      this.loading = true
      const template = await initProjectEnvAPI(this.projectName, this.isStcov)
      this.loading = false
      this.projectConfig.revision = template.revision
      for (const group of template.services) {
        group.sort((a, b) => {
          if (a.service_name !== b.service_name) {
            return a.service_name.charCodeAt(0) - b.service_name.charCodeAt(0)
          }
          return 0
        })
      }

      const pmServiceMap = {}
      for (const group of template.services) {
        for (const ser of group) {
          if (ser.type === 'pm') {
            pmServiceMap[ser.service_name] =
              pmServiceMap[ser.service_name] || {}
            pmServiceMap[ser.service_name][ser.type] = ser
          }
        }
      }
      this.projectConfig.services = template.services
      this.pmServiceMap = pmServiceMap
    },
    deployPmEnv () {
      this.$refs.createEnvRef.validate(valid => {
        if (valid) {
          for (const group of this.projectConfig.services) {
            for (const ser of group) {
              if (ser.type === 'pm') {
                ser.env_configs = [
                  {
                    env_name: this.projectConfig.env_name,
                    host_ids: ser.host_ids,
                    labels: ser.labels
                  }
                ]
                delete ser.host_ids
                delete ser.labels
                delete ser.host_with_labels
                delete ser.picked
              }
            }
          }
          const payload = this.$utils.cloneObj(this.projectConfig)
          payload.namespace = payload.defaultNamespace
          this.startDeployLoading = true
          function sleep (time) {
            return new Promise(resolve => setTimeout(resolve, time))
          }
          this.$store.commit('SET_MASK_STATUS', true)
          createEnvAPI(this.projectName, payload).then(
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
        } else {
          console.log('not-valid')
        }
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
    this.getHosts()
    this.getTemplateAndImg()
  }
}
</script>

<style lang="less" scoped>
.create-pm-env-container {
  position: relative;
  flex: 1;
  box-sizing: border-box;
  height: 100%;
  padding: 16px 24px;
  overflow: auto;

  .service-form-block {
    width: 90%;
    max-width: 1000px;

    .service-item {
      margin-bottom: 8px;
      padding: 12px;
      background: rgba(246, 246, 246, 0.6);
      border-radius: 6px;

      .service-content {
        box-sizing: border-box;
        padding: 15px 12px;
        background: var(--color-global-bg);
        border: 1px solid #d2d7dc;
        border-radius: 6px;

        .service-block {
          /deep/.el-form-item {
            margin-bottom: 8px;

            .el-select {
              width: 100%;
            }
          }
        }
      }
    }
  }

  .no-resources {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    justify-content: center;

    img {
      width: 400px;
      height: 400px;
    }

    p {
      color: #606266;
      font-size: 15px;
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

  .second-title {
    color: #606266;
    font-size: 14px;
  }

  .small-title {
    color: #969799;
    font-size: 12px;
  }

  .container-images {
    margin: 5px 0 0 0;
    padding: 10px 10px 0 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }

  .ops {
    margin-top: 25px;
  }
}
</style>
