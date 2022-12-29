<template>
  <div class="dashboard">
    <div class="header">
      <!-- <el-input placeholder="搜索" size="small" class="header-search"></el-input> -->
      <el-button class="header-btn"  size="small" plain @click="isShowCardDialog=true"><i class="el-icon-plus"/>&nbsp;&nbsp;&nbsp;&nbsp;{{$t(`dashboard.addCard`)}}&nbsp;&nbsp;</el-button>
    </div>
    <div class="main">
      <section v-if="info.cards.length === 0" class="no-running">
        <img src="@assets/icons/illustration/runStatus.svg" alt />
        <p>{{$t(`dashboard.noCard`)}}</p>
      </section>
      <draggable v-else v-model="info.cards" group="people" @start="onStart" @end="onEnd">
        <transition-group class="wrap">
          <el-card v-for="(item,index) in info.cards" :key="item.id" class="item">
            <div slot="header" class="header">
              <span>{{$t(`dashboard.${item.type}`)}}</span>
              <el-dropdown @command="handleCommand($event, item,index)">
                <span class="el-dropdown-link">
                  <el-button type="text">
                    <i class="el-icon-more"></i>
                  </el-button>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="edit" v-if="item.type==='my_workflow'||item.type==='my_env'">{{$t(`global.edit`)}}</el-dropdown-item>
                  <el-dropdown-item command="delete">{{$t(`global.delete`)}}</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <div>
              <el-table
                :data="item.workflow_list"
                class="table"
                v-if="!item.show&&item.type==='my_workflow'||!item.show&&item.type==='running_workflow'"
              >
                <el-table-column prop="display_name" :label="$t(`workflow.workflowName`)" min-width="20%">
                  <template slot-scope="scope">
                    <span :class="[`status-${$utils.taskElTagType(scope.row.status)}`]" class="status">•</span>
                    <el-tooltip effect="dark" placement="top">
                      <div slot="content">
                        <div>所属项目：{{scope.row.project}}</div>
                        <div>工作流名称：{{scope.row.name}}</div>
                      </div>
                      <span class="name" @click="goWorkflow(scope.row, false,item.type)">{{$utils.tailCut( scope.row.display_name,16)}}</span>
                    </el-tooltip>
                  </template>
                </el-table-column>
                <el-table-column prop="creator" :label="$t(`workflow.executor`)" min-width="15%"></el-table-column>
                <el-table-column prop="start_time" :label="$t(`environments.config.creationTime`)" min-width="20%">
                  <template slot-scope="scope">
                    <span>{{ $utils.convertTimestamp(scope.row.start_time)}}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="time" :label="$t(`global.operation`)" width="100px" v-if="item.type==='my_workflow'">
                  <template slot-scope="scope">
                    <el-button size="small" type="text" @click="goWorkflow(scope.row,true,item.type)">{{$t(`workflow.run`)}}</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!item.show&&item.type==='my_env'">
                <div class="env-tip" v-if="item.config">
                  <span v-if="item.config.name">
                    <router-link
                      :to="`/v1/projects/detail/${item.config.project_name}/envs/detail?envName=${item.config.name}` "
                      target="_blank"
                    >
                      <span class="env-name">{{`${item.config.name}`}}</span>
                    </router-link>
                    <span class="desc">({{item.config.project_name}})</span>
                  </span>
                  <span class="desc">
                    {{$t(`environments.config.lastModified`)}}：{{item.config.updated_by}}
                    <span>{{ $utils.convertTimestamp(item.config.update_time)}}</span>
                  </span>
                </div>
                <el-table v-if="item.vm_services && item.vm_services.length > 0" class="pm-service-container" :data="item.vm_services">
                  <el-table-column :label="$t(`global.serviceName`)" min-width="20%">
                    <template slot-scope="scope">
                      <router-link :to="setPmRoute(scope,item.config)" target="_blank">
                        <span class="service-name">
                          <i v-if="scope.row.type==='pm'" class="iconfont service-icon iconwuliji"></i>
                          {{ scope.row.service_name }}
                        </span>
                      </router-link>
                    </template>
                  </el-table-column>
                  <el-table-column align="left" :label="$t(`global.status`)" min-width="20%">
                    <template slot="header">
                      {{$t(`global.status`)}}
                      <el-tooltip effect="dark" placement="top">
                        <div slot="content">实际正常运行的服务数量/预期正常运行服务数量</div>
                        <i class="el-icon-question"></i>
                      </el-tooltip>
                    </template>
                    <template slot-scope="scope">
                      <span>{{calcPmServiceStatus(scope.row.env_status)}}</span>
                    </template>
                  </el-table-column>
                  <el-table-column align="left" min-width="40%" label="主机资源">
                    <template slot-scope="scope">
                      <template v-if="scope.row.env_status && scope.row.env_status.length>0">
                        {{scope.row.env_status.map(item=>item.address).toString()}}
                      </template>
                    </template>
                  </el-table-column>
                </el-table>
                <el-table :data="item.services" class="table" v-else>
                  <el-table-column prop="service_name" :label="$t(`global.serviceName`)" min-width="20%">
                    <template slot-scope="scope">
                      <router-link :to="goService(scope,item.config)" target="_blank">
                        <span class="service-name">{{ scope.row.service_name }}</span>
                      </router-link>
                    </template>
                  </el-table-column>
                  <el-table-column prop="status" :label="$t(`workflow.runStatus`)" min-width="20%">
                    <template slot-scope="scope">
                      <span :class="[$translate.calcEnvStatusColor(scope.row.status)]">{{getProdStatus(scope.row.status,true)}}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="image" :label="$t(`status.imgInfo`)" min-width="40%">
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" :content="scope.row.image" placement="top">
                        <span>{{scope.row.image.split(':')[1]}}</span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-if="item.show">
                <el-form ref="form" :model="curInfo" label-width="100px">
                  <div v-if="item.type==='my_workflow'">
                    <el-form-item :label="$t(`workflow.selectWorkflow`)">
                      <el-select
                        :placeholder="$t(`workflow.selectWorkflow`)"
                        size="small"
                        value-key="name"
                        v-model="curInfo.config.workflow_list"
                        filterable
                        multiple
                      >
                        <el-option
                          v-for="item in workflowList"
                          :label="`${item.display_name}(${item.project_name})`"
                          :key="item.name"
                          :value="item"
                        >{{item.display_name}}({{item.project_name}})</el-option>
                      </el-select>
                    </el-form-item>
                  </div>
                  <div v-if="item.type==='my_env'">
                    <el-form-item :label="$t(`dataStatistics.insight.selectProject`)">
                      <el-select
                        :placeholder="$t(`dataStatistics.insight.selectProject`)"
                        size="small"
                        v-model="curInfo.config.project_name"
                        @change="handleProjectChange"
                      >
                        <el-option v-for="item in projectList" :key="item.name" :value="item.name">{{item.name}}</el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item :label="$t(`environments.common.selectEnv`)">
                      <el-select
                        :placeholder="$t(`environments.common.selectEnv`)"
                        size="small"
                        v-model="curInfo.config.env_name"
                        @change="handleEnvChange"
                      >
                        <el-option v-for="item in envList" :key="item.name" :value="item.name">{{item.name}}</el-option>
                      </el-select>
                    </el-form-item>
                    <el-form-item :label="$t(`workflow.selectService`)">
                      <el-select
                        :placeholder="$t(`workflow.selectService`)"
                        size="small"
                        v-model="curInfo.config.service_modules"
                        multiple
                        filterable
                        value-key="service_name"
                      >
                        <el-option
                          v-for="item in serviceList"
                          :key="item.service_name"
                          :value="item"
                          :label="item.service_name"
                        >{{item.service_name}}</el-option>
                      </el-select>
                    </el-form-item>
                  </div>
                </el-form>
                <div class="mg-t24">
                  <el-button type="primary" size="small" @click="save(item)">{{$t(`global.save`)}}</el-button>
                  <el-button size="small" @click="cancel(item)">{{$t(`global.cancel`)}}</el-button>
                </div>
              </div>
            </div>
          </el-card>
        </transition-group>
      </draggable>
    </div>
    <el-dialog :title="$t(`dashboard.addCard`)" :visible.sync="isShowCardDialog" width="60%" class="card-dialog">
      <el-card shadow="hover" v-for="item in cardTypeList" :key="item.title" class="card">
        <div class="type" @click="operateCard(item)">
          <span class="type-title">{{item.name}}</span>
          <span class="type-desc">{{item.desc}}</span>
        </div>
      </el-card>
    </el-dialog>
  </div>
