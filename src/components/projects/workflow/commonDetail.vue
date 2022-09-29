<template>
  <div class="common-workflow-detail">
    <el-card class="workflow-basic-info">
      <el-button
        type="primary"
        v-hasPermi="{projectName: projectName, action: 'run_workflow',resource:{name:workflowName,type:'workflow'},isBtn:true}"
        effect="dark"
        @click="startTask"
        class="left"
      >
        <span class="iconfont iconzhixing">&nbsp;执行</span>
      </el-button>
      <router-link
        v-if="checkPermissionSyncMixin({projectName: projectName, action: 'edit_workflow'})"
        :to="`/workflows/common/edit/${workflowName}?projectName=${projectName}&id=${workflowID}`"
        class="middle"
      >
        <span class="iconfont icondeploy edit-setting"></span>
      </router-link>
      <el-tooltip v-else effect="dark" content="无权限操作" placement="top">
        <span class="middle">
          <span class="permission-disabled iconfont icondeploy edit-setting"></span>
        </span>
      </el-tooltip>
      <div class="right">
        <CusTags :values="stages" class="item"></CusTags>
        <span class="item">
          <span class="item left">修改人</span>
          {{ workflow.update_by || '*' }}
        </span>
        <span class="item">
          <span class="item left">更新时间</span>
          {{ $utils.convertTimestamp(workflow.update_time) }}
        </span>
      </div>
    </el-card>

    <el-card class="box-card full" :body-style="{ padding: '0px', margin: '15px 0 30px 0' }">
      <div slot="header" class="block-title">历史任务</div>
      <TaskList
        :taskList="workflowTasks"
        :total="total"
        :pageSize="pageSize"
        :projectName="projectName"
        :baseUrl="`/v1/projects/detail/${projectName}/pipelines/common/${workflowName}`"
        :workflowName="workflowName"
        :workflowID="workflowID"
        @currentChange="changeTaskPage"
      ></TaskList>
    </el-card>

    <el-dialog :visible.sync="taskDialogVisible" title="运行 通用-工作流" custom-class="run-workflow" width="60%" class="dialog">
      <RunCustomWorkflow
        v-if="taskDialogVisible"
        :workflowName="workflowName"
        :projectName="projectName"
        @success="hideAfterSuccess"
      />
    </el-dialog>
  </div>
</template>

