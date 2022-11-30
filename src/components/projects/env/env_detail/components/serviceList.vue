<template>
  <div class="service-list">
    <el-table v-if="containerServiceList.length > 0" :data="containerServiceList">
      <el-table-column label="服务名" width="280px">
        <template slot-scope="scope">
          <router-link :to="setRoute(scope)">
            <span :class="$utils._getStatusColor(scope.row.status)" class="service-name">
              <i v-if="scope.row.type==='k8s'" class="iconfont service-icon iconrongqifuwu"></i>
              {{ scope.row.service_display_name || scope.row.service_name }}
            </span>
          </router-link>
          <template
            v-if="serviceStatus[scope.row.service_name] && serviceStatus[scope.row.service_name]['tpl_updatable'] && envSource!=='helm'"
          >
            <template v-if="serviceStatus[scope.row.service_name].raw.deploy_strategy === 'import'">
              <el-tooltip  effect="dark" content="该服务尚未通过 Zadig 部署，可执行「更新服务」或「重启服务」操作使用 Zadig 上管理的服务配置重新部署" placement="top">
                <i class="el-icon-warning-outline operation"></i>
              </el-tooltip>
            </template>
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
            <el-tooltip  effect="dark" content="更新服务" placement="top">
              <i v-hasPermi="{projectName: projectName, action: 'manage_environment',resource:{name:envName,type:'env'},isBtn:true}" @click="updateService(scope.row)" class="iconfont icongengxin operation"></i>
            </el-tooltip>
          </template>
        </template>
      </el-table-column>
      <el-table-column align="left" label="状态" width="220px">
        <template slot="header" slot-scope="{}">
          状态{{`(${runningContainerService}/${containerServiceList.length})`}}
          <el-tooltip effect="dark" placement="top">
            <div slot="content">实际正常的服务/预期的正常服务数量</div>
            <i class="status-icon el-icon-question"></i>
          </el-tooltip>
        </template>
        <template slot-scope="scope">
          <el-tag size="small" :type="statusIndicator[scope.row.status]">{{scope.row.status}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column align="left" label="镜像信息" min-width="150px">
        <template slot-scope="scope">
          <div v-for="(image,index) in scope.row.images" :key="index">
            <el-tooltip effect="dark" :content="image" placement="top">
              <span>{{ imageNameSplit(image) }}</span>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
      <el-table-column align="left" width="150px" label="服务入口">
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
      <el-table-column align="center" label="操作" width="150px">
        <template slot-scope="scope">
          <span v-if="envSource !=='external' && envSource !=='helm'" class="operation">
            <el-tooltip
              v-if="checkPermissionSyncMixin({projectName: projectName, action: 'manage_environment',resource:{name:envName,type:'env'}})"
              effect="dark"
              content="通过工作流升级服务"
              placement="top"
            >
              <i @click="upgradeServiceByWorkflow(projectName,envName,scope.row.service_name,scope.row.type)" class="iconfont iconshengji"></i>
            </el-tooltip>
            <el-tooltip
              v-else
              effect="dark"
              content="无权限操作"
              placement="top"
            >
              <i class="iconfont iconshengji permission-disabled"></i>
            </el-tooltip>
          </span>
          <span class="operation">
            <el-tooltip v-if="checkPermissionSyncMixin({projectName: projectName, action: 'manage_environment',resource:{name:envName,type:'env'}})" effect="dark" content="重启服务" placement="top">
              <i @click="restartService(projectName,scope.row.service_name,$route.query.envName)" class="el-icon-refresh"></i>
            </el-tooltip>
            <el-tooltip v-else effect="dark" content="无权限操作" placement="top">
              <i class="el-icon-refresh permission-disabled"></i>
            </el-tooltip>
          </span>
          <span v-if="(envSource===''||envSource ==='spock'||envSource ==='external')" class="operation">
            <el-tooltip
              v-if="checkPermissionSyncMixin({projectName: projectName, action: 'manage_environment',resource:{name:envName,type:'env'}})"
              effect="dark"
              content="查看服务配置"
              placement="top"
            >
              <router-link :to="setServiceConfigRoute(scope)">
                <i class="iconfont iconfuwupeizhi"></i>
              </router-link>
            </el-tooltip>
            <el-tooltip
              v-else
              effect="dark"
              content="无权限操作"
              placement="top"
            >
              <span><i class="iconfont iconfuwupeizhi permission-disabled"></i></span>
            </el-tooltip>
          </span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { serviceTemplateAfterRenderAPI } from '@api'

const jsdiff = require('diff')

export default {
  props: {
    containerServiceList: Array,
    setRoute: Function,
    serviceStatus: Object,
    envSource: String,
    updateService: Function,
    isPmService: Boolean,
    isProd: Boolean,
    upgradeServiceByWorkflow: Function,
    restartService: Function,
    setServiceConfigRoute: Function
  },
  data () {
    return {
      activeDiffTab: 'template',
      combineTemplate: [],
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
    }
  }
}
</script>
