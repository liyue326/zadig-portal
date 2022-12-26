<template>
  <div class="dashboard">
    <div class="header">
      <!-- <el-input placeholder="搜索" size="small" class="header-search"></el-input> -->
      <el-button class="header-btn" size="small" type="primary" @click="isShowCardDialog=true">添加卡片</el-button>
    </div>
    <div class="main">
      <draggable v-model="info.cards" group="people" @start="onStart" @end="onEnd">
        <transition-group class="wrap">
          <el-card v-for="(item,index) in info.cards" :key="item.id" class="item">
            <div slot="header" class="clearfix">
              <span>{{item.name}}</span>
              <el-dropdown style="float: right;" @command="handleCommand($event, item,index)">
                <span class="el-dropdown-link">
                  <el-button type="text">
                    操作
                    <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="edit" v-if="item.type==='my_workflow'||item.type==='my_env'">编辑</el-dropdown-item>
                  <el-dropdown-item command="delete">删除</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <div>
              <el-table
                :data="item.workflow_list"
                style="width: 100%;"
                v-if="!item.show&&item.type==='my_workflow'||!item.show&&item.type==='running_workflow'"
              >
                <el-table-column prop="name" label="工作流名称" width="150">
                  <template slot-scope="scope">
                    <span :class="[`status-${$utils.taskElTagType(scope.row.status)}`]">•</span>
                    <el-tooltip effect="dark" :content="scope.row.name" placement="top">
                      <span class="name" @click="goWorkflow(scope.row, false)">{{$utils.tailCut( scope.row.name,16)}}</span>
                    </el-tooltip>
                  </template>
                </el-table-column>
                <el-table-column prop="creator" label="执行人" width="100"></el-table-column>
                <el-table-column prop="time" label="创建时间">
                  <template slot-scope="scope">
                    <span>{{ $utils.convertTimestamp(scope.row.start_time)}}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="time" label="执行" v-if="item.type==='my_workflow'">
                  <template slot-scope="scope">
                    <el-button size="small" type="text" @click="goWorkflow(scope.row,true)">Run</el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div v-if="!item.show&&item.type==='my_env'">
                <div class="env-tip" v-if="item.config">
                  <span>
                    {{item.config.env_name}}
                    <span class="desc">({{item.config.project_name}})</span>
                  </span>
                  <span class="desc">
                    最后一次变更
                    <span>人 时间</span>
                  </span>
                </div>
                <el-table :data="item.service_modules" style="width: 100%;">
                  <el-table-column prop="name" label="服务名称" width="180"></el-table-column>
                  <el-table-column prop="creator" label="运行状态" width="180">
                    <template slot-scope="scope">
                      <span :class="[`status-${$utils.taskElTagType(scope.row.status)}`]">{{ scope.row.status}}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="time" label="镜像信息"></el-table-column>
                </el-table>
              </div>
              <div v-if="item.show">
                <div v-if="item.type==='my_workflow'">
                  <el-select placeholder="选择工作流" v-model="curInfo.workflow_list" multiple>
                    <el-option v-for="item in workflowList" :key="item.name">{{item.name}}</el-option>
                  </el-select>
                </div>
                <div v-if="item.type==='my_env'">
                  <el-select placeholder="选择项目" class="mg-t8" size="small" v-model="curInfo.config.project_name" @change="getEnvList">
                    <el-option v-for="item in projectList" :key="item.name" :value="item.name">{{item.name}}</el-option>
                  </el-select>
                  <el-select placeholder="选择环境" class="mg-t8" size="small" v-model="curInfo.config.env_name" @change="getServiceList">
                    <el-option v-for="item in envList" :key="item.name" :value="item.name">{{item.name}}</el-option>
                  </el-select>
                  <el-select placeholder="选择服务" class="mg-t8" size="small" v-model="curInfo.config.service_name" multiple>
                    <el-option v-for="item in serviceList" :key="item.service_name" :value="item.service_name">{{item.service_name}}</el-option>
                  </el-select>
                </div>
                <div class="mg-t24">
                  <el-button type="primary" size="small" @click="save(item)">保存</el-button>
                  <el-button size="small" @click="cancel(item)">取消</el-button>
                </div>
              </div>
            </div>
          </el-card>
        </transition-group>
      </draggable>
    </div>
    <el-dialog title="添加卡片" :visible.sync="isShowCardDialog" width="60%" class="card-dialog">
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

