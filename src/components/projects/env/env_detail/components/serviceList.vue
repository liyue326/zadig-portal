<template>
  <div class="service-list">
    <el-table v-if="containerServiceList.length > 0" :data="containerServiceList">
      <el-table-column :label="$t(`global.serviceName`)" width="280px">
        <template slot-scope="scope">
          <router-link :to="setRoute(scope)">
            <span :class="$utils._getStatusColor(scope.row.status)" class="service-name">
              <i v-if="scope.row.type==='k8s'" class="iconfont service-icon iconrongqifuwu"></i>
              {{ scope.row.service_display_name || scope.row.service_name }}
            </span>
          </router-link>
          <template v-if="serviceStatus[scope.row.service_name] && envSource!=='helm'">
            <template v-if="serviceStatus[scope.row.service_name].raw.error">
              <el-tooltip  effect="dark" :content="`更新错误：${serviceStatus[scope.row.service_name].raw.error}`" placement="top">
                <i class="el-icon-warning operation error"></i>
              </el-tooltip>
            </template>
            <template v-if="serviceStatus[scope.row.service_name].raw.deploy_strategy === 'import'">
              <el-tooltip  effect="dark" content="该服务尚未通过 Zadig 部署，可执行「更新服务」或「重启服务」操作使用 Zadig 上管理的服务配置重新部署" placement="top">
                <i class="el-icon-info operation"></i>
              </el-tooltip>
            </template>
            <template v-if="serviceStatus[scope.row.service_name]['tpl_updatable']">
              <el-popover placement="right" popper-class="diff-popper" width="600" trigger="click">
                <el-tabs v-model="activeDiffTab" type="card">
                  <el-tab-pane name="template">
                    <span slot="label">
                      <i class="el-icon-tickets"></i> 模板对比
                    </span>
                    <div class="diff-container">
                      <div class="diff-content">
                        <pre
                          :class="{ 'added': section.added, 'removed': section.removed }"
                          v-for="(section,index) in combineTemplate"
                          :key="index"
                        >{{section.value}}</pre>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
                <span slot="reference" class="service-updateable">
                  <el-tooltip effect="dark" content="配置变更" placement="top">
                    <i @click="openPopper(scope.row)" class="el-icon-question icon operation"></i>
                  </el-tooltip>
                </span>
              </el-popover>
            </template>
          </template>
        </template>
      </el-table-column>
      <el-table-column align="left" :label="$t(`global.status`)" width="220px">
        <template slot="header" slot-scope="{}">
        {{$t('environments.common.serviceDetail.serviceStatus')}}{{`(${runningContainerService}/${containerServiceList.length})`}}
          <el-tooltip effect="dark" placement="top">
            <div slot="content">实际正常的服务/预期的正常服务数量</div>
            <i class="status-icon el-icon-question"></i>
          </el-tooltip>
        </template>
        <template slot-scope="scope">
          <el-tag size="small" :type="statusIndicator[scope.row.status]">{{scope.row.status}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column align="left" :label="$t('environments.common.imageInfo')" min-width="150px">
        <template slot-scope="scope">
          <div v-for="(image,index) in scope.row.images" :key="index">
            <el-tooltip effect="dark" :content="image" placement="top">
              <span>{{ imageNameSplit(image) }}</span>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
      <el-table-column align="left" width="150px" :label="$t('global.serviceEntrypoint')">
        <template slot-scope="scope">
          <template v-if="scope.row.ingress && scope.row.ingress.host_info && scope.row.ingress.host_info.length>0">
            <el-tooltip
              v-for="(ingress,index) in scope.row.ingress.host_info"
              :key="index"
              effect="dark"
              :content="ingress.host"
              placement="top"
            >
              <span class="ingress-url">
                <a :href="`http://${ingress.host}`" target="_blank">{{ingress.host}}</a>
              </span>
            </el-tooltip>
          </template>
          <span v-else>N/A</span>
        </template>
      </el-table-column>
      <el-table-column align="center" :label="$t(`global.operation`)" width="150px">
        <template slot-scope="scope">
          <span v-if="envSource !=='external' && envSource !=='helm'" class="operation">
            <el-tooltip
              v-if="checkPermissionSyncMixin({projectName: projectName, action: 'manage_environment',resource:{name:envName,type:'env'}})"
              effect="dark"
              :content="$t('environments.common.runWorkflowToUpgradeService')"
              placement="top"
            >
              <i @click="upgradeServiceByWorkflow(projectName,envName,scope.row.service_name,scope.row.type)" class="iconfont iconshengji"></i>
            </el-tooltip>
            <el-tooltip
              v-else
              effect="dark"
              :content="$t('permission.lackPermission')"
              placement="top"
            >
              <i class="iconfont iconshengji permission-disabled"></i>
            </el-tooltip>
          </span>
          <span class="operation">
            <el-tooltip v-if="checkPermissionSyncMixin({projectName: projectName, action: 'manage_environment',resource:{name:envName,type:'env'}})" effect="dark" :content="$t('environments.common.serviceDetail.restartService')" placement="top">
              <i @click="restartService(projectName,scope.row.service_name,$route.query.envName)" class="el-icon-refresh"></i>
            </el-tooltip>
            <el-tooltip v-else effect="dark" :content="$t('permission.lackPermission')" placement="top">
              <i class="el-icon-refresh permission-disabled"></i>
            </el-tooltip>
          </span>
          <span v-if="(envSource===''||envSource ==='spock'||envSource ==='external')" class="operation">
            <el-tooltip
              v-if="checkPermissionSyncMixin({projectName: projectName, action: 'manage_environment',resource:{name:envName,type:'env'}})"
              effect="dark"
              :content="$t('environments.common.updateService')"
              placement="top"
            >
              <i @click="updateServiceDialog(scope.row)" class="iconfont icongengxin"></i>
            </el-tooltip>
            <el-tooltip
              v-else
              effect="dark"
              :content="$t('permission.lackPermission')"
              placement="top"
            >
              <span><i class="iconfont icongengxin permission-disabled"></i></span>
            </el-tooltip>
          </span>
        </template>
      </el-table-column>
    </el-table>
    <el-dialog :title="`更新服务 - ${usedServiceInfo.service_name}`" :visible.sync="usedServiceInfo.dialogVisible" width="60%" class="update-service">
      <div>
        <div class="primary-title">变量配置</div>
        <Resize v-show="usedServiceInfo.canEditYaml" @sizeChange="$refs.codemirror.refresh()" :height="'300px'">
          <CodeMirror ref="codemirror" v-model="usedServiceInfo.variable_yaml" />
        </Resize>
        <div v-show="!usedServiceInfo.canEditYaml" style="color: #aaa;">
          无服务变量
        </div>
        <div style="margin-top: 14px;">
          <el-checkbox v-if="serviceStatus[usedServiceInfo.service_name] && serviceStatus[usedServiceInfo.service_name]['tpl_updatable']" v-model="usedServiceInfo.update_service_tmpl">同时更新服务配置</el-checkbox>
        </div>
      </div>
      <div slot="footer" >
        <el-button @click="usedServiceInfo.dialogVisible = false" size="small">取 消</el-button>
        <el-button type="primary" @click="sureUpdateService" size="small">更新</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Resize from '@/components/common/resize'
import CodeMirror from '@/components/projects/common/codemirror.vue'
import { serviceTemplateAfterRenderAPI, getServiceDefaultVariableAPI } from '@api'
import { cloneDeep } from 'lodash'

const jsdiff = require('diff')

export default {
  props: {
    containerServiceList: Array,
    setRoute: Function,
    serviceStatus: Object,
    envSource: String,
    isPmService: Boolean,
    isProd: Boolean,
    upgradeServiceByWorkflow: Function,
    restartService: Function,
    setServiceConfigRoute: Function,
    updateService: Function
  },
  data () {
    this.updateServiceInfo = {
      dialogVisible: false,
      service_name: '',
      variable_yaml: '',
      canEditYaml: false,
      update_service_tmpl: false
    }
    return {
      activeDiffTab: 'template',
      combineTemplate: [],
      statusIndicator: {
        Running: 'success',
        Succeeded: 'success',
        Error: 'danger',
        Unstable: 'warning',
        Unstart: 'info'
      },
      usedServiceInfo: cloneDeep(this.updateServiceInfo)
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    envName () {
      return this.$route.query.envName
    },
    runningContainerService () {
      return this.containerServiceList.filter(
        s => s.status === 'Running' || s.status === 'Succeeded'
      ).length
    }
  },
  methods: {
    openPopper (service) {
      const projectName = this.projectName
      const envName = this.envName
      serviceTemplateAfterRenderAPI(
        projectName,
        service.service_name,
        envName
      ).then(res => {
        this.combineTemplate = jsdiff.diffLines(
          res.current.yaml,
          res.latest.yaml
        )
      })
    },
    imageNameSplit (name) {
      if (name.includes(':')) {
        return name.split('/')[name.split('/').length - 1]
      } else {
        return name
      }
    },
    updateServiceDialog (service) {
      this.usedServiceInfo = cloneDeep(this.updateServiceInfo)

      const { product_name, env_name, service_name } = service
      this.usedServiceInfo.dialogVisible = true
      this.usedServiceInfo.service_name = service_name
      // notice: If the interaction is complicated, it will be unified here in the future
      getServiceDefaultVariableAPI(product_name, env_name, [service_name]).then(res => {
        res.forEach(svc => {
          if (svc.service_name === service_name) {
            this.usedServiceInfo.variable_yaml = svc.variable_yaml
            this.usedServiceInfo.canEditYaml = !!svc.variable_yaml
            this.usedServiceInfo.update_service_tmpl = !!svc.variable_yaml
          }
        })
      })
    },
    sureUpdateService () {
      const { service_name, variable_yaml, update_service_tmpl } = this.usedServiceInfo
      const payload = {
        service_name,
        type: 'k8s',
        variable_yaml,
        update_service_tmpl
      }
      this.updateService({ service_name, type: 'k8s' }, payload)
      this.usedServiceInfo.dialogVisible = false
    }
  },
  components: {
    Resize,
    CodeMirror
  }
}
</script>

<style lang="less">
.update-service {
  .el-dialog__header {
    padding: 15px;
    text-align: center;
    border-bottom: 1px solid #e4e4e4;
  }

  .el-dialog__body {
    padding: 30px 40px;

    .primary-title {
      margin-bottom: 14px;
    }
  }
}
</style>
