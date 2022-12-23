<template>
  <div class="dashboard">
    <div class="header">
      <el-input placeholder="搜索" class="header-search"></el-input>
      <el-button class="header-btn" type="primary" @click="isShowCardDialog=true">添加卡片</el-button>
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
                <el-table-column prop="name" label="工作流名称" width="180"></el-table-column>
                <el-table-column prop="creator" label="执行人" width="180"></el-table-column>
                <el-table-column prop="time" label="创建时间"></el-table-column>
              </el-table>
              <div v-if="!item.show&&item.type==='my_env'">
                <div>
                  <span>{{item.config.env_name}}({{item.config.project_name}})</span>
                  <span>
                    最后一次变更
                    <span>人 时间</span>
                  </span>
                </div>
                <el-table :data="item.service_modules" style="width: 100%;">
                  <el-table-column prop="name" label="服务名称" width="180"></el-table-column>
                  <el-table-column prop="creator" label="运行状态" width="180"></el-table-column>
                  <el-table-column prop="time" label="镜像信息"></el-table-column>
                </el-table>
              </div>
              <div v-if="item.show">
                <div v-if="item.type==='my_workflow'">
                  <el-select placeholder="选择工作流" v-model="curInfo.workflow_list" multiple>
                    <el-option v-for="item in item.workflow_list" :key="item.name">{{item.name}}</el-option>
                  </el-select>
                </div>
                <div v-if="item.type==='my_env'">
                  <el-select placeholder="选择项目" v-model="curInfo.config.project_name">
                    <el-option v-for="item in item.list" :key="item.name">{{item.name}}</el-option>
                  </el-select>
                  <el-select placeholder="选择环境" v-model="curInfo.config.env_name">
                    <el-option v-for="item in item.list" :key="item.name">{{item.name}}</el-option>
                  </el-select>
                  <el-select placeholder="选择服务" v-model="curInfo.config.service_name" multiple>
                    <el-option v-for="item in item.list" :key="item.name">{{item.name}}</el-option>
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

import {
  addDashboardSettingsAPI,
  updateDashboardSettingsAPI,
  getDashboardSettingsAPI,
  getMyWorkflowAPI,
  getRunningWorkflowAPI
} from '@api'
export default {
  name: 'Dashboard',
  data () {
    return {
      info: {
        cards: [
          {
            type: 'running_workflow', // 正在运行的工作流
            name: '运行中',
            id: 3
          },
          {
            name: 'my_workflow', // 我的工作流
            type: 'my_workflow',
            id: 1,
            config: {
              workflow_list: [
                {
                  name: 'workflow_1',
                  project: 'project_1'
                }
              ]
            }
          },
          {
            name: 'my_env', // 我的环境列表
            type: 'my_env',
            id: 2,
            config: {
              env_name: 'env-1', // 环境名称
              project_name: 'project_1' // 项目名称
            }
          }
        ]
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
          id: Math.random()
        },
        {
          name: '服务热力图',
          type: 'service_update_frequency',
          desc: '热力图方式显示服务被更新次数',
          id: Math.random()
        },
        {
          name: '我的工作流',
          type: 'my_workflow',
          desc: '显示个人关注的工作流列表',
          id: Math.random()
        },
        {
          name: '我的环境',
          type: 'my_env',
          desc: '显示个人关注的环境及服务信息',
          id: Math.random()
        }
      ],
      isShowCardDialog: false
    }
  },
  components: {
    draggable
  },
  // created () {},
  methods: {
    onStart (val) {
      this.drag = true
    },
    onEnd () {
      this.drag = false
    },
    operateCard (item) {
      const obj = {
        list: [],
        ...item
      }
      this.info.cards.push(obj)
      this.addSettings(this.info)
      this.isShowCardDialog = false
    },
    getSettings () {
      getDashboardSettingsAPI().then(res => {
        this.info = res
        this.info.cards.forEach(item => {
          if (item.type === 'running_workflow') {
            this.getRunningWorkflow(item.workflow_list)
          }
          if (item.type === 'my_workflow') {
            this.getMyWorkflow(item.workflow_list)
          }
          if (item.type === 'my_env') {
            this.getMyEnv(item.service_modules)
          }
        })
      })
    },
    addSettings (payload) {
      addDashboardSettingsAPI(payload).then(res => {
        this.info = res
      })
    },
    updateSettings (payload) {
      updateDashboardSettingsAPI(payload).then(res => {
        this.info = res
      })
    },
    getMyWorkflow (list) {
      getMyWorkflowAPI().then(res => {
        console.log(res)
        list = res
      })
    },
    getRunningWorkflow (list) {
      getRunningWorkflowAPI().then(res => {
        console.log(res)
        list = res
      })
    },
    getProject () {
      getRunningWorkflowAPI().then(res => {
        console.log(res)
      })
    },
    getMyEnv (list) {
      getRunningWorkflowAPI().then(res => {
        console.log(res)
        list = res
      })
    },
    getService () {
      getRunningWorkflowAPI().then(res => {
        console.log(res)
      })
    },
    handleCommand (val, item, index) {
      if (val === 'delete') {
        this.$confirm(`确定删除 [${item.name}] 卡片吗`, '确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          const params = cloneDeep(this.info.cards)
          params.splice(index, 1)
          updateDashboardSettingsAPI(params).then(() => {
            this.$message.success('删除成功')
            this.getSettings()
          })
        })
      } else {
        console.log(item)
        this.$set(item, 'show', true)
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
      this.$set(item, 'show', false)
    }
  }
}
</script>
<style lang="less" scoped>
.dashboard {
  // width: 100%;
  height: 100%;
  padding: 20px;
  // overflow-x: hidden;
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
