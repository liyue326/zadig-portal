<template>
  <div class="common-parcel-block form-content">
    <el-form :model="form" :rules="rules" ref="form" label-width="120px" class="primary-form" label-position="left" inline-message>
      <el-form-item prop="env_name" :label="$t('environments.common.envName')">
        <el-input v-model="form.env_name" :placeholder="$t('environments.common.inputEnvName')" size="small"></el-input>
      </el-form-item>
      <el-form-item :label="$t(`status.imageRepo`)">
        <el-select class="select" filterable v-model.trim="form.registry_id" :placeholder="$t('environments.common.selectImageRepository')" size="small">
            <el-option
              v-for="registry in imageRegistry"
              :key="registry.id"
              :label="registry.namespace ? `${registry.reg_addr}/${registry.namespace}` : registry.reg_addr"
              :value="registry.id"
            ></el-option>
          </el-select>
      </el-form-item>
      <el-form-item :label="$t('environments.common.k8sCluster')">
        <el-select filterable v-model="form.cluster_id" :placeholder="$t('environments.common.selectK8sCluster')" @change="changeCluster" size="small">
          <el-option v-for="cluster in allCluster" :key="cluster.id" :label="$utils.showClusterName(cluster)" :value="cluster.id"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('environments.common.k8sNamespace')">
        <el-select filterable v-model="form.namespace" :placeholder="$t('environments.common.selectK8sNamespace')" @change="changeNamespace" size="small">
          <el-option v-for="(ns,index) in hostingNamespace" :key="index" :label="ns.name" :value="ns.name"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div class="primary-title not-first-child">{{$t('environments.hosting.selectServices')}}</div>
    <el-transfer
      :filter-placeholder="$t('environments.hosting.inputServiceNameToSearch')"
      v-model="selectService"
      :titles="[$t('environments.hosting.serviceList'), $t('environments.hosting.selectedServices')]"
      :data="serviceList"
      :render-content="renderFunc"
      :filterable="true"
    ></el-transfer>
  </div>
</template>
<script>
import {
  getClusterListAPI,
  productHostingNamespaceAPI,
  queryWorkloads,
  postWorkloads,
  getRegistryWhenBuildAPI
} from '@/api'
export default {
  name: 'hostEnvConfig',
  data () {
    return {
      allCluster: [],
      imageRegistry: [],
      hostingNamespace: [],
      form: {
        env_name: null,
        cluster_id: null,
        namespace: null,
        registry_id: ''
      },
      serviceList: [],
      selectService: [],
      renderFunc (h, option) {
        if (option.env_name) {
          const content = `使用项目：${option.product_name}；使用环境：${option.env_name}`
          return (
            <el-tooltip content={content} placement="top">
              <span>{option.label}</span>
            </el-tooltip>
          )
        } else {
          return (
            <el-tooltip
              content={option.images && option.images[0]}
              placement="top"
            >
              <span>{option.label}</span>
            </el-tooltip>
          )
        }
      }
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
      return {
        env_name: [
          { required: true, trigger: 'change', validator: validateEnvName }
        ]
      }
    }
  },
  methods: {
    clearTransfer () {
      this.serviceList = []
      this.selectService = []
    },
    async changeNamespace () {
      this.clearTransfer()
      this.getWorkloads(1)
    },
    async getWorkloads (page) {
      const res = await queryWorkloads(
        this.projectName,
        this.form.cluster_id,
        this.form.namespace,
        page
      )
      this.serviceList = res.data.services.map((item, index) => {
        return {
          label: item.service_name,
          key: index,
          disabled: !!item.env_name,
          name: item.service_name,
          type: item.workLoadType,
          product_name: item.product_name,
          env_name: item.env_name,
          images: item.images
        }
      })
    },
    async getCluster () {
      const projectName = this.projectName
      const res = await getClusterListAPI(projectName)
      const cluster_id = this.form.cluster_id
      this.allCluster = res.filter(element => {
        if (element.local && !cluster_id) {
          this.form.cluster_id = element.id
        }
        return element.status === 'normal'
      })
      if (this.form.cluster_id) {
        this.changeCluster(this.form.cluster_id)
      }
    },
    changeCluster (clusterId) {
      this.hostingNamespace = []
      this.clearTransfer()
      productHostingNamespaceAPI(clusterId).then(res => {
        this.hostingNamespace = res
      })
    },
    async validate () {
      const res = await this.$refs.form.validate().catch(e => {
        return false
      })
      if (res) {
        if (this.selectService.length) {
          return true
        } else {
          this.$message.error(this.$t('environments.hosting.pleaseSelectServices'))
        }
      }
    },
    async submit () {
      const workloads = this.serviceList.filter(item => {
        return this.selectService.includes(item.key)
      })
      const params = {
        ...this.form,
        workloads: workloads,
        product_name: this.projectName
      }
      return postWorkloads(params)
    }
  },
  created () {
    this.getCluster()
    getRegistryWhenBuildAPI(this.projectName).then(res => {
      this.imageRegistry = res
      const registry = res.find(reg => reg.is_default)
      this.form.registry_id = registry ? registry.id : ''
    })
  }
}
</script>
<style lang='less' scoped>
@secondaryColor: #888888;

.form-content {
  padding-bottom: 40px;

  /deep/.el-transfer {
    .el-transfer-panel {
      min-width: 360px;
    }

    .el-transfer-panel__filter .el-input__inner {
      border-radius: 4px;
    }

    .el-transfer-panel .el-transfer-panel__header {
      height: 28px;
      line-height: 28px;
      background: @globalBackgroundColor;

      .el-checkbox {
        line-height: 28px;

        .el-checkbox__label {
          color: @secondaryColor;
          font-weight: 300;
          font-size: 12px;
        }
      }
    }

    .el-transfer-panel__empty {
      color: @fontLightGray;
      font-weight: 300;
    }
  }

  /deep/ .el-button {
    padding: 10px;
  }
}
</style>