</template>
<script>
import draggable from 'vuedraggable'
import { cloneDeep } from 'lodash'
import bus from '@utils/eventBus'
import { v4 } from 'uuid'
import { translateEnvStatus } from '@utils/wordTranslate'

import {
  updateDashboardSettingsAPI,
  getDashboardSettingsAPI,
  getMyWorkflowAPI,
  getRunningWorkflowAPI,
  getMyEnvAPI,
  getProjectsAPI,
  getEnvironmentsAPI,
  productServicesAPI,
  getMyWorkflowsAPI
} from '@api'
export default {
  name: 'Dashboard',
  data () {
    return {
      info: {
        cards: []
      },
      curInfo: {
        config: {
          workflow_list: [],
          project_name: '',
          env_name: '',
          service_name: [],
          service_modules: []
        }
      },
      envTimer: 0,
      workflowTimer: 0,
      runningWorkflowTimer: 0,
      cardTypeList: [
        {
          name: this.$t(`dashboard.running_workflow`),
          type: 'running_workflow',
          desc: this.$t(`dashboard.runningTip`),
          id: ''
        },
        // {
        //   name: '服务热力图',
        //   type: 'service_update_frequency',
        //   desc: '热力图方式显示服务被更新次数',
        //   id: ''
        // },
        {
          name: this.$t(`dashboard.my_workflow`),
          type: 'my_workflow',
          desc: this.$t(`dashboard.myWorkflowTip`),
          id: ''
        },
        {
          name: this.$t(`dashboard.my_env`),
          type: 'my_env',
          desc: this.$t(`dashboard.myEnvTip`),
          id: ''
        }
      ],
      isShowCardDialog: false,
      projectList: [],
      envList: [],
      serviceList: [],
      workflowList: [],
      intervalTimerList: []
    }
  },
  components: {
    draggable
  },
  created () {
    this.getSettings()
  },
  methods: {
    onStart (val) {
      this.drag = true
    },
    onEnd () {
      this.drag = false
      this.updateSettings(this.info)
    },
    operateCard (item) {
      const obj = {
        id: v4(),
        type: item.type,
        name: item.name
      }
      this.info.cards.push(obj)
      this.updateSettings(this.info)
      this.isShowCardDialog = false
    },
    handleProjectChange () {
      this.curInfo.config.env_name = ''
      this.curInfo.config.service_modules = []
      this.getEnvList()
    },
    handleEnvChange () {
      this.curInfo.config.service_modules = []
      this.getServiceList()
    },
    getSettings () {
      this.clearInterval()
      getDashboardSettingsAPI().then(res => {
        this.info = res
        this.info.cards.forEach(item => {
          if (!item.id) {
            item.id = v4()
          }
          if (item.type === 'running_workflow') {
            this.getRunningWorkflow(item)
          }
          if (item.type === 'my_workflow') {
            this.getMyWorkflow(item)
          }
          if (item.type === 'my_env') {
            if (!item.config || !item.config.project_name) return
            this.getMyEnv(item)
          }
        })
      })
    },
    updateSettings (payload) {
      updateDashboardSettingsAPI(payload).then(res => {
        this.getSettings()
      })
    },
    getMyWorkflow (item) {
      this.workflowTimer = window.setInterval(() => {
        getMyWorkflowAPI(item.id).then(res => {
          this.$set(item, 'workflow_list', res)
        })
      }, 1500)
      this.intervalTimerList.push(this.workflowTimer)
    },
    getRunningWorkflow (item) {
      this.runningWorkflowTimer = window.setInterval(() => {
        getRunningWorkflowAPI().then(res => {
          this.$set(item, 'workflow_list', res)
        })
      }, 2800)
      this.intervalTimerList.push(this.runningWorkflowTimer)
    },
    getMyEnv (item) {
      this.envTimer = window.setInterval(() => {
        getMyEnvAPI(
          item.config.env_name || item.config.name,
          item.config.project_name
        ).then(res => {
          this.$set(item, 'config', res)
          this.$set(item.config, 'project_name', res.project_name)
          this.$set(item, 'services', res.services)
          this.$set(item, 'vm_services', res.vm_services)
        })
      }, 2000)
      this.intervalTimerList.push(this.envTimer)
    },
    getProjectList () {
      getProjectsAPI().then(res => {
        this.projectList = res
      })
    },
    getEnvList () {
      getEnvironmentsAPI(this.curInfo.config.project_name).then(res => {
        this.envList = res
      })
    },
    getServiceList () {
      if (!this.curInfo.config.project_name || !this.curInfo.config.env_name) {
        return
      }
      const type = this.deployType(this.curInfo.config.project_name) || this.curInfo.config.env_type
      productServicesAPI(
        this.curInfo.config.project_name,
        this.curInfo.config.env_name,
        type
      ).then(res => {
        if (type === 'helm' || type === 'external') {
          this.serviceList = res.data.services
        } else {
          this.serviceList = res.data
        }
      })
    },
    getWorkflowList () {
      getMyWorkflowsAPI(
        this.curInfo.config.project_name,
        this.curInfo.config.env_name
      ).then(res => {
        this.workflowList = res.map(item => {
          return {
            name: item.name,
            display_name: item.display_name,
            project_name: item.projectName
          }
        })
      })
    },
    handleCommand (val, item, index) {
      if (val === 'delete') {
        this.$confirm(
          this.$t('dashboard.confirmDelCard', {
            name: this.$t(`dashboard.${item.type}`)
          }),
          this.$t(`global.confirmation`),
          {
            confirmButtonText: this.$t(`global.confirm`),
            cancelButtonText: this.$t(`global.cancel`),
            type: 'warning'
          }
        ).then(() => {
          const params = cloneDeep(this.info)
          params.cards.splice(index, 1)
          updateDashboardSettingsAPI(params).then(() => {
            this.$message.success(this.$t(`dashboard.delSuccess`))
            this.getSettings()
          })
        })
      } else {
        this.info.cards.forEach(item => { item.show = false })
        if (item.type === 'my_env') {
          if (item.config) {
            this.curInfo.config.project_name = item.config
              ? item.config.project_name
              : ''
            this.curInfo.config.env_name = item.config
              ? item.config.env_name || item.config.name
              : ''
            this.getEnvList()
            this.curInfo.config.service_modules = item.config
              ? item.config.services || item.vm_services
              : []
            this.curInfo.config.env_type = item.config.env_type
            this.getServiceList()
          }
        }
        if (item.type === 'my_workflow') {
          this.getWorkflowList()
          this.$set(this.curInfo.config, 'workflow_list', item.workflow_list)
        }
        this.$set(item, 'show', true)
      }
    },
    goWorkflow (item, triggerRun, type) {
      if (type === 'my_workflow') {
        // jump list
        if (
          item.workflow_type === 'common_workflow' ||
          item.workflow_type === 'release'
        ) {
          const url = this.$router.resolve(
            `/v1/projects/detail/${item.project}/pipelines/custom/${item.name}?display_name=${item.display_name}&formDashboad=${triggerRun}`
          )
          window.open(url.href, '_blank')
        } else {
          // product
          const url = this.$router.resolve(
            `/v1/projects/detail/${item.project}/pipelines/multi/${item.name}?display_name=${item.display_name}&formDashboad=${triggerRun}`
          )
          window.open(url.href, '_blank')
        }
      } else if (type === 'running_workflow') {
        // jump detail
        if (
          item.workflow_type === 'common_workflow' ||
          item.workflow_type === 'release'
        ) {
          const url = this.$router.resolve(
            `/v1/projects/detail/${item.project}/pipelines/custom/${item.name}/${item.task_id}?status=${item.status}&display_name=${item.display_name}`
          )
          window.open(url.href, '_blank')
        } else {
          // product
          const url = this.$router.resolve(
            `/v1/projects/detail/${item.project}/pipelines/multi/${item.name}/${item.task_id}?status=${item.status}&display_name=${item.display_name}`
          )
          window.open(url.href, '_blank')
        }
      }
    },
    goService (scope, config) {
      return `/v1/projects/detail/${config.project_name}/envs/detail/${scope.row.service_name}?envName=${config.name}&projectName=${config.project_name}&clusterId=${config.cluster_id}`
    },
    getProdStatus (status) {
      return translateEnvStatus(status, false)
    },
    deployType (projectName) {
      const project = this.projectList.find(
        project => project.name === projectName
      )
      return project ? project.deployType : ''
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
    setPmRoute (scope, config) {
      if (typeof config.name === 'undefined') {
        return `/v1/projects/detail/${config.project_name}/envs/detail/${scope.row.service_name}/pm?projectName=${config.project_name}&clusterId=${config.clusterId}`
      } else {
        return `/v1/projects/detail/${config.project_name}/envs/detail/${scope.row.service_name}/pm?envName=${config.name}&projectName=${config.project_name}&clusterId=${config.clusterId}`
      }
    },
    cancel (item) {
      this.$set(item, 'show', false)
    },
    save (item) {
      if (item.type === 'my_workflow') {
        item.config = item.config || {}
        const list = this.curInfo.config.workflow_list.map(item => {
          return {
            name: item.name,
            project_name: item.project_name || item.project
          }
        })
        this.$set(item.config, 'workflow_list', list)
        delete item.workflow_list
        delete item.show
      } else {
        const service_modules = this.curInfo.config.service_modules.map(
          item => item.service_name
        )
        item.config = {
          env_type:
            this.curInfo.config.env_type ||
            this.deployType(this.curInfo.config.project_name),
          env_name: this.curInfo.config.env_name,
          project_name: this.curInfo.config.project_name,
          service_modules: service_modules
        }
        delete item.show
        delete item.services
      }
      this.curInfo.config = {}
      this.updateSettings(this.info)
    },
    clearInterval () {
      this.intervalTimerList.forEach(item => {
        clearInterval(item)
      })
    }
  },
  mounted () {
    this.getProjectList()
    bus.$emit('set-topbar-title', {
      title: this.$t(`sidebarMenu.dashboard`),
      breadcrumb: [
        { title: this.$t(`sidebarMenu.dashboard`), url: '/v1/dashboadd' }
      ]
    })
  },
  beforeDestroy () {
    this.clearInterval()
  }
}
</script>
<style lang="less" scoped>
.dashboard {
  // width: 100%;
  height: 100%;
  padding: 8px 16px;
  overflow-y: auto;

  .header {
    display: flex;
    justify-content: flex-end;
    margin: 8px 0;

    &-search {
      width: 220px;
    }

    &-btn {
      padding: 10px 15px;
      color: #06f;
      font-weight: 400;
      font-size: 14px;
      background-color: #fff;
      border: 1px solid #06f;
      border-radius: 4px;
      cursor: pointer;
    }
  }

  .no-running {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;

    img {
      width: 400px;
      height: 400px;
    }

    p {
      color: #606266;
      font-size: 15px;
    }
  }

  .main {
    width: 100%;

    .wrap {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;

      .item {
        box-sizing: border-box;
        width: 49%;
        margin: 8px 0;

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 30px;
        }

        /deep/.el-card__header {
          padding: 0 20px;
        }
      }

      .table {
        width: 100%;
        min-height: 260px;
        max-height: 300px;
        overflow-y: auto;

        .status {
          margin-right: 2px;
          font-size: 20px;
          vertical-align: -3px;
        }

        .name {
          color: @themeColor;
          cursor: pointer;
        }
      }

      .env-tip {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 12px;

        .desc {
          color: @fontLightGray;
        }
      }
    }
  }

  .card-dialog {
    .card {
      margin: 8px;
      cursor: pointer;

      .type {
        &-title {
          display: inline-block;
          width: 10em;
          color: @primaryColor;
          font-size: 18px;
        }

        &-desc {
          color: @fontLightGray;
          font-size: 14px;
        }
      }
    }
  }
}
</style>
