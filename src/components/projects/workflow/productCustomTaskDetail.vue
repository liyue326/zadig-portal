<template>
  <div class="product-custom-detail">
    <header>
      <el-row>
        <el-col :span="8">
          <span>
            <el-tooltip effect="dark" :content="displayName" placement="top">
              <span>{{ $utils.tailCut(displayName,20) }}</span>
            </el-tooltip>#
          </span>
          <span>{{taskId}}</span>
          <span :class="$translate.calcTaskStatusColor(payload.status)">{{ payload.status? $t(`workflowTaskStatus.${payload.status}`):$t(`workflowTaskStatus.notRunning`)}}</span>
        </el-col>
        <el-col :offset="4" :span="4">
          <i class="el-icon-video-play"></i>
          <span>{{$utils.convertTimestamp(payload.create_time)}}</span>
        </el-col>
        <el-col :span="3">
          <i class="el-icon-time"></i>
          <span>{{ payload.interval }}</span>
        </el-col>
        <el-col :span="2">
          <i class="el-icon-user"></i>
          <span>{{payload.task_revoker}}</span>
        </el-col>
        <el-col :span="1" v-if="payload.status==='waiting'||payload.status==='running'">
          <el-button size="small" @click="cancel">{{$t(`global.cancel`)}}</el-button>
        </el-col>
      </el-row>
    </header>
    <div class="tab">
      <span class="tab-item" :class="{'active': activeName==='workflow'}" @click="activeName = 'workflow'">{{$t(`global.workflow`)}}</span>
      <span class="tab-item" :class="{'active': activeName==='env'}" @click="activeName = 'env'">{{$t(`global.var`)}}</span>
    </div>
    <Multipane v-if="activeName==='workflow'" layout="horizontal" style="height: 100%;">
      <main>
        <div class="content">
          <span class="text mg-r8">Start</span>
          <div class="line"></div>
          <div class="stages" v-for="(stage,curStageIndex) in payload.stages" :key="stage.label">
            <div v-if="stage.approval && stage.approval.enabled" class="stages-approval" @click="handleApprovalChange(stage,curStageIndex)">
              <el-button type="primary" size="small">{{stage.approval.type==='lark'?$t(`approvalType.feishu`):$t(`approvalType.manualApproval`)}}</el-button>
              <div class="line"></div>
            </div>
            <div class="stage">
              <el-tooltip placement="top-start" effect="dark" width="200" trigger="hover" :content="stage.name">
                <div class="stage-name">{{$utils.tailCut(stage.name,15)}}</div>
              </el-tooltip>
              <div class="jobs" v-for="(job,index) in stage.jobs" :key="job.name">
                <span class="job" @click="setCurJob(job,index,curStageIndex)">
                  <span class="job-status" :class="$translate.calcTaskStatusColor(job.status)">•</span>
                  <el-tooltip placement="top-start" effect="dark" width="200" trigger="hover" :content="job.name">
                    <span class="job-name">{{job.name}}</span>
                  </el-tooltip>
                </span>
              </div>
            </div>
            <div class="line"></div>
          </div>
          <span class="text mg-l8">End</span>
        </div>
      </main>
      <MultipaneResizer class="multipane-resizer" v-if="isShowConsoleFooter"></MultipaneResizer>
      <footer :style="{minHeight:'600px'}" v-if="isShowConsoleFooter">
        <JobBuildDetail
          v-if="curJob.type === jobType.build"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
        <JobDeployDetail @showFooter="showFooter" v-if="curJob.type=== jobType.deploy" :jobInfo="curJob" :projectName="projectName" />
        <StageApproval
          v-if="curJob.type === jobType.approval"
          :approvalInfo="curStage"
          :workflowName="workflowName"
          :taskId="taskId"
          :projectName="projectName"
          @showFooter="showFooter"
        />
        <JobFreestyleDetail
          v-if="curJob.type === jobType.common"
          :commonInfo="curJob"
          :workflowName="workflowName"
          :taskId="taskId"
          :projectName="projectName"
          @showFooter="showFooter"
        />
        <JobPluginDetail
          v-if="curJob.type === jobType.plugin"
          :pluginInfo="curJob"
          :workflowName="workflowName"
          :taskId="taskId"
          :projectName="projectName"
          @showFooter="showFooter"
        />
        <JobBlueGreenConfirmDetail
          v-if="curJob.type === jobType.blueGreenDeploy"
          :jobInfo="curJob"
          :workflowName="workflowName"
          :taskId="taskId"
          @showFooter="showFooter"
        />
        <JobBlueGreenConfirmDetail
          v-if="curJob.type === jobType.blueGreenConfirm"
          :jobInfo="curJob"
          :workflowName="workflowName"
          :taskId="taskId"
          @showFooter="showFooter"
        />
        <JobCanaryDeployDetail
          v-if="curJob.type === jobType.canaryDeploy"
          :jobInfo="curJob"
          :workflowName="workflowName"
          :taskId="taskId"
          @showFooter="showFooter"
        />
        <JobCanaryConfirmDetail
          v-if="curJob.type === jobType.canaryConfirm"
          :jobInfo="curJob"
          :workflowName="workflowName"
          :taskId="taskId"
          @showFooter="showFooter"
        />
        <JobGrayRollbackDetail
          v-if="curJob.type === jobType.k8sGrayRollback"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
        <JobK8sGrayDeployDetail
          v-if="curJob.type === jobType.grayDeploy"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
        <JobK8sResourceUpdateDetail
          @showFooter="showFooter"
          v-if="curJob.type=== jobType.k8sResourcePatch"
          :jobInfo="curJob"
          :projectName="projectName"
        />
        <JobK8sDeployDetail @showFooter="showFooter" v-if="curJob.type=== jobType.k8sDeploy" :jobInfo="curJob" :projectName="projectName" />
        <JobTestDetail
          v-if="curJob.type === jobType.test"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
        <JobScanningDetail
          v-if="curJob.type === jobType.scanning"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
        <JobImageDistributeDetail
          v-if="curJob.type === jobType.distribute"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
        <JobIstioReleaseDetail
          v-if="curJob.type === jobType.istioRelease"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
        <JobIstioReleaseRollbackDetail
          v-if="curJob.type === jobType.istioRollback"
          :jobInfo="curJob"
          :taskId="taskId"
          :workflowName="workflowName"
          :projectName="projectName"
          @showFooter="showFooter"
          :isShowConsoleFooter.sync="isShowConsoleFooter"
        />
      </footer>
    </Multipane>
    <div v-if="activeName==='env'" class="env">
      <el-table :data="envList" v-if="envList.length>0" class="table">
        <el-table-column type="expand">
          <template slot-scope="props">
            <div v-if="props.row.name==='工作流变量'">
              <div v-for="(env,index) in props.row.envs" :key="index" class="table-env">
                <span class="item">{{env.name}}</span>
                <span class="item">{{env.value}}</span>
              </div>
            </div>
            <div v-if="props.row.type==='zadig-build'">
              <div v-for="(env,index) in props.row.spec.envs" :key="index" class="table-env">
                <span class="item">{{env.key}}</span>
                <span class="item">{{env.value}}</span>
              </div>
            </div>
            <div v-if="props.row.type === 'freestyle'">
              <div v-for="(env,index) in props.row.spec.envs" :key="index" class="table-env">
                <span class="item" v-if="env">{{env.key}}</span>
                <span class="item" v-if="env">{{env.value}}</span>
              </div>
            </div>
            <div v-if="props.row.type === 'plugin'">
              <div v-for="(env,index) in props.row.spec.inputs" :key="index" class="table-env">
                <span class="item" v-if="env">{{env.name}}</span>
                <span class="item" v-if="env">{{env.value}}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t(`global.key`)" prop="name"></el-table-column>
        <el-table-column :label="$t(`global.value`)"></el-table-column>
      </el-table>
    </div>
  </div>
