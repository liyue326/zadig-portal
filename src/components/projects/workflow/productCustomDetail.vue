<template>
  <div class="workflow-detail">
    <el-card class="workflow-basic-info">
      <el-button
        type="primary"
        v-if="checkPermissionSyncMixin({projectName: projectName, action: 'run_workflow',resource:{name:workflowName,type:'workflow'}})"
        effect="dark"
        @click="startTask(workflow)"
        class="left"
      >
        <span class="iconfont iconzhixing">&nbsp;{{$t(`workflow.run`)}}</span>
      </el-button>
      <el-tooltip v-else effect="dark" :content="$t(`permission.lackPermission`)" placement="top">
        <el-button type="primary" effect="dark" class="left permission-disabled">
          <span class="iconfont iconzhixing">&nbsp;{{$t(`workflow.run`)}}</span>
        </el-button>
      </el-tooltip>
      <template v-if="detail.category === 'release'">
        <router-link
          v-if="checkPermissionSyncMixin({projectName: projectName, action: 'edit_workflow',resource:{name:workflowName,type:'workflow'}})"
          :to="`/v1/projects/detail/${projectName}/pipelines/release/edit/${workflowName}?projectName=${projectName}&display_name=${displayName}`"
          class="middle"
        >
          <span class="iconfont icondeploy edit-setting"></span>
        </router-link>
        <el-tooltip v-else effect="dark" :content="$t(`permission.lackPermission`)" placement="top">
          <span class="middle">
            <span class="permission-disabled iconfont icondeploy edit-setting"></span>
          </span>
        </el-tooltip>
      </template>
      <template v-else>
        <router-link
          v-if="checkPermissionSyncMixin({projectName: projectName, action: 'edit_workflow',resource:{name:workflowName,type:'workflow'}})"
          :to="`/v1/projects/detail/${projectName}/pipelines/custom/edit/${workflowName}?projectName=${projectName}&display_name=${displayName}`"
          class="middle"
        >
          <span class="iconfont icondeploy edit-setting"></span>
        </router-link>
        <el-tooltip v-else effect="dark" :content="$t(`permission.lackPermission`)" placement="top">
          <span class="middle">
            <span class="permission-disabled iconfont icondeploy edit-setting"></span>
          </span>
        </el-tooltip>
      </template>
      <div class="right">
        <CusTags :values="stages" class="item" noLimit />
        <span class="item">
          <span class="item left">{{$t('workflow.updateBy')}}</span>
          {{ detail.updated_by }}
        </span>
        <span class="item">
          <span class="item left">{{$t('workflow.lastModify')}}</span>
          {{ $utils.convertTimestamp(detail.update_time) }}
        </span>
      </div>
    </el-card>

    <el-card class="box-card full" :body-style="{ padding: '0px', margin: '15px 0 30px 0' }">
      <div slot="header" class="block-title">
        <span>
          <i class="iconfont iconhistory title-icon"></i>{{$t('workflow.historyTask')}}
        </span>
        <!-- <FilterStatus
          ref="filterStatusRef"
          :filteredItems="filteredItems"
          :defaultFilterList="defaultFilterList"
          :getFilterList="getFilterList"
          @updateFilter="updateFilter"
        />-->
      </div>
      <TaskList
        :taskList="workflowTasks"
        :total="total"
        :pageSize="pageSize"
        :currentPage="currentPage"
        :projectName="projectName"
        :displayName="displayName"
        :baseUrl="`/v1/projects/detail/${projectName}/pipelines/custom/${workflowName}`"
        :workflowName="workflowName"
        :functionTestBaseUrl="`/v1/projects/detail/${projectName}/pipelines/multi/testcase/${workflowName}`"
        @cloneTask="rerun"
        @currentChange="changeTaskPage"
        workflowType="buildv4"
        showOperation
      />
    </el-card>

    <el-dialog :visible.sync="taskDialogVisible" :title="$t(`workflow.runWorkflow`)" custom-class="run-workflow" width="60%" class="dialog" :before-close="close">
      <RunCustomWorkflow
        v-if="taskDialogVisible"
        :workflowName="workflowName"
        :displayName="displayName"
        :projectName="projectName"
        :cloneWorkflow="cloneWorkflow"
        @success="hideAndFetchHistory"
      />
    </el-dialog>
  </div>
</template>

<script>
import {
  getCustomWorkflowTaskListAPI,
  getWorkflowFilterListAPI,
  getCustomWorkflowDetailAPI
} from '@api'
import RunCustomWorkflow from '../workflow/common/runCustomWorkflow'
import FilterStatus from './productTaskDetail/filterStatus.vue'
import TaskList from '@/components/projects/common/taskList.vue'
import bus from '@utils/eventBus'
import jsyaml from 'js-yaml'

