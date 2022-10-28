<template>
  <ProductWorkflowRow
    :workflowInfo="workflow"
    :displayName="workflow.display_name"
    :name="workflow.name"
    :isFavorite="workflow.isFavorite || false"
    :type="workflow.workflow_type === 'common_workflow' ? 'common_workflow' : 'workflow'"
    :projectName="workflow.projectName || workflow.project_name"
    :stages="stages"
    :recentTaskStatus="workflow.recentTask?workflow.recentTask.status:''"
    :recentSuccessID="workflow.recentSuccessfulTask?`#${workflow.recentSuccessfulTask.taskID}`:''"
    :avgRuntime="makeAvgRunTime(workflow.averageExecutionTime)"
    :avgSuccessRate="makeAvgSuccessRate(workflow.successRate)"
    :recentSuccessLink="makeTaskDetailLink(workflow.projectName,workflow.recentSuccessfulTask,workflow.workflow_type)"
    :recentFailID="workflow.recentFailedTask?`#${workflow.recentFailedTask.taskID}`:''"
    :recentFailLink="makeTaskDetailLink(workflow.projectName,workflow.recentFailedTask,workflow.workflow_type)"
    :updateTime="$utils.convertTimestamp(workflow.update_time)"
    :description="workflow.description"
    @refreshWorkflow="refreshWorkflow"
  >
    <template v-if="workflow.workflow_type === 'common_workflow'" slot="operations">
      <el-button
        type="primary"
        v-if="checkPermissionSyncMixin({projectName: workflow.projectName, action: 'run_workflow',resource:{type:'workflow',name:workflow.name}})"
        class="button-exec"
        @click="startCustomWorkflowBuild(workflow)"
      >
        <span class="iconfont iconzhixing">&nbsp;执行</span>
      </el-button>
      <el-tooltip v-else effect="dark" content="无权限操作" placement="top">
        <el-button type="primary" class="button-exec permission-disabled">
          <span class="iconfont iconzhixing">&nbsp;执行</span>
        </el-button>
      </el-tooltip>
      <router-link
        v-if="checkPermissionSyncMixin({projectName: workflow.projectName, action: 'edit_workflow', resource:{type:'workflow',name:workflow.name}})"
        :to="workflow.workflow_type === 'common_workflow' ? `/v1/projects/detail/${workflow.projectName}/pipelines/custom/edit/${workflow.name}?projectName=${workflow.projectName}&display_name=${workflow.display_name}` :  `/workflows/common/edit/${workflow.name}?projectName=${workflow.projectName}&id=${workflow.id}&display_name=${workflow.display_name}`"
      >
        <span class="menu-item iconfont icondeploy"></span>
      </router-link>
      <el-tooltip v-else effect="dark" content="无权限操作" placement="top">
        <span class="permission-disabled menu-item iconfont icondeploy"></span>
      </el-tooltip>
      <el-dropdown>
        <span class="el-dropdown-link">
          <i class="iconfont iconmorelist more-operation"></i>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item
            v-hasPermi="{projectName: workflow.projectName, action: 'delete_workflow',resource:{type:'workflow',name:workflow.name},isBtn:true}"
            @click.native="deleteCommonWorkflow(workflow)"
          >
            <span>删除</span>
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
        <span class="iconfont iconzhixing">&nbsp;执行</span>
      </el-button>
      <el-tooltip v-else effect="dark" content="无权限操作" placement="top">
        <el-button type="primary" class="button-exec permission-disabled">
          <span class="iconfont iconzhixing">&nbsp;执行</span>
        </el-button>
      </el-tooltip>
      <router-link
        v-if="checkPermissionSyncMixin({projectName: workflow.projectName, action: 'edit_workflow',resource:{type:'workflow',name:workflow.name},isBtn: true})"
        :to="`/workflows/product/edit/${workflow.name}?projectName=${workflow.projectName}&display_name=${workflow.display_name}`"
      >
        <span class="menu-item iconfont icondeploy"></span>
      </router-link>
      <el-tooltip v-else effect="dark" content="无权限操作" placement="top">
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
            <span>{{workflow.schedulerEnabled ? '关闭': '打开'}}定时器</span>
          </el-dropdown-item>
          <el-dropdown-item
            v-hasPermi="{projectName: workflow.projectName, action: 'create_workflow',resource:{type:'workflow',name:workflow.name},isBtn:true}"
            @click.native="copyWorkflow(workflow)"
          >
            <span>复制</span>
          </el-dropdown-item>
          <el-dropdown-item
            v-hasPermi="{projectName: workflow.projectName, action: 'delete_workflow',resource:{type:'workflow',name:workflow.name},isBtn:true}"
            @click.native="deleteProductWorkflow(workflow)"
          >
            <span>删除</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <el-dialog :visible.sync="isShowCopyDialog" title="复制工作流" width="40%">
        <el-form :model="copyWorkflowInfo" @submit.native.prevent ref="copyForm" :rules="rules" label-width="120px">
          <el-form-item label="新工作流名称" prop="display_name">
            <el-input v-model="copyWorkflowInfo.display_name" placeholder="新工作流名称" size="small"></el-input>
          </el-form-item>
          <el-form-item label="新工作流标识" prop="name">
            <el-input v-model="copyWorkflowInfo.name" :disabled="!editProjectName" placeholder="新工作流标识" size="small" class="name"></el-input>
            <span @click="editProjectName = editProjectName ? false : true" class="edit-btn">
              <i :class="[editProjectName ? 'el-icon-finished' : 'el-icon-edit-outline']"></i>
            </span>
          </el-form-item>
        </el-form>
        <span slot="footer">
          <el-button type="primary" size="small" @click="submitForm('copyForm')">确定</el-button>
          <el-button size="small" @click="resetForm('copyForm')">取消</el-button>
        </span>
      </el-dialog>
    </template>
  </ProductWorkflowRow>