</template>
<script>
import {
  getCustomWorkflowTaskDetailAPI,
  deleteCustomWorkflowTaskAPI
} from '@api'
import { Multipane, MultipaneResizer } from 'vue-multipane'
import JobBuildDetail from './productCustomTaskDetail/jobBuildDetail.vue'
import JobDeployDetail from './productCustomTaskDetail/jobDeployDetail.vue'
import StageApproval from './productCustomTaskDetail/stageApproval.vue'
import JobFreestyleDetail from './productCustomTaskDetail/jobFreestyleDetail.vue'
import JobPluginDetail from './productCustomTaskDetail/jobPluginDetail.vue'
import JobK8sDeployDetail from './productCustomTaskDetail/jobK8sDeployDetail.vue'
import JobTestDetail from './productCustomTaskDetail/jobTestDetail.vue'
import JobScanningDetail from './productCustomTaskDetail/jobScanningDetail.vue'
import JobK8sResourceUpdateDetail from './productCustomTaskDetail/jobK8sResourceUpdateDetail.vue'
import JobBlueGreenConfirmDetail from './productCustomTaskDetail/jobBlueGreenConfirmDetail.vue'
import JobBlueGreenDeployDetail from './productCustomTaskDetail/jobBlueGreenDeployDetail.vue'
import JobCanaryDeployDetail from './productCustomTaskDetail/jobCanaryDeployDetail.vue'
import JobCanaryConfirmDetail from './productCustomTaskDetail/jobCanaryConfirmDetail.vue'
import JobK8sGrayDeployDetail from './productCustomTaskDetail/jobK8sGrayDeployDetail.vue'
import JobGrayRollbackDetail from './productCustomTaskDetail/jobGrayRollbackDetail.vue'
import JobImageDistributeDetail from './productCustomTaskDetail/jobImageDistributeDetail.vue'
import JobIstioReleaseDetail from './productCustomTaskDetail/jobIstioReleaseDetail.vue'
import JobIstioReleaseRollbackDetail from './productCustomTaskDetail/jobIstioReleaseRollbackDetail.vue'
import { jobType } from './workflowEditor/customWorkflow/config'
import bus from '@utils/eventBus'

