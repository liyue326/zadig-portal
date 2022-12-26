<template>
  <WorkflowRow
    :workflowInfo="workflow"
    :displayName="workflow.display_name"
    :name="workflow.name"
    :isFavorite="workflow.isFavorite || false"
    :type="workflow.workflow_type?workflow.workflow_type:'workflow'"
    :projectName="workflow.projectName || workflow.project_name"
    :stages="stages"
    :recentTaskStatus="workflow.recentTask?workflow.recentTask.status:''"
    :recentSuccessID="workflow.recentSuccessfulTask?`#${workflow.recentSuccessfulTask.taskID}`:''"
    :avgRuntime="makeAvgRunTime(workflow)"
    :avgSuccessRate="makeAvgSuccessRate(workflow)"
    :recentSuccessLink="makeTaskDetailLink(workflow.projectName,workflow.recentSuccessfulTask,workflow.workflow_type)"
    :recentFailID="workflow.recentFailedTask?`#${workflow.recentFailedTask.taskID}`:''"
    :recentFailLink="makeTaskDetailLink(workflow.projectName,workflow.recentFailedTask,workflow.workflow_type)"
    :updateTime="$utils.convertTimestamp(workflow.update_time)"
    :description="workflow.description"
    @refreshWorkflow="refreshWorkflow"
  >
    <template v-if="workflow.workflow_type === 'common_workflow'||workflow.workflow_type === 'release'" slot="operations">
      <el-button
        type="primary"
        v-if="checkPermissionSyncMixin({projectName: workflow.projectName, action: 'run_workflow',resource:{type:'workflow',name:workflow.name}})"
        class="button-exec"
        @click="startCustomWorkflowBuild(workflow)"
      >
        <span class="iconfont iconzhixing">&nbsp;{{$t(`workflow.run`)}}</span>
      </el-button>
      <el-tooltip v-else effect="dark" :content="$t(`permission.lackPermission`)" placement="top">
        <el-button type="primary" class="button-exec permission-disabled">
          <span class="iconfont iconzhixing">&nbsp;{{$t(`workflow.run`)}}</span>
        </el-button>
      </el-tooltip>
      <template v-if="workflow.workflow_type === 'common_workflow'">
        <router-link
          v-if="checkPermissionSyncMixin({projectName: workflow.projectName, action: 'edit_workflow', resource:{type:'workflow',name:workflow.name}})"
          :to="`/v1/projects/detail/${workflow.projectName}/pipelines/custom/edit/${workflow.name}?projectName=${workflow.projectName}&display_name=${workflow.display_name}`"
        >
          <span class="menu-item iconfont icondeploy"></span>
        </router-link>
        <el-tooltip v-else effect="dark" :content="$t(`permission.lackPermission`)" placement="top">
          <span class="permission-disabled menu-item iconfont icondeploy"></span>
        </el-tooltip>
      </template>
      <template v-if="workflow.workflow_type === 'release'">
        <router-link
          v-if="checkPermissionSyncMixin({projectName: workflow.projectName, action: 'edit_workflow', resource:{type:'workflow',name:workflow.name}})"
          :to="`/v1/projects/detail/${workflow.projectName}/pipelines/release/edit/${workflow.name}?projectName=${workflow.projectName}&display_name=${workflow.display_name}`"
        >
          <span class="menu-item iconfont icondeploy"></span>
        </router-link>
        <el-tooltip v-else effect="dark" :content="$t(`permission.lackPermission`)" placement="top">
          <span class="permission-disabled menu-item iconfont icondeploy"></span>
        </el-tooltip>
      </template>
      <el-dropdown>
        <span class="el-dropdown-link">
          <i class="iconfont iconmorelist more-operation"></i>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            v-hasPermi="{projectName: workflow.projectName, action: 'delete_workflow',resource:{type:'workflow',name:workflow.name},isBtn:true}"
            @click.native="deleteCustomWorkflow(workflow)"
          >
            <span>{{$t(`global.delete`)}}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </template>
    <template v-else slot="operations">
      <el-button
        type="primary"
        v-if="checkPermissionSyncMixin({projectName: workflow.projectName, action: 'run_workflow',resource:{type:'workflow',name:workflow.name}})"
        class="button-exec"
        @click="startProductWorkflowBuild(workflow)"
      >
        <span class="iconfont iconzhixing">&nbsp;{{$t(`workflow.run`)}}</span>
      </el-button>
      <el-tooltip v-else effect="dark" :content="$t(`permission.lackPermission`)" placement="top">
        <el-button type="primary" class="button-exec permission-disabled">
          <span class="iconfont iconzhixing">&nbsp;{{$t(`workflow.run`)}}</span>
        </el-button>
      </el-tooltip>
      <router-link
        v-if="checkPermissionSyncMixin({projectName: workflow.projectName, action: 'edit_workflow',resource:{type:'workflow',name:workflow.name},isBtn: true})"
        :to="`/workflows/product/edit/${workflow.name}?projectName=${workflow.projectName}&display_name=${workflow.display_name}`"
      >
        <span class="menu-item iconfont icondeploy"></span>
      </router-link>
      <el-tooltip v-else effect="dark" :content="$t(`permission.lackPermission`)" placement="top">
        <span class="permission-disabled menu-item iconfont icondeploy"></span>
      </el-tooltip>
      <el-dropdown @visible-change="(status) => fnShowTimer(status, index, workflow)">
        <span class="el-dropdown-link">
          <i class="iconfont iconmorelist more-operation"></i>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            v-hasPermi="{projectName: workflow.projectName, action: 'edit_workflow',resource:{type:'workflow',name:workflow.name},isBtn:true}"
            @click.native="changeSchedule(workflow.projectName)"
          >
            <span>{{workflow.schedulerEnabled ? this.$t(`workflow.close`): this.$t(`workflow.open`)}} {{this.$t(`workflow.timer`)}}</span>
          </el-dropdown-item>
          <el-dropdown-item
            v-hasPermi="{projectName: workflow.projectName, action: 'create_workflow',resource:{type:'workflow',name:workflow.name},isBtn:true}"
            @click.native="copyProductWorkflow(workflow)"
          >
            <span>{{$t(`global.copy`)}}</span>
          </el-dropdown-item>
          <el-dropdown-item
            v-hasPermi="{projectName: workflow.projectName, action: 'delete_workflow',resource:{type:'workflow',name:workflow.name},isBtn:true}"
            @click.native="deleteProductWorkflow(workflow)"
          >
            <span>{{$t(`global.delete`)}}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <el-dialog :visible.sync="isShowCopyDialog" :title="$t(`workflow.copyWorkflow`)" width="40%">
        <el-form :model="copyWorkflowInfo" @submit.native.prevent ref="copyForm" :rules="rules" label-position="left" label-width="160px">
          <el-form-item :label="$t(`workflow.newWorkflowName`)" prop="display_name">
            <el-input v-model="copyWorkflowInfo.display_name" :placeholder="$t(`workflow.newWorkflowName`)" size="small"></el-input>
          </el-form-item>
          <el-form-item :label="$t(`workflow.newWorkflowID`)" prop="name">
            <el-input v-model="copyWorkflowInfo.name" :disabled="!editProjectName" :placeholder="$t(`workflow.newWorkflowID`)" size="small" class="name"></el-input>
            <span @click="editProjectName = editProjectName ? false : true" class="edit-btn">
              <i :class="[editProjectName ? 'el-icon-finished' : 'el-icon-edit-outline']"></i>
            </span>
          </el-form-item>
        </el-form>
        <span slot="footer">
          <el-button type="primary" size="small" @click="submitForm('copyForm')">{{$t(`global.confirm`)}}</el-button>
          <el-button size="small" @click="resetForm('copyForm')">{{$t(`global.cancel`)}}</el-button>
        </span>
      </el-dialog>
    </template>
  </WorkflowRow>
