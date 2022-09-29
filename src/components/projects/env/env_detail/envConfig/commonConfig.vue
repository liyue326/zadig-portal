<template>
  <div class="env-common-config-container">
    <el-button
      v-hasPermi="{projectName: projectName, actions: ['production:config_environment','config_environment'],operator:'or',isBtn:true}"
      type="primary"
      size="small"
      plain
      @click="operateConfig('add')"
      style="margin-bottom: 12px;"
    >添加</el-button>
    <div v-loading="configLoading">
      <ETable :tableData="currentInfos.tableData" :tableColumns="currentInfos.tableColumns" :id="currentInfos.id"></ETable>
    </div>
  </div>
</template>

<script>
import {
  getIngressObjectAPI,
  getConfigMapObjectAPI,
  getSecretObjectAPI,
  getPvcObjectAPI,
  addConfigObjectAPI,
  updateConfigObjectAPI,
  deleteConfigObjectAPI
} from '@api'
import ETable from '@/components/common/etable/index.vue'
import { pick } from 'lodash'
export default {
  props: {
    currentType: String
  },
  data () {
    return {
      configLoading: false,
      configInfos: {
        Ingress: {
          id: 'ingress_name',
          getAPI: getIngressObjectAPI,
          tableData: [],
          tableColumns: [
            {
              prop: 'ingress_name',
              label: '名称'
            },
            {
              prop: 'host_info',
              label: 'HOSTS'
            },
            {
              prop: 'address',
              label: '地址'
            },
            // {
            //   prop: 'ports',
            //   label: '端口'
            // },
            {
              width: '210',
              render: this.operation
            }
          ]
        },
        ConfigMap: {
          id: 'cm_name',
          getAPI: getConfigMapObjectAPI,
          tableData: [],
          tableColumns: [
            {
              prop: 'cm_name',
              label: '名称'
            },
            {
              prop: 'services',
              label: '关联服务',
              render: scope => {
                return <span>{scope.row.services.join(', ')}</span>
              }
            },
            {
              width: '210',
              render: this.operation
            }
          ]
        },
        Secret: {
          id: 'secret_name',
          getAPI: getSecretObjectAPI,
          tableData: [],
          tableColumns: [
            {
              prop: 'secret_name',
              label: '名称'
            },
            {
              prop: 'secret_type',
              label: '类型'
            },
            {
              prop: 'services',
              label: '关联服务',
              render: scope => {
                return <span>{scope.row.services.join(', ')}</span>
              }
            },
            {
              width: '210',
              render: this.operation
            }
          ]
        },
        PVC: {
          id: 'pvc_name',
          getAPI: getPvcObjectAPI,
          tableData: [],
          tableColumns: [
            {
              prop: 'pvc_name',
              label: '名称'
            },
            {
              prop: 'status',
              label: '状态'
            },
            {
              prop: 'volume',
              label: '挂载点'
            },
            {
              prop: 'capacity',
              label: '容量'
            },
            {
              prop: 'access_modes',
              label: '访问模式'
            },
            {
              prop: 'storageclass',
              label: 'STORAGECLASS'
            },
            {
              prop: 'services',
              label: '关联服务',
              render: scope => {
                return <span>{scope.row.services.join(', ')}</span>
              }
            },
            {
              width: '210',
              render: this.operation
            }
          ]
        }
      }
    }
  },
  computed: {
    currentInfos () {
      const current = this.configInfos[this.currentType]
      const isHelm = this.isHelm
      if (current) {
        // hidden services column
        current.tableColumns = current.tableColumns.filter(column => {
          if (isHelm && column.prop === 'services') {
            return false
          }
          return true
        })
      }
      return (
        current || {
          id: 'id',
          getAPI: null,
          tableData: [],
          tableColumns: []
        }
      )
    },
    projectName () {
      return this.$route.params.project_name
    },
    envName () {
      return this.$route.params.env_name
    },
    isHelm () {
      const current = this.$store.getters.projectList.find(
        project => project.name === this.projectName
      )
      return current ? current.deployType === 'helm' : false
    }
  },
  watch: {
    currentType (nVal, oVal) {
      if (nVal !== oVal) {
        this.getConfigByType(nVal)
      }
    }
  },
  methods: {
    operation (scope) {
      return (
        <div>
          <el-button
            type="text"
            size="mini"
            v-hasPermi={{ projectName: this.projectName, actions: ['production:get_environment', 'get_environment'], operator: 'or', isBtn: true }}
            onClick={() => {
              this.operateConfig('view', scope.row, scope.$index)
            }}
          >
            查看
          </el-button>
          <el-button
            type="text"
            size="mini"
            v-hasPermi={{ projectName: this.projectName, actions: ['production:config_environment', 'config_environment'], operator: 'or', isBtn: true }}
            onClick={() => {
              this.operateConfig('edit', scope.row, scope.$index)
            }}
            disabled={scope.row.immutable}
          >
            编辑
          </el-button>
          <el-button
            type="text"
            size="mini"
            v-hasPermi={{ projectName: this.projectName, actions: ['production:get_environment', 'get_environment'], operator: 'or', isBtn: true }}
            onClick={() => {
              this.operateConfig('history', scope.row, scope.$index)
            }}
          >
            历史版本
          </el-button>
          <el-button
            type="text"
            size="mini"
            v-hasPermi={{ projectName: this.projectName, actions: ['production:config_environment', 'config_environment'], operator: 'or', isBtn: true }}
            onClick={() => {
              this.deleteConfig(scope.row)
            }}
          >
            删除
          </el-button>
        </div>
      )
    },
    operateConfig (action, row) {
      // action : view/edit/add/history
      if (action === 'add') {
        this.$emit('actionConfig', {
          actionType: action, // add
          showImport: true
        })
      } else {
        const gitRepoConfig = row.source_detail
          ? {
            ...pick(row.source_detail.git_repo_config, [
              'owner',
              'repo',
              'branch',
              'namespace'
            ]),
            codehostID: row.source_detail.git_repo_config.codehost_id,
            valuesPaths: Array.isArray(row.source_detail.load_path)
              ? row.source_detail.load_path
              : [row.source_detail.load_path],
            autoSync: row.auto_sync || false
          }
          : null
        this.$emit('actionConfig', {
          actionType: action, // view/edit/history
          name: row[this.currentInfos.id],
          yamlData: row.yaml_data,
          services: row.services || [],
          showImport: action === 'edit',
          readOnly: action === 'view',
          gitRepoConfig
        })
      }
    },
    getConfigByType (type = '*') {
      let allType = []
      if (type === '*') {
        allType = ['Ingress', 'ConfigMap', 'Secret', 'PVC']
      } else {
        allType = [type]
      }

      const projectName = this.projectName
      const envName = this.envName

      const apiArr = []

      allType.forEach(type => {
        const currentInfo = this.configInfos[type]
        apiArr.push(
          currentInfo
            .getAPI(projectName, envName)
            .then(res => {
              currentInfo.tableData = res
            })
            .catch(err => {
              console.log(err)
              currentInfo.tableData = []
            })
        )
      })
      this.configLoading = true
      Promise.all(apiArr).then(() => {
        // type=ConfigMap&cmName=&action=edit/history
        const query = this.$route.query
        if (type === '*' && query.type === 'ConfigMap' && query.cmName) {
          const current = this.configInfos.ConfigMap.tableData.find(
            data => data.cm_name === query.cmName
          )
          if (current) {
            this.operateConfig(query.action, {
              name: query.cmName,
              ...current
            })
          }
        }
        this.configLoading = false
      })
    },
    async deleteConfig (row) {
      const objectName = row[this.currentInfos.id]
      this.$confirm(
        `确定要删除 ${this.envName} 环境中 ${objectName} 配置?`,
        '删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        const params = {
          objectName,
          projectName: this.projectName,
          envName: this.envName,
          commonEnvCfgType: this.currentType
        }
        const res = await deleteConfigObjectAPI(params).catch(err =>
          console.log(err)
        )
        if (res) {
          this.$message.success(`删除 ${objectName} 成功！`)
          this.getConfigByType(this.currentType)
        }
      })
    },
    createConfigByType ({ yamlData, gitRepoConfig, autoSync }) {
      const payload = {
        env_name: this.envName,
        common_env_cfg_type: this.currentType,
        yaml_data: yamlData,
        git_repo_config: gitRepoConfig,
        auto_sync: autoSync
      }
      return addConfigObjectAPI(this.projectName, payload)
        .then(res => {
          this.$message.success(`添加配置成功！`)
          this.getConfigByType(this.currentType)
        })
        .catch(err => {
          console.log(err)
          return 'error'
        })
    },
    updateConfigByType ({
      name,
      restart_associated_svc = false,
      services,
      yamlData,
      gitRepoConfig,
      autoSync,
      fromRollback
    }) {
      const payload = {
        service_name: '',
        name,
        restart_associated_svc,
        services,
        env_name: this.envName,
        common_env_cfg_type: this.currentType,
        yaml_data: yamlData,
        git_repo_config: gitRepoConfig,
        auto_sync: autoSync
      }
      return updateConfigObjectAPI(this.projectName, fromRollback, payload)
        .then(res => {
          this.$message.success(`更新配置成功！`)
          this.getConfigByType(this.currentType)
        })
        .catch(err => {
          console.log(err)
          return 'error'
        })
    }
  },
  created () {
    this.getConfigByType()
  },
  components: {
    ETable
  }
}
</script>

<style lang="less" scoped>
.env-common-config-container {
  background: #fff;
}
</style>