export default {
  data () {
    return {
      jobType,
      isShowConsoleFooter: false,
      firstLoad: true,
      curJobIndex: 0,
      curJob: {},
      payload: {},
      curStageIndex: 0,
      timerId: null,
      timeTimeoutFinishFlag: false,
      activeName: 'workflow',
      activeEnvName: 'env',
      envList: []
    }
  },
  components: {
    Multipane,
    MultipaneResizer,
    JobBuildDetail,
    JobDeployDetail,
    JobFreestyleDetail,
    JobPluginDetail,
    JobK8sDeployDetail,
    JobTestDetail,
    JobScanningDetail,
    StageApproval,
    JobK8sResourceUpdateDetail,
    JobBlueGreenConfirmDetail,
    JobBlueGreenDeployDetail,
    JobCanaryDeployDetail,
    JobCanaryConfirmDetail,
    JobGrayRollbackDetail,
    JobK8sGrayDeployDetail,
    JobImageDistributeDetail,
    JobIstioReleaseDetail,
    JobIstioReleaseRollbackDetail
  },
  computed: {
    taskId () {
      return this.$route.params.task_id
    },
    workflowName () {
      return this.$route.params.workflow_name
    },
    displayName () {
      return this.$route.query.display_name
    },
    projectName () {
      return this.$route.params.project_name
    },
    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.buildStage)
    },
    buildOverallColor () {
      return this.colorTranslation(this.buildOverallStatus, 'pipeline', 'task')
    },
    curStage () {
      if (this.payload.stages) {
        return this.payload.stages[this.curStageIndex]
      } else {
        return {}
      }
    }
  },
  methods: {
    getWorkflowTaskDetail (workflow_name, task_id) {
      getCustomWorkflowTaskDetailAPI(
        workflow_name,
        task_id,
        this.projectName
      ).then(res => {
        // show approval detail when init data
        res.stages.forEach((item, index) => {
          if (
            item.approval &&
            item.approval.enabled &&
            item.status === 'running' &&
            this.firstLoad
          ) {
            this.handleApprovalChange(item, index)
            this.firstLoad = false
          }
        })
        if (
          this.curJob.type &&
          this.curJob.type !== 'zadig-approval' &&
          this.payload.stages &&
          this.payload.stages.length > 0
        ) {
          // can't use computed hook because approval footer is stage level data but use job level data
          this.curJob = this.payload.stages[this.curStageIndex].jobs[
            this.curJobIndex
          ]
        }
        this.payload = res
        this.adaptTaskDetail(res)
        if (this.envList.length === 0) {
          // global env and stage are not in same level data,  so need to handle data
          this.handleEnv()
          const globalEnv = [{ name: this.$t(`workflow.workflowVars`), envs: this.payload.params }]
          const jobs = this.payload.stages.map(item => {
            return item.jobs.map(job => job)
          })
          this.envList = globalEnv.concat(jobs.flat())
        }
      })
    },
    handleEnv () {
      // dont show env value includes 'fixed'/'{{'
      for (let i = 0; i < this.payload.params.length; i++) {
        if (
          this.payload.params[i].value.includes('fixed') ||
          this.payload.params[i].value.includes('{{')
        ) {
          this.$delete(this.payload.params, i)
        }
        if (this.payload.params[i].is_credential) {
          this.payload.params[i].value = '******'
        }
      }
      this.payload.stages.forEach(stage => {
        stage.jobs.forEach(job => {
          if (job.spec && job.spec.service_and_builds) {
            job.spec.service_and_builds.forEach(service => {
              for (let i = 0; i < service.key_vals.length; i++) {
                if (
                  service.key_vals[i].value.includes('fixed') ||
                  service.key_vals[i].value.includes('{{')
                ) {
                  this.$delete(service.key_vals, i)
                }
                if (service.key_vals[i].is_credential) {
                  service.key_vals[i].value = '******'
                }
              }
            })
          }
          if (job.type === 'freestyle') {
            for (let i = 0; i < job.spec.envs.length; i++) {
              if (
                job.spec.envs[i].value.includes('fixed') ||
                job.spec.envs[i].value.includes('{{')
              ) {
                this.$delete(job.spec.envs, i)
              }
              if (job.spec.envs[i].is_credential) {
                job.spec.envs[i].value = '******'
              }
            }
          }
          if (job.type === 'plugin') {
            for (let i = 0; i < job.spec.inputs.length; i++) {
              if (
                job.spec.inputs[i].value.includes('fixed') ||
                job.spec.inputs[i].value.includes('{{')
              ) {
                this.$delete(job.spec.inputs, i)
              }
              if (job.spec.inputs[i].is_credential) {
                job.spec.inputs[i].value = '******'
              }
            }
          }
        })
      })
    },
    setCurJob (item, index, curStageIndex) {
      this.isShowConsoleFooter = true
      this.curJob = item
      this.curJobIndex = index
      this.curStageIndex = curStageIndex
    },
    async refreshHistoryTaskDetail () {
      await this.getWorkflowTaskDetail(this.workflowName, this.taskId)
      if (
        !this.timeTimeoutFinishFlag &&
        this.$route.query.status === 'running'
      ) {
        this.timerId = setTimeout(this.refreshHistoryTaskDetail, 3000) // 保证内存中只有一个定时器
      }
    },
    adaptTaskDetail (detail) {
      detail.intervalSec =
        (detail.status === 'running'
          ? Math.round(new Date().getTime() / 1000)
          : detail.end_time) - detail.start_time
      detail.interval = this.$utils.timeFormat(detail.intervalSec)
    },
    handleApprovalChange (stage, index) {
      // approval is stage level data, there use job ui
      this.curStageIndex = index
      this.curJob.type = 'zadig-approval'
      this.isShowConsoleFooter = true
    },
    showFooter (val) {
      this.isShowConsoleFooter = val
    },
    cancel () {
      deleteCustomWorkflowTaskAPI(
        this.workflowName,
        this.taskId,
        this.projectName
      ).then(res => {
        this.$message.success(this.$t(`workflow.cancelSuccess`))
      })
    },
    closeFooter () {
      this.isShowConsoleFooter = false
    },
    setTitle () {
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
          {
            title: this.displayName || this.workflowName,
            url: `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.workflowName}?display_name=${this.displayName}`
          },
          { title: this.taskId, url: `` }
        ]
      })
    }
  },
  mounted () {
    this.setTitle()
    this.refreshHistoryTaskDetail()
  },
  beforeDestroy () {
    this.timeTimeoutFinishFlag = true
    clearTimeout(this.timerId)
  }
}
</script>
<style lang="less" scoped>
.product-custom-detail {
  height: 100%;
  font-size: 14px;
  background: #fff;

  header {
    height: 42px;
    margin: 24px;
    padding: 0 24px;
    color: #121212;
    line-height: 42px;
    box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.1);
  }

  main {
    padding: 0 24px;

    .content {
      display: flex;

      .text {
        line-height: 52px;
      }

      .stages {
        display: flex;
        font-size: 16px;
        text-align: center;

        &-approval {
          display: flex;
          height: 40px;
        }

        .stage {
          width: 140px;
          margin: -6px 4px;
          padding: 8px 0 16px 0;
          border: 2px dotted @borderGray;
          border-radius: 4px;
          cursor: pointer;

          &-name {
            margin-right: 16px;
            margin-left: 16px;
            padding-left: -8px;
            color: #121212;
            font-size: 14px;
            line-height: 24px;
            text-align: left;
            border-bottom: 1px solid @borderGray;
            cursor: pointer;
          }
        }

        .jobs {
          height: 30px;
          margin-top: 8px;
          padding: 0 8px;
          line-height: 30px;

          .job {
            display: inline-block;
            box-sizing: border-box;
            width: 7em;
            padding: 0 8px;
            overflow: hidden;
            font-weight: 400;
            font-size: 14px;
            white-space: nowrap;
            text-align: left;
            text-overflow: ellipsis;
            border: 1px solid @borderGray;
            cursor: pointer;

            &-status {
              font-size: 18px;
              vertical-align: -3px;
            }
          }
        }
      }
    }
  }

  footer {
    height: 100%;
  }

  .multipane-resizer {
    z-index: 10;
    cursor: row-resize;
  }

  .multipane-resizer::before {
    position: absolute;
    top: 50%;
    left: 50%;
    display: block;
    width: 100px;
    height: 8px;
    margin-left: -5.5px;
    background-color: #fff;
    border: 1px solid #dbdbdb;
    border-radius: 5px;
    content: '';
  }

  .line {
    position: relative;
    min-width: 46px;
    height: 2px;
    margin-top: 24px;
    background: @themeColor;

    &::before {
      position: absolute;
      top: -2px;
      left: -5px;
      width: 4px;
      height: 4px;
      border: 1px solid @themeColor;
      border-radius: 50%;
      content: '';
    }

    &::after {
      position: absolute;
      top: -2px;
      right: -5px;
      width: 4px;
      height: 4px;
      border: 1px solid @themeColor;
      border-radius: 50%;
      content: '';
    }
  }

  .tab {
    margin: 24px 0;
    padding: 0 24px;
    color: @projectNameColor;
    font-size: 14px;
    cursor: pointer;

    span:first-child {
      position: relative;
      margin-right: 16px;

      &::after {
        position: absolute;
        top: 0;
        right: -10px;
        width: 2px;
        height: 100%;
        background: @borderGray;
        content: '';
      }
    }

    .active {
      color: @themeColor;
    }
  }

  .env {
    width: 50%;
    height: 80%;
    padding: 0 24px;
    overflow-y: auto;

    .table {
      &-env {
        height: 30px;
        padding: 0 60px;
        line-height: 30px;

        .item {
          display: inline-block;
          width: 40%;
        }
      }
    }
  }
}
</style>