</template>

<script>
import WorkflowRow from './workflowRow.vue'
import mixins from '@/mixin/virtualScrollListMixin'
import { wordTranslate } from '@utils/wordTranslate.js'
import {
  getWorkflowDetailAPI,
  updateWorkflowAPI,
  copyProductWorkflowAPI
} from '@api'
const pinyin = require('pinyin')

export default {
  name: 'workflow-list-item',
  mixins: [mixins],
  data () {
    return {
      workflowInfo: null,
      copyWorkflowInfo: {
        display_name: '',
        name: ''
      },
      editProjectName: false,
      isShowCopyDialog: false,
      rules: {
        display_name: [
          {
            type: 'string',
            required: true,
            trigger: ['blur', 'change'],
            message: this.$t(`workflow.inputWorkflowName`)
          }
        ],
        name: [
          {
            type: 'string',
            required: true,
            validator: this.validateWorkflowName,
            trigger: ['blur', 'change']
          }
        ]
      }
    }
  },
  props: {
    index: {
      type: Number
    },
    source: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  inject: [
    'startProductWorkflowBuild',
    'startCustomWorkflowBuild',
    'deleteProductWorkflow',
    'renameWorkflow',
    'deleteCustomWorkflow'
  ],
  computed: {
    workflow () {
      return this.source
    },
    projectName () {
      return this.workflow.projectName
    },
    stages () {
      let stages = []
      if (
        this.workflow.workflow_type === 'common_workflow' ||
        this.workflow.workflow_type === 'release'
      ) {
        stages = this.workflow.enabledStages
      } else {
        stages = this.workflow.enabledStages
          ? this.workflow.enabledStages.map(stage => {
            return this.$t(`productWorkflowSideBar.${stage}`)
          })
          : []
      }
      return stages
    }
  },
  methods: {
    validateWorkflowName (rule, value, callback) {
      const result = this.$utils.validateWorkflowName([], value)
      if (result === true) {
        callback()
      } else {
        callback(new Error(result))
      }
    },
    copyProductWorkflow (workflow) {
      this.curWorkflow = workflow
      this.isShowCopyDialog = true
    },
    copyProductWorkflowReq (projectName, oldName, newName, newDisplay) {
      copyProductWorkflowAPI(projectName, oldName, newName, newDisplay).then(
        () => {
          this.$message({
            message: this.$t(`workflow.copyWorkflowSuccess`),
            type: 'success'
          })
          this.refreshWorkflow(this.projectName)
          this.resetForm('copyForm')
        }
      )
    },
    submitForm (formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          this.copyProductWorkflowReq(
            this.projectName,
            this.curWorkflow.name,
            this.copyWorkflowInfo.name,
            this.copyWorkflowInfo.display_name
          )
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    resetForm (formName) {
      this.$refs[formName].resetFields()
      this.isShowCopyDialog = false
    },
    makeAvgRunTime (workflow) {
      const { averageExecutionTime, never_run } = workflow
      const x = String(averageExecutionTime).indexOf('.') + 1
      if (never_run) {
        return ''
      }
      if (x > 0) {
        return averageExecutionTime.toFixed(1) + 's'
      } else {
        return averageExecutionTime + 's'
      }
    },
    makeAvgSuccessRate (workflow) {
      const { successRate, never_run } = workflow
      const x = String(successRate).indexOf('.') + 1
      if (never_run) {
        return ''
      }
      if (x > 0) {
        return (successRate * 100).toFixed(2) + '%'
      } else {
        return successRate * 100 + '%'
      }
    },
    makeTaskDetailLink (projectName, taskInfo, type) {
      if (taskInfo) {
        if (type === 'common_workflow' || type === 'release') {
          return `/v1/projects/detail/${projectName}/pipelines/custom/${taskInfo.pipelineName}/${taskInfo.taskID}?status=${taskInfo.status}&display_name=${this.workflow.display_name}`
        } else {
          return `/v1/projects/detail/${projectName}/pipelines/multi/${taskInfo.pipelineName}/${taskInfo.taskID}?status=${taskInfo.status}&display_name=${this.workflow.display_name}`
        }
      } else {
        return ''
      }
    },
    wordTranslation (word, category, subitem) {
      return wordTranslate(word, category, subitem)
    },
    async fnShowTimer (status, index, workflow) {
      if (status && !workflow.showTimer) {
        this.workflowInfo = await getWorkflowDetailAPI(
          workflow.projectName,
          workflow.name
        ).catch(error => console.log(error))
        if (_.get(this.workflowInfo, 'schedules.items', '[]').length) {
          this.$set(this.source, 'showTimer', true)
          this.$forceUpdate()
        }
      }
    },
    async changeSchedule (projectName) {
      const workflowInfo = this.workflowInfo
      workflowInfo.schedule_enabled = !workflowInfo.schedule_enabled
      const res = await updateWorkflowAPI(this.workflowInfo).catch(error =>
        console.log(error)
      )
      if (res) {
        if (workflowInfo.schedule_enabled) {
          this.$message.success(this.$t(`workflow.timerOpenSuccess`))
        } else {
          this.$message.success(this.$t(`workflow.timerCloseSuccess`))
        }
        this.refreshWorkflow(projectName)
      }
    },
    refreshWorkflow (projectName) {
      this.dispatch('workflow-list', 'refreshWorkflow', projectName)
    }
  },
  components: {
    WorkflowRow
  },
  watch: {
    'copyWorkflowInfo.display_name': {
      handler (val, old_val) {
        this.$set(
          this.copyWorkflowInfo,
          'name',
          pinyin(val, {
            style: pinyin.STYLE_NORMAL
          }).join('')
        )
      }
    }
  }
}
</script>

<style lang="less" scoped>
.button-exec {
  padding: 0 20px;
  font-weight: 400;
  font-size: 18px;
  line-height: 40px;
}

.menu-item {
  display: inline-block;
  box-sizing: border-box;
  padding: 8px;
  color: @fontGray;
  font-size: 20px;
  border: 1px solid transparent;
  border-radius: 5px;

  &:hover {
    border-color: @borderGray;
  }
}

.name {
  width: calc(~'100% - 20px');
}

.more-operation {
  margin: 0 8px 0 -5px;
  color: @fontGray;
  font-size: 20px;
  cursor: pointer;
}
</style>