import {
  updateDashboardSettingsAPI,
  getDashboardSettingsAPI,
  getMyWorkflowAPI,
  getRunningWorkflowAPI,
  getMyEnvAPI,
  getProjectsAPI,
  getEnvironmentsAPI,
  getEnvServicesAPI,
  getWorkflowBindAPI
} from '@api'
export default {
  name: 'Dashboard',
  data () {
    return {
      info: {
        cards: []
      },
      curInfo: {
        workflow_list: [],
        config: {
          project_name: '',
          env_name: '',
          service_name: []
        }
      },
      cardTypeList: [
        {
          name: '运行中的工作流',
          type: 'running_workflow',
          desc: '显示系统中运行中的工作流列表',
          id: ''
        },
        {
          name: '服务热力图',
          type: 'service_update_frequency',
          desc: '热力图方式显示服务被更新次数',
          id: ''
        },
        {
          name: '我的工作流',
          type: 'my_workflow',
          desc: '显示个人关注的工作流列表',
          id: ''
        },
        {
          name: '我的环境',
          type: 'my_env',
          desc: '显示个人关注的环境及服务信息',
          id: ''
        }
      ],
      isShowCardDialog: false,
      projectList: [],
      envList: [],
      serviceList: [],
      workflowList: []
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
    getSettings () {
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
            this.getMyWorkflow(item.workflow_list, item.id)
          }
          if (item.type === 'my_env') {
            this.getMyEnv(
              item.services,
              item.config.env_name,
              item.config.project_name
            )
          }
        })
      })
    },
    // addSettings (payload) {
    //   addDashboardSettingsAPI(payload).then(res => {
    //     this.info = res
    //   })
    // },
    updateSettings (payload) {
      updateDashboardSettingsAPI(payload).then(res => {
        // this.info = res
        this.getSettings()
      })
    },
    getMyWorkflow (list, id) {
      getMyWorkflowAPI(id)
        .then(res => {
          list = res
        })
        .closeWhenDestroy(this)
    },
    getRunningWorkflow (item) {
      getRunningWorkflowAPI()
        .then(res => {
          this.$set(item, 'workflow_list', res.data)
        })
        .closeWhenDestroy(this)
    },
    getMyEnv (list, name, projectName) {
      getMyEnvAPI(name, projectName)
        .then(res => {
          list = res
        })
        .closeWhenDestroy(this)
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
      getEnvServicesAPI(
        this.curInfo.config.project_name,
        this.curInfo.config.env_name
      ).then(res => {
        this.serviceList = res.data
      })
    },
    getWorkflowList () {
      getWorkflowBindAPI(
        this.curInfo.config.project_name,
        this.curInfo.config.env_name
      ).then(res => {
        this.serviceList = res
      })
    },
    handleCommand (val, item, index) {
      if (val === 'delete') {
        this.$confirm(`确定删除 [${item.name}] 卡片吗`, '确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          const params = cloneDeep(this.info)
          params.cards.splice(index, 1)
          updateDashboardSettingsAPI(params).then(() => {
            this.$message.success('删除成功')
            this.getSettings()
          })
        })
      } else {
        if (item.type === 'my_env') {
          this.getProjectList()
        }
        if (item.type === 'my_workflow') {
          this.getWorkflowList()
        }
        this.$set(item, 'show', true)
      }
    },
    goWorkflow (item, type) {
      if (item.workflow_type === 'common_workflow') {
        this.$router.push(
          `/v1/projects/detail/${item.projectName}/pipelines/custom/${item.name}?display_name=${item.display_name}&formDashboad=${type}`
        )
      } else {
        // product
        this.$router.push(
          `/v1/projects/detail/${item.projectName}/pipelines/multi/${item.name}?display_name=${item.display_name}&formDashboad=${type}`
        )
      }
    },
    cancel (item) {
      this.$set(item, 'show', false)
    },
    save (item) {
      if (item.type === 'my_workflow') {
        item.workflow_list = this.curInfo.workflow_list
      } else {
        item.config = this.curInfo.config
      }
      this.updateSettings(this.info)
      this.$set(item, 'show', false)
    }
  },
  mounted () {
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [{ title: '', url: '/v1/projects' }]
    })
  }
}
</script>
<style lang="less" scoped>
.dashboard {
  // width: 100%;
  height: 100%;
  padding: 20px;
  overflow-y: auto;

  .header {
    display: flex;
    justify-content: flex-end;
    margin: 8px 0;

    &-search {
      width: 220px;
    }

    &-btn {
      margin-left: 16px;
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