</template>

<script>
import ProductWorkflowRow from './productRow.vue'
import mixins from '@/mixin/virtualScrollListMixin'
import { wordTranslate } from '@utils/wordTranslate.js'
import { getWorkflowDetailAPI, updateWorkflowAPI, copyWorkflowAPI } from '@api'
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
            message: '请输入工作流名称'
          }
        ],
        name: [
          {
            type: 'string',
            required: true,
            validator: this.validatePipelineName,
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
    'renamePipeline',
    'startCommonWorkflowBuild',
    'deleteCommonWorkflow'
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
      if (this.workflow.workflow_type === 'common_workflow') {
        stages = this.workflow.enabledStages
      } else {
        stages = this.workflow.enabledStages
          ? this.workflow.enabledStages.map(stage =>
            this.wordTranslation(stage, 'workflowStage')
          )
          : []
      }
      return stages
    }
  },
  methods: {
    validatePipelineName (rule, value, callback) {
      console.log(value)
      const result = this.$utils.validatePipelineName([], value)
      if (result === true) {
        callback()
      } else {
        callback(new Error(result))
      }
    },
    copyWorkflow (workflow) {
      this.curWorkflow = workflow
      this.isShowCopyDialog = true
    },
    copyWorkflowReq (projectName, oldName, newName, newDisplay) {
      copyWorkflowAPI(projectName, oldName, newName, newDisplay).then(() => {
        this.$message({
          message: '复制流水线成功',
          type: 'success'
        })
        this.refreshWorkflow(this.projectName)
        this.resetForm('copyForm')
      })
    },
    submitForm (formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          this.copyWorkflowReq(
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
    makeAvgRunTime (number) {
      const x = String(number).indexOf('.') + 1
      if (x > 0) {
        return number.toFixed(1) + 's'
      } else {
        return number + 's'
      }
    },
    makeAvgSuccessRate (number) {
      const x = String(number).indexOf('.') + 1
      if (x > 0) {
        return (number * 100).toFixed(2) + '%'
      } else {
        return (number * 100) + '%'
      }
    },
    makeTaskDetailLink (projectName, taskInfo, type) {
      if (taskInfo) {
        if (type === 'common_workflow') {
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
          this.$message.success('定时器开启成功')
        } else {
          this.$message.success('定时器关闭成功')
        }
        this.refreshWorkflow(projectName)
      }
    },
    refreshWorkflow (projectName) {
      this.dispatch('workflow-list', 'refreshWorkflow', projectName)
    }
  },
  components: {
    ProductWorkflowRow
  },
  watch: {
    'copyWorkflowInfo.display_name': {
      handler (val, old_val) {
        this.$set(this.copyWorkflowInfo, 'name', pinyin(val, {
          style: pinyin.STYLE_NORMAL
        }).join(''))
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