<script>
import {
  getCommonWorkflowAPI,
  deleteCommonWorkflowAPI,
  getCustomWorkflowTaskListAPI,
  getCommonWorkflowListInProjectAPI
} from '@api'
import TaskList from '@/components/projects/common/taskList.vue'
import RunCommonWorkflow from './common/runCommonWorkflow.vue'
import RunCustomWorkflow from './common/runCustomWorkflow'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      workflow: {},
      workflowTasks: [],
      total: 0,
      pageSize: 50,
      taskDialogVisible: false,
      durationSet: {},
      pageStart: 1,
      timerId: null,
      timeTimeoutFinishFlag: false,
      commonToRun: {},
      stages: [],
      usedInPolicy: [] // whether used in policy
    }
  },
  computed: {
    workflowName () {
      return this.$route.params.workflow_name
    },
    workflowID () {
      return this.$route.query.id
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    async autoRefreshHistoryTask () {
      const workflowName = this.$route.params.workflow_name
      const pageStart = this.pageStart
      const pageSize = this.pageSize
      const res = await getCustomWorkflowTaskListAPI(
        workflowName,
        pageStart,
        pageSize,
        this.projectName
      )
      this.workflowTasks = res.workflow_list
      this.total = res.total
      if (!this.timeTimeoutFinishFlag) {
        this.timerId = setTimeout(this.autoRefreshHistoryTask, 3000) // Keep only one timer
      }
    },
    getCommonWorkflowTasks (start, max) {
      const workflowName = this.workflowName
      getCustomWorkflowTaskListAPI(workflowName, start, max, this.projectName).then(
        res => {
          this.workflowTasks = res.workflow_list
          this.total = res.total
        }
      )
      this.workflowTasks = res.workflow_list
      this.total = res.total
    },
    changeTaskPage (val) {
      const start = (val - 1) * this.pageSize
      this.pageStart = start
      this.getCommonWorkflowTasks(start, this.pageSize)
    },
    startTask () {
      this.taskDialogVisible = true
      this.forcedUserInput = {}
      this.commonToRun = {
        project_name: this.projectName,
        id: this.workflowID
      }
    },
    removeWorkflow () {
      const workflowName = this.workflowName
      const workflowID = this.workflowID
      const projectName = this.projectName
      if (this.usedInPolicy.length) {
        this.$alert(`工作流 ${workflowName} 已在协作模式 ${this.usedInPolicy.join('、')} 中被定义为基准工作流，如需删除请先修改协作模式！`, '删除工作流', {
          confirmButtonText: '确定',
          type: 'warning'
        })
        return
      }
      this.$prompt('输入工作流名称确认', '删除工作流 ' + workflowName, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button el-button--danger',
        inputValidator: input => {
          if (input === workflowName) {
            return true
          } else if (input === '') {
            return '请输入工作流名称'
          } else {
            return '名称不相符'
          }
        }
      }).then(({ value }) => {
        deleteCommonWorkflowAPI(projectName, workflowID).then(() => {
          this.$message.success('删除成功')
          this.$router.push(`/v1/projects/detail/${this.projectName}/pipelines`)
        })
      })
    },
    rerun (task) {
      this.taskDialogVisible = true
      this.forcedUserInput = task.workflow_args
    },
    fetchStages (workflow) {
      if (!workflow.sub_tasks) {
        return
      }
      const stages = []
      if (workflow.sub_tasks.find(item => item.type === 'buildv3')) {
        stages.push('构建')
      }
      if (workflow.sub_tasks.find(item => item.type === 'trigger')) {
        stages.push('扩展')
      }
      this.stages = stages
    },
    async getWorkflow () {
      const res = await getCommonWorkflowListInProjectAPI(this.projectName).catch(err => {
        console.log(err)
      })
      if (res) {
        this.usedInPolicy = res.workflow_list.find(re => re.name === this.workflowName).base_refs || []
      }
    },
    hideAfterSuccess () {
      this.taskDialogVisible = false
    }
  },
  beforeDestroy () {
    this.timeTimeoutFinishFlag = true
    clearTimeout(this.timerId)
  },
  mounted () {
    const projectName = this.projectName
    const workflowID = this.workflowID
    const workflowName = this.workflowName
    this.getWorkflow()
    getCommonWorkflowAPI(projectName, workflowID).then(res => {
      this.workflow = res
      this.fetchStages(res)
    })
    this.autoRefreshHistoryTask()
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        { title: '项目', url: '/v1/projects' },
        {
          title: projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${projectName}`
        },
        {
          title: '工作流',
          url: `/v1/projects/detail/${projectName}/pipelines`
        },
        { title: workflowName, url: '' }
      ]
    })
  },
  components: {
    RunCommonWorkflow,
    RunCustomWorkflow,
    TaskList
  }
}
</script>

<style lang="less">
.common-workflow-detail {
  position: relative;
  flex: 1;
  padding: 24px 30px 0;
  overflow: auto;
  font-size: 13px;
  background-color: #fff;

  .workflow-basic-info {
    margin-bottom: 26px;
    box-shadow: unset;

    .el-card__body {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 80px;
      padding: 0 24px;
      color: #4a4a4a;

      .left,
      .right {
        flex: 0 0 auto;
      }

      .middle {
        flex: 1 1 auto;
        margin-left: 18px;
        color: @fontGray;

        .edit-setting {
          display: inline-block;
          padding: 8px;
          font-size: 20px;
          border: 1px solid @borderGray;
          border-radius: 5px;

          &:hover {
            box-shadow: 0 0 2px @borderGray;
          }
        }
      }

      .item {
        display: inline-block;

        &:not(:last-child) {
          margin-right: 18px;
        }

        &.left {
          margin-right: 3px;
          color: @fontLightGray;
        }
      }
    }
  }

  .block-title {
    color: #999;
    font-size: 16px;
    line-height: 20px;
  }

  .box-card {
    width: 600px;
    margin-top: 15px;
    background-color: #fff;
    border: none;
    box-shadow: none;
  }

  .full {
    width: 100%;
  }

  .el-card__header {
    padding-left: 0;
  }

  .el-row {
    margin-bottom: 15px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .pipeline-edit {
    .el-dialog__body {
      padding: 15px 20px;

      .el-form {
        .el-form-item {
          margin-bottom: 15px;
        }
      }
    }
  }

  .fileTree-dialog {
    .el-dialog__body {
      padding: 0 5px;
    }
  }

  .buildv2-edit-form {
    .el-form-item__label {
      padding: 0;
      font-size: 13px;
      line-height: 25px;
    }
  }

  .not-anchor {
    color: unset;
  }

  .run-workflow {
    .el-dialog__body {
      padding: 8px 10px;
      color: #606266;
      font-size: 14px;
    }
  }
}
</style>