export default {
  data () {
    this.filterInfo = { type: '', list: '' }
    return {
      filteredItems: [
        {
          value: 'creator',
          text: '执行人'
        },
        {
          value: 'serviceName',
          text: '服务名称'
        },
        {
          value: 'committer',
          text: 'committer'
        },
        {
          value: 'taskStatus',
          text: '状态'
        }
      ],
      defaultFilterList: {
        taskStatus: [
          { text: '失败', value: 'failed' },
          { text: '成功', value: 'passed' },
          { text: '超时', value: 'timeout' },
          { text: '取消', value: 'cancelled' }
        ]
      },
      workflow: {},
      cloneWorkflow: {},
      detail: {},
      workflowTasks: [],
      total: 0,
      pageSize: 50,
      taskDialogVisible: false,
      durationSet: {},
      forcedUserInput: {},
      pageStart: 1,
      currentPage: 1,
      timerId: null,
      timeTimeoutFinishFlag: false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    workflowName () {
      return this.$route.params.workflow_name
    },
    displayName () {
      return this.$route.query.display_name
    },
    stages () {
      if (this.detail.stages && this.detail.stages.length > 0) {
        return this.detail.stages.map(item => {
          return item.name
        })
      } else {
        return []
      }
    }
  },
  methods: {
    async refreshHistoryTask () {
      await this.fetchHistory(this.pageStart, this.pageSize)
      if (!this.timeTimeoutFinishFlag) {
        this.timerId = setTimeout(this.refreshHistoryTask, 3000) // 保证内存中只有一个定时器
      }
    },
    fetchHistory (start, max) {
      getCustomWorkflowTaskListAPI(
        this.workflowName,
        start,
        max,
        this.projectName
      ).then(res => {
        this.workflowTasks = res.workflow_list
        this.total = res.total
      })
    },
    changeTaskPage (val) {
      this.pageStart = val
      this.currentPage = val
      this.fetchHistory(val, this.pageSize)
    },
    hideAndFetchHistory () {
      this.taskDialogVisible = false
      this.fetchHistory(1, this.pageSize)
    },

    startTask () {
      this.taskDialogVisible = true
      this.forcedUserInput = {}
    },
    rerun (task) {
      this.cloneWorkflow = task
      this.taskDialogVisible = true
      this.forcedUserInput = task.workflow_args
    },
    getFilterList ({ type }) {
      return getWorkflowFilterListAPI(this.projectName, this.workflowName, type)
        .then(res => {
          return res
        })
        .catch(err => {
          console.log(err)
          return []
        })
    },
    updateFilter ({ type, list }) {
      this.filterInfo = {
        type,
        list: list.map(li => li.value || li).join(',')
      }
      this.currentPage = 1
      this.pageStart = 0
      this.fetchHistory(this.pageStart, this.pageSize)
    },
    getCustomWorkflowDetail () {
      getCustomWorkflowDetailAPI(this.workflowName, this.projectName).then(
        res => {
          this.detail = jsyaml.load(res)
        }
      )
    },
    close () {
      this.cloneWorkflow = {}
      this.taskDialogVisible = false
    }
  },
  beforeDestroy () {
    this.timeTimeoutFinishFlag = true
    clearTimeout(this.timerId)
  },
  mounted () {
    if (JSON.parse(this.$route.query.formDashboad)) {
      this.startTask()
    }
    this.refreshHistoryTask()
    this.getCustomWorkflowDetail()
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        { title: this.$t(`global.project`), url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        {
          title: this.$t(`global.workflow`),
          url: `/v1/projects/detail/${this.projectName}/pipelines`
        },
        { title: this.displayName || this.workflowName, url: '' }
      ]
    })
  },
  components: {
    RunCustomWorkflow,
    FilterStatus,
    TaskList
  }
}
</script>

<style lang="less">
.workflow-detail {
  position: relative;
  height: 100%;
  padding: 24px 30px 0;
  overflow: auto;
  font-size: 13px;
  background-color: #fff;

  .workflow-basic-info {
    margin-bottom: 16px;
    box-shadow: unset;

    .el-card__body {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 80px;
      padding: 0 24px;
      color: #4a4a4a;

      .left,
      .middle {
        flex: 0 0 auto;
      }

      .right {
        flex: 1 0 auto;
        text-align: right;
      }

      .middle {
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
    display: flex;
    align-items: center;
    color: @projectNameColor;
    font-weight: 300;
    font-size: 16px;
    line-height: 22px;

    .title-icon {
      margin-right: 8px;
      color: @fontLightGray;
      font-size: 18px;
    }
  }

  .box-card {
    width: 600px;
    background-color: #fff;

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 20px;
    }
  }

  .box-card,
  .box-card-stack {
    // margin-top: 15px;
    border: none;
    box-shadow: none;
  }

  .wide {
    width: 65%;
  }

  .el-card__header {
    padding-left: 0;
    border-bottom-width: 0;
  }

  .full {
    width: 100%;

    .el-card__header {
      padding: 16px 0 6px;
    }
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
