<template>
  <div class="new-workflow-home">
    <div class="left">
      <header>
        <div class="name">
          <el-form ref="form" :model="payload" inline>
            <el-form-item
              prop="display_name"
              :rules="{required: true,message:this.$t(`workflow.inputWorkflowName`), trigger: ['blur', 'change']}"
              class="mg-r16"
            >
              <el-tooltip effect="dark" :content="payload.display_name" placement="top" :disabled="!payload.display_name">
                <el-input
                  v-model="payload.display_name"
                  :placeholder="this.$t(`workflow.inputWorkflowName`)"
                  size="small"
                  :disabled="!editDisplayName"
                  class="name-input"
                ></el-input>
              </el-tooltip>
              <span @click="editDisplayName = editDisplayName ? false : true" class="mg-r8">
                <i :class="[editDisplayName ? 'el-icon-finished' : 'el-icon-edit-outline']"></i>
              </span>
            </el-form-item>
            <el-form-item prop="name" :rules="{required: true,validator:validateWorkflowName, trigger: ['blur', 'change']}" class="mg-r16">
              <el-tooltip effect="dark" :content="payload.name" placement="top" :disabled="!payload.name">
                <el-input
                  v-model="payload.name"
                  :placeholder="$t(`workflow.inputWorkflowID`)"
                  size="small"
                  :disabled="!editName"
                  class="name-input"
                ></el-input>
              </el-tooltip>
              <span @click="editName = editName ? false : true" class="mg-r8">
                <i :class="[editName ? 'el-icon-finished' : 'el-icon-edit-outline']"></i>
              </span>
            </el-form-item>
            <el-form-item prop="description">
              <el-tooltip effect="dark" :content="payload.description" placement="top" :disabled="!payload.description">
                <el-input
                  v-model="payload.description"
                  :placeholder="$t(`workflow.desc`)"
                  size="small"
                  :disabled="!editDesc"
                  class="name-input"
                ></el-input>
              </el-tooltip>
              <span @click="editDesc = editDesc ? false : true" class="mg-r8">
                <i :class="[editDesc ? 'el-icon-finished' : 'el-icon-edit-outline']"></i>
              </span>
            </el-form-item>
          </el-form>
        </div>
        <div class="tab">
          <span
            class="tab-item"
            :class="{'active': activeName===item.name}"
            v-for="item in tabList"
            :key="item.name"
            @click="handleTabChange(item.name)"
          >{{$t(`workflow.${item.label}`)}}</span>
        </div>
        <div>
          <el-button type="text" v-if="hasPlutus" @click="isShowModelDialog=true">{{$t(`workflow.saveAsTemplate`)}}</el-button>
          <el-button type="primary" size="small" @click="operateWorkflow">{{$t(`global.save`)}}</el-button>
          <el-button size="small" @click="cancelWorkflow">{{$t(`global.cancel`)}}</el-button>
        </div>
      </header>
      <Multipane layout="horizontal" style="height: 100%;" v-show="activeName === 'ui'">
        <div class="scale">
          <el-tooltip class="item" effect="dark" content="缩小" placement="top">
            <span class="icon el-icon-minus" @click="scale('narrow')"></span>
          </el-tooltip>
          <el-tooltip class="item" effect="dark" content="放大" placement="top">
            <span class="icon el-icon-plus" @click="scale('enlarge')"></span>
          </el-tooltip>
        </div>
        <main class="mg-t16" id="main">
          <section class="ui" id="ui">
            <span class="ui-text mg-r8">Start</span>
            <div class="line">
              <span class="add" @click="addStage(-1)">+</span>
            </div>
            <div class="ui-stage" v-for="(item,index) in payload.stages" :key="item.label">
              <div class="item" @click="setCurStage(index,item)">
                <div @click="showStageOperateDialog('edit',item)" class="edit">
                  <i class="el-icon-s-tools"></i>
                </div>
                <Stage v-model="payload.stages[index]" :curJobIndex.sync="curJobIndex" :scale="scal" :workflowInfo="payload" />
                <div @click="delStage(index,item)" class="del">
                  <i class="el-icon-close"></i>
                </div>
              </div>
              <div class="line">
                <span class="add" v-if="payload.stages.length - 1 > index" @click="addStage(index)">+</span>
              </div>
            </div>
            <div>
              <el-button @click="showStageOperateDialog('add')" size="small" class="stage-add">+ {{$t(`workflow.stage`)}}</el-button>
            </div>
            <div class="line"></div>
            <span class="ui-text mg-l8">End</span>
          </section>
        </main>

        <MultipaneResizer class="multipane-resizer" v-if="isShowFooter&&activeName === 'ui'"></MultipaneResizer>
        <footer :style="{minHeight:'70%'}" v-if="isShowFooter">
          <div class="header">
            <span>{{curJobType}}</span>
            <div>
              <el-button size="mini" type="primary" @click="saveJobConfig">{{$t(`global.confirm`)}}</el-button>
              <el-button size="mini" @click.stop="closeFooter">{{$t(`global.cancel`)}}</el-button>
            </div>
          </div>
          <div v-if="payload.stages.length > 0 && job" class="main">
            <div v-if="payload.stages[curStageIndex].jobs.length > 0 && job.type === jobType.build">
              <JobBuild
                :projectName="projectName"
                :job="job"
                :originServiceAndBuilds="originServiceAndBuilds"
                class="mg-b24"
                :ref="jobType.build"
                :workflowInfo="payload"
                :curStageIndex="curStageIndex"
                :curJobIndex="curJobIndex"
              />
              <el-select size="small" v-model="service" multiple filterable clearable>
                <el-option
                  disabled
                  label="全选"
                  value="ALL"
                  :class="{selected: service.length === serviceAndBuilds.length}"
                  style="color: #606266;"
                >
                  <span
                    style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
                    @click="service = serviceAndBuilds.map(item=>item.value)"
                  >全选</span>
                </el-option>
                <el-option
                  v-for="(service,index) in serviceAndBuilds"
                  :key="index"
                  :value="service.value"
                  :label="service.value"
                >{{service.value}}</el-option>
              </el-select>
              <el-button
                type="success"
                size="mini"
                plain
                :disabled="Object.keys(service).length === 0"
                @click="addServiceAndBuild(job.spec.service_and_builds)"
              >+ {{$t(`global.add`)}}</el-button>
            </div>
            <JobPlugin
              v-if="job.type === jobType.plugin"
              :job="job"
              :ref="jobType.plugin"
              :workflowInfo="payload"
              :curStageIndex="curStageIndex"
              :curJobIndex="curJobIndex"
            />
            <JobDeploy
              :projectName="projectName"
              v-if="job.type === jobType.deploy"
              :job="job"
              :ref="jobType.deploy"
              :originServiceAndBuilds="originServiceAndBuilds"
              :workflowInfo="payload"
              :curStageIndex="curStageIndex"
              :curJobIndex="curJobIndex"
            />
            <JobFreestyle
              v-if="job.type === jobType.freestyle"
              :ref="jobType.freestyle"
              :job="job"
              :workflowInfo="payload"
              :curStageIndex="curStageIndex"
              :curJobIndex="curJobIndex"
            />
            <JobK8sDeploy
              :projectName="projectName"
              v-if="job.type === jobType.k8sDeploy"
              :job="job"
              :ref="jobType.k8sDeploy"
              :originServiceAndBuilds="originServiceAndBuilds"
              :workflowInfo="payload"
              :curStageIndex="curStageIndex"
              :curJobIndex="curJobIndex"
            />
            <JobTest
              :projectName="projectName"
              v-if="job.type === jobType.test"
              :job="job"
              :ref="jobType.test"
              :workflowInfo="payload"
              :curStageIndex="curStageIndex"
              :curJobIndex="curJobIndex"
            />
            <JobScanning
              :projectName="projectName"
              v-if="job.type === jobType.scanning"
              :job="job"
              :ref="jobType.scanning"
              :workflowInfo="payload"
              :curStageIndex="curStageIndex"
              :curJobIndex="curJobIndex"
            />
            <JobCanaryDeploy v-if="job.type === jobType.canaryDeploy" :projectName="projectName" :job="job" :ref="jobType.canaryDeploy" />
            <JobK8sResourceUpdate
              v-if="job.type === jobType.k8sResourcePatch"
              :projectName="projectName"
              :job="job"
              :ref="jobType.k8sResourcePatch"
            />
            <JobCanaryConfirm
              v-if="job.type === jobType.canaryConfirm"
              :projectName="projectName"
              :job="job"
              :workflowInfo="payload"
              :ref="jobType.canaryConfirm"
            />
            <JobBlueGreenDeploy
              v-if="job.type === jobType.blueGreenDeploy"
              :projectName="projectName"
              :job="job"
              :ref="jobType.blueGreenDeploy"
            />
            <JobBlueGreenConfirm
              v-if="job.type === jobType.blueGreenConfirm"
              :projectName="projectName"
              :job="job"
              :workflowInfo="payload"
              :ref="jobType.blueGreenConfirm"
            />
            <JobGrayRollback
              v-if="job.type === jobType.k8sGrayRollback"
              :projectName="projectName"
              :job="job"
              :workflowInfo="payload"
              :ref="jobType.k8sGrayRollback"
            />
            <JobK8sGrayDeploy
              v-if="job.type === jobType.grayDeploy"
              :projectName="projectName"
              :job="job"
              :workflowInfo="payload"
              :ref="jobType.grayDeploy"
            />
            <JobImageDistribute
              :projectName="projectName"
              v-if="job.type === jobType.distribute"
              :job="job"
              :ref="jobType.distribute"
              :workflowInfo="payload"
            />
            <JobIstioRelease
              :projectName="projectName"
              v-if="job.type === jobType.istioRelease"
              :job="job"
              :ref="jobType.istioRelease"
              :globalEnv="globalEnv"
              :workflowInfo="payload"
            />
            <JobIstioReleaseRollback
              :projectName="projectName"
              v-if="job.type === jobType.istioRollback"
              :job="job"
              :ref="jobType.istioRollback"
              :globalEnv="globalEnv"
              :workflowInfo="payload"
            />
          </div>
        </footer>
      </Multipane>
      <section v-show="activeName === 'yaml'" class="yaml">
        <div class="yaml-error">{{yamlError}}</div>
        <codemirror class="codemirror" ref="yamlEditor" v-model="yaml" :options="editorOptions"></codemirror>
      </section>
    </div>
    <div class="right">
      <div v-for="item in configList" :key="item.label" class="right-tab" @click="setCurDrawer(item.value)">{{$t(`workflow.baseType.${item.label}`)}}</div>
    </div>
    <el-drawer
      :visible.sync="isShowDrawer"
      direction="rtl"
      :modal-append-to-body="false"
      :show-close="false"
      class="drawer"
      :before-close="closeDrawer"
      :size="drawerSize?drawerSize:'40%'"
    >
      <span slot="title" class="drawer-title">
        <span>{{drawerTitle}}</span>
        <div v-if="drawerHideButton">
          <el-button size="mini" plain @click="closeDrawer">{{$t(`global.cancel`)}}</el-button>
        </div>
        <div v-else>
          <el-button type="primary" size="mini" plain @click="handleDrawerChange">{{$t(`global.confirm`)}}</el-button>
          <el-button size="mini" plain @click="closeDrawer">{{$t(`global.cancel`)}}</el-button>
        </div>
      </span>
      <div v-if="curDrawer === 'high'">
        <Settings :workflowInfo="payload" ref="settings" />
      </div>
      <div v-if="curDrawer === 'env'">
        <Env :preEnvs="payload" ref="env" />
      </div>
      <div v-if="curDrawer === 'webhook'">
        <Webhook
          :config="payload"
          :isEdit="isEdit"
          :isShowDrawer="isShowDrawer"
          :originalWorkflow="originalWorkflow"
          @saveWorkflow="operateWorkflow('fromWebhook')"
          @closeDrawer="closeDrawer"
          ref="webhook"
        />
      </div>
      <div v-if="curDrawer === 'notify'">
        <Notify :config="payload" :isEdit="isEdit" ref="notify" />
      </div>
    </el-drawer>
    <el-dialog :title="stageOperateType === 'add' ? $t(`workflow.addStage`): $t(`workflow.editStage`)" :visible.sync="isShowStageOperateDialog" width="30%">
      <StageOperate
        ref="stageOperate"
        :stageInfo="stage"
        :type="stageOperateType"
        :workflowInfo="payload"
        :projectName="projectName"
        @submitEvent="operateStage('',stage)"
      />
      <div slot="footer">
        <el-button @click="isShowStageOperateDialog = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="operateStage('',stage)" size="small">{{$t(`global.confirm`)}}</el-button>
      </div>
    </el-dialog>
    <el-dialog :title="$t(`workflow.saveAsTemplate`)" :visible.sync="isShowModelDialog" width="30%">
      <el-form inline ref="modelForm" :model="modelFormInfo" label-position="left">
        <el-form-item :label="$t(`workflow.templateName`)" :rules="{required: true,message: $t(`workflow.inputTemplateName`), trigger: ['blur', 'change']}" prop="name">
          <el-input :placeholder="$t(`workflow.inputTemplateName`)" size="small" v-model="modelFormInfo.name"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="isShowModelDialog = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="saveModel" size="small">{{$t(`global.confirm`)}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  tabList,
  configList,
  editorOptions,
  jobType,
  jobTypeList,
  validateWorkflowName
} from './config'
import {
  getAssociatedBuildsAPI,
  addCustomWorkflowAPI,
  updateCustomWorkflowAPI,
  getCustomWorkflowDetailAPI,
  addWorkflowTemplateAPI,
  getWorkflowTemplateDetailAPI
} from '@api'
import { Multipane, MultipaneResizer } from 'vue-multipane'
import Stage from './components/stage.vue'
import StageOperate from './components/stageOperate.vue'
import JobBuild from './components/jobs/jobBuild'
import JobDeploy from './components/jobs/jobDeploy.vue'
import JobFreestyle from './components/jobs/jobFreestyle.vue'
import JobPlugin from './components/jobs/jobPlugin.vue'
import JobK8sDeploy from './components/jobs/jobK8sDeploy'
import JobTest from './components/jobs/jobTest'
import JobScanning from './components/jobs/jobScanning.vue'
import JobCanaryDeploy from './components/jobs/jobCanaryDeploy.vue'
import JobCanaryConfirm from './components/jobs/jobCanaryConfirm.vue'
import JobBlueGreenDeploy from './components/jobs/jobBlueGreenDeploy.vue'
import JobBlueGreenConfirm from './components/jobs/jobBlueGreenConfirm.vue'
import JobGrayRollback from './components/jobs/jobGrayRollback.vue'
import JobK8sGrayDeploy from './components/jobs/jobK8sGrayDeploy'
import JobK8sResourceUpdate from './components/jobs/jobK8sResourceUpdate'
import JobImageDistribute from './components/jobs/jobImageDistribute.vue'
import JobIstioRelease from './components/jobs/jobIstioRelease.vue'
import JobIstioReleaseRollback from './components/jobs/jobIstioReleaseRollback.vue'
import RunCustomWorkflow from '../../common/runCustomWorkflow'
import Env from './components/base/env.vue'
import Settings from './components/base/settings'
import Webhook from './components/base/webhook.vue'
import Notify from './components/base/notify.vue'
import jsyaml from 'js-yaml'
import bus from '@utils/eventBus'
import { codemirror } from 'vue-codemirror'
import { cloneDeep, differenceWith } from 'lodash'
import { mapState } from 'vuex'
const pinyin = require('pinyin')

export default {
  name: 'CustomWorkflow',
  data () {
    return {
      validateWorkflowName,
      tabList,
      configList,
      activeName: 'ui',
      editorOptions,
      jobType,
      editDisplayName: false,
      editName: false,
      editDesc: false,
      stage: {
        name: '',
        parallel: true,
        approval: {
          enabled: false,
          approve_users: [],
          timeout: null,
          needed_approvers: null,
          description: '',
          type: 'native',
          approval_id: ''
        },
        jobs: []
      },
      job: {
        name: '',
        type: '',
        spec: {
          docker_registry_id: ''
        }
      },
      stageOperateType: 'add',
      payload: {
        category: 'release',
        display_name: '',
        name: '',
        project: '',
        description: '',
        multi_run: false,
        notify_ctls: [],
        stages: [],
        params: []
      },
      originalWorkflow: {},
      curStageIndex: 0,
      curJobIndex: -2, // 不指向 job
      curDrawer: 'high',
      isShowStageOperateDialog: false,
      serviceAndBuilds: [],
      originServiceAndBuilds: [],
      service: '',
      yaml: '',
      yamlError: '',
      isShowDrawer: false,
      multi_run: false,
      scal: '1',
      insertSatgeIndex: 0,
      notComputedPayload: {},
      isShowModelDialog: false,
      modelFormInfo: { name: '' }
    }
  },
  components: {
    Stage,
    StageOperate,
    Multipane,
    MultipaneResizer,
    JobBuild,
    JobDeploy,
    JobFreestyle,
    JobPlugin,
    JobK8sDeploy,
    JobTest,
    JobScanning,
    JobK8sResourceUpdate,
    JobCanaryDeploy,
    JobCanaryConfirm,
    JobBlueGreenDeploy,
    JobBlueGreenConfirm,
    JobGrayRollback,
    JobK8sGrayDeploy,
    JobImageDistribute,
    JobIstioRelease,
    JobIstioReleaseRollback,
    RunCustomWorkflow,
    codemirror,
    Env,
    Webhook,
    Notify,
    Settings
  },
  computed: {
    modelId () {
      return this.$route.query.id
    },
    projectName () {
      return this.$route.query.projectName
    },
    isShowFooter () {
      return this.$store.state.customWorkflow.isShowFooter
    },
    curOperateType () {
      return this.$store.state.customWorkflow.curOperateType
    },
    isEdit () {
      return !!this.$route.params.workflow_name
    },
    curJobType () {
      if (this.job) {
        const curType = jobTypeList.find(item => item.type === this.job.type)
        return curType
          ? this.$t(`workflow.jobType.${curType.label}`)
          : this.job.spec.plugin.name
      } else {
        return ''
      }
    },
    drawerTitle () {
      const res = this.configList.find(item => {
        return item.value === this.curDrawer
      })
      return res ? this.$t(`workflow.baseType.${res.label}`) : ''
    },
    drawerSize () {
      const res = this.configList.find(item => {
        return item.value === this.curDrawer
      })
      return res ? res.drawerSize : '30%'
    },
    drawerConfirmText () {
      const res = this.configList.find(item => {
        return item.value === this.curDrawer
      })
      return res ? res.drawerConfirmText : ''
    },
    drawerCancelText () {
      const res = this.configList.find(item => {
        return item.value === this.curDrawer
      })
      return res ? res.drawerCancelText : ''
    },
    drawerHideButton () {
      const res = this.configList.find(item => {
        return item.value === this.curDrawer
      })
      return res ? res.drawerHideButton : false
    },
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    })
  },
  created () {
    this.init()
  },
  methods: {
    init () {
      this.payload.project = this.projectName
      this.getServiceAndBuildList()
      this.setTitle()
      if (this.modelId) {
        this.getWorkflowTemplateDetail()
      } else {
        // edit
        if (this.isEdit) {
          this.getWorkflowDetail(this.$route.params.workflow_name)
        }
      }
      this.$store.dispatch('setIsShowFooter', false)
    },
    getWorkflowTemplateDetail () {
      getWorkflowTemplateDetailAPI(this.modelId, this.projectName).then(res => {
        this.payload = Object.assign(this.payload, jsyaml.load(res))
        this.handleEnv()
      })
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
            url: `/v1/projects/detail/${this.projectName}/pipelines?display_name=${this.$route.query.display_name}`
          },
          {
            title:
              this.$route.query.display_name ||
              this.$route.params.workflow_name,
            url: `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.$route.params.workflow_name}?display_name=${this.$route.query.display_name}`
          }
        ]
      })
    },
    scale (type) {
      this.$nextTick(() => {
        const main = document.getElementById('ui')
        if (type === 'enlarge') {
          if (this.scal > 1) return
          this.scal = (parseFloat(this.scal) + 0.1).toFixed(2)
        } else {
          if (this.scal < 0.5) return
          this.scal = (parseFloat(this.scal) - 0.1).toFixed(2)
        }
        main.style.zoom = this.scal
      })
    },
    handleTabChange (name) {
      this.$store.dispatch('setCurOperateType', 'tab')
      this.activeName = name
    },
    operateWorkflow (params) {
      if (this.activeName === 'yaml') {
        this.payload = jsyaml.load(this.yaml)
      }
      this.$refs.form.validate(valid => {
        if (valid) {
          if (this.payload.stages.length === 0) {
            this.$message.error(this.$t(`workflow.atLeastOneStage`))
            return
          }
          this.payload.stages.forEach(item => {
            if (item.jobs.length === 0) {
              this.$message.error(this.$t(`workflow.inputStageJob`, { name: item.name }))
              throw Error()
            }
          })
          if (this.isShowFooter) {
            this.$message.error(this.$t(`workflow.saveJobconfigFirst`))
            return
          }
          this.saveWorkflow(params)
        }
      })
    },
    saveWorkflow (params) {
      this.notComputedPayload = cloneDeep(this.payload)
      if (this.payload.params && this.payload.params.length > 0) {
        this.payload.params.forEach(item => {
          if (item.command === 'fixed') {
            item.value = '<+fixed>' + item.value
          }
        })
      }
      this.payload.stages.forEach(stage => {
        if (stage.approval.type === 'native') {
          delete stage.approval.lark_approval
        } else {
          delete stage.approval.native_approval
        }
        stage.jobs.forEach(job => {
          if (job.type === 'zadig-build') {
            if (job.spec && job.spec.service_and_builds) {
              job.spec.service_and_builds.forEach(service => {
                if (service.key_vals) {
                  service.key_vals.forEach(item => {
                    if (item.command === 'fixed') {
                      item.value = '<+fixed>' + item.value
                    }
                  })
                }
              })
            }
          }
          if (job.type === 'zadig-deploy') {
            if (job.spec.envType === 'fixed') {
              job.spec.env = '<+fixed>' + job.spec.env
            }
            job.spec.source =
              job.spec.serviceType === 'other' ? 'fromjob' : 'runtime'
          }
          if (job.type === 'freestyle') {
            if (
              job.spec.properties.envs &&
              job.spec.properties.envs.length > 0
            ) {
              job.spec.properties.envs.forEach(item => {
                if (item.command === 'fixed') {
                  item.value = '<+fixed>' + item.value
                }
              })
            }
          }
          if (job.type === 'plugin') {
            job.spec.plugin.inputs.forEach(item => {
              if (item.command === 'fixed') {
                item.value = '<+fixed>' + item.value
              }
            })
          }
          if (job.type === 'zadig-test') {
            if (job.spec && job.spec.test_modules) {
              job.spec.test_modules.forEach(service => {
                if (service.key_vals) {
                  service.key_vals.forEach(item => {
                    if (item.command === 'fixed') {
                      item.value = '<+fixed>' + item.value
                    }
                  })
                }
              })
            }
          }
        })
      })
      // display_name 中间支持空格 结尾不支持
      this.payload.name = this.payload.name.trim()
      this.payload.display_name = this.payload.display_name.trim()
      this.payload.project = this.projectName
      const yamlParams = jsyaml.dump(this.payload)
      const workflowName = this.payload.name
      if (this.modelId) {
        addCustomWorkflowAPI(yamlParams, this.projectName)
          .then(res => {
            this.$message.success('模板保存成功')
            this.getWorkflowDetail(this.payload.name)
            if (params && params === 'fromWebhook') {
              return
            }
            this.$router.push(
              `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.payload.name}?display_name=${this.payload.display_name}`
            )
          })
          .catch(() => {
            this.payload = this.notComputedPayload
          })
      } else {
        if (this.$route.fullPath.includes('edit')) {
          updateCustomWorkflowAPI(workflowName, yamlParams, this.projectName)
            .then(res => {
              this.$message.success('保存成功')
              if (this.curDrawer !== 'webhook' && !this.isShowDrawer) {
                this.$router.push(
                  `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.payload.name}?display_name=${this.payload.display_name}`
                )
              }
            })
            .catch(() => {
              this.payload = this.notComputedPayload
            })
        } else {
          addCustomWorkflowAPI(yamlParams, this.projectName)
            .then(res => {
              this.$message.success('新建成功')
              this.getWorkflowDetail(this.payload.name)
              if (params && params === 'fromWebhook') {
                return
              }
              this.$router.push(
                `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.payload.name}?display_name=${this.payload.display_name}`
              )
            })
            .catch(() => {
              this.payload = this.notComputedPayload
            })
        }
      }
    },
    cancelWorkflow () {
      if (this.isEdit) {
        this.$router.push(
          `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.payload.name}?display_name=${this.payload.display_name}`
        )
      } else {
        this.$router.push(
          `/v1/projects/detail/${this.projectName}/pipelines?display_name=${this.payload.display_name}`
        )
      }
    },
    getWorkflowDetail (workflow_name) {
      getCustomWorkflowDetailAPI(workflow_name, this.projectName).then(res => {
        this.payload = jsyaml.load(res)
        this.handleEnv()
      })
    },
    handleEnv () {
      this.workflowCurJobLength = this.payload.stages[
        this.curStageIndex
      ].jobs.length
      if (this.payload.params.length > 0) {
        this.payload.params.forEach(item => {
          if (item.value && item.value.includes('<+fixed>')) {
            item.command = 'fixed'
            item.value = item.value.replaceAll('<+fixed>', '')
          }
        })
      }
      this.payload.stages.forEach(stage => {
        stage.jobs.forEach(job => {
          if (job.type === 'zadig-build') {
            if (job.spec && job.spec.service_and_builds) {
              job.spec.service_and_builds.forEach(service => {
                service.key_vals.forEach(item => {
                  if (item.value.includes('<+fixed>')) {
                    item.command = 'fixed'
                    item.value = item.value.replaceAll('<+fixed>', '')
                  }
                  if (item.value.includes('{{')) {
                    item.command = 'other'
                  }
                })
              })
            }
          }
          if (job.type === 'zadig-deploy') {
            if (job.spec.env.includes('fixed')) {
              job.spec.envType = 'fixed'
              job.spec.env = job.spec.env.replaceAll('<+fixed>', '')
            }
            if (job.spec.env.includes('{{')) {
              job.spec.envType = 'other'
            }
            if (job.spec.service_and_images.length > 0) {
              job.spec.serviceType = 'runtime'
            }
            if (job.spec.source === 'fromjob') {
              job.spec.serviceType = 'other'
            }
            // Mapping for value-key
            if (
              job.spec &&
              job.spec.service_and_images &&
              job.spec.service_and_images.length > 0
            ) {
              job.spec.service_and_images.forEach(service => {
                service.value = `${service.service_name}/${service.service_module}`
              })
            }
          }
          if (job.type === 'freestyle') {
            job.spec.properties.envs.forEach(item => {
              if (item.value.includes('<+fixed>')) {
                item.command = 'fixed'
                item.value = item.value.replaceAll('<+fixed>', '')
              }
              if (item.value.includes('{{')) {
                item.command = 'other'
              }
            })
          }
          if (job.type === 'plugin') {
            job.spec.plugin.inputs.forEach(item => {
              if (item.value && item.value.includes('<+fixed>')) {
                item.command = 'fixed'
                item.value = item.value.replaceAll('<+fixed>', '')
              }
              if (item.value && item.value.includes('{{')) {
                item.command = 'other'
              }
            })
          }
          if (job.type === 'zadig-test') {
            if (job.spec && job.spec.test_modules) {
              job.spec.test_modules.forEach(service => {
                service.key_vals.forEach(item => {
                  if (item.value.includes('<+fixed>')) {
                    item.command = 'fixed'
                    item.value = item.value.replaceAll('<+fixed>', '')
                  }
                  if (item.value.includes('{{')) {
                    item.command = 'other'
                  }
                })
              })
            }
          }
          if (job.type === 'zadig-distribute-image') {
            job.spec.targets.forEach(item => {
              item.value = `${item.service_name}/${item.service_module}`
            })
            if (job.spec.source === 'fromjob') {
              job.spec.source = 'other'
            }
          }
        })
      })
      this.multi_run = this.payload.multi_run
      this.originalWorkflow = cloneDeep(this.payload)
      this.$store.dispatch('setWorkflowInfo', cloneDeep(this.payload))
    },
    showStageOperateDialog (type, row) {
      this.insertSatgeIndex = this.payload.stages.length
      this.$store.dispatch('setCurOperateType', 'stageAdd')
      if (
        type === 'add' &&
        !this.isEdit &&
        this.payload.stages.length !== 0 &&
        this.stage.jobs.length === 0
      ) {
        this.$message.error(this.$t(`workflow.atLeastOneJob`))
        return
      }
      if (this.isShowFooter) {
        this.$message.error(this.$t(`workflow.saveLastJobconfigFirst`))
      } else {
        this.isShowStageOperateDialog = true
      }
      this.stageOperateType = type
      if (row) {
        if (!row.approval) {
          row.approval = {
            enabled: false,
            approve_users: [],
            timeout: null,
            needed_approvers: null,
            description: ''
          }
        }
        this.stage = cloneDeep(row)
      }
    },
    addStage (index) {
      this.showStageOperateDialog('add')
      this.insertSatgeIndex = index + 1
    },
    operateStage () {
      this.$refs.stageOperate.validate().then(valid => {
        if (valid) {
          if (this.stageOperateType === 'add') {
            this.stage = this.$refs.stageOperate.getData()
            this.payload.stages.splice(this.insertSatgeIndex, 0, this.stage)
            this.curStageIndex = this.payload.stages.length - 1
            this.curJobIndex = -1
            this.$store.dispatch('setIsShowFooter', false)
            this.setJob()
          } else {
            this.stage = this.$refs.stageOperate.getData()
            this.$set(this.payload.stages, this.curStageIndex, this.stage)
            this.curJobIndex = -2
          }
          this.$refs.stageOperate.reset()
          this.isShowStageOperateDialog = false
        }
      })
    },
    delStage (index, item) {
      this.$confirm(`确定删除阶段 [${item.name}]？`, '确认', {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      }).then(res => {
        const stages = this.payload.stages.filter(
          stage => stage.name !== item.name
        )
        this.curJobIndex = -2
        this.curStageIndex = 0
        this.$set(this.payload, 'stages', stages)
      })
    },
    setCurStage (index, item) {
      this.curStageIndex = index
      this.curStageInfo = item
    },
    saveJobConfig () {
      const allJobList = []
      this.payload.stages.forEach((stage, index) => {
        stage.jobs.forEach((job, j) => {
          if (j !== this.curJobIndex) {
            allJobList.push(job.name)
          }
        })
      })
      this.$refs[this.job.type].validate().then(valid => {
        if (valid) {
          const curJob = this.$refs[this.job.type].getData()
          if (!this.isEditJob && allJobList.includes(curJob.name)) {
            this.$message.error(this.$t(`workflow.duplicateJobName`))
            return false
          }
          this.$set(
            this.payload.stages[this.curStageIndex].jobs,
            this.curJobIndex,
            curJob
          )
          this.$store.dispatch('setIsShowFooter', false)
        }
      })
    },
    setJob () {
      if (this.payload.stages.length === 0) return
      this.job = cloneDeep(
        this.payload.stages[this.curStageIndex].jobs[this.curJobIndex]
      )
      if (this.job && [this.jobType.freestyle].includes(this.job.type)) {
        this.$nextTick(() => {
          this.$refs[this.job.type] && this.$refs[this.job.type].initOpe()
        })
      }
    },
    getServiceAndBuildList () {
      const projectName = this.projectName
      // const key = this.$utils.rsaEncrypt()
      getAssociatedBuildsAPI(projectName, true).then(res => {
        res.forEach(item => {
          item.value = `${item.service_name}/${item.service_module}`
        })
        this.serviceAndBuilds = res
        this.originServiceAndBuilds = res
      })
    },
    addServiceAndBuild (val) {
      let curService
      this.service.forEach(service => {
        curService = this.serviceAndBuilds.find(item => item.value === service)
        val.push(cloneDeep(curService))
      })
      // added need to del
      this.serviceAndBuilds = this.serviceAndBuilds.filter(item => {
        return item.value !== curService.value
      })
      this.service = []
    },
    handleDrawerChange () {
      if (this.curDrawer === 'high') {
        this.$refs.settings.validate().then(() => {
          this.$set(
            this.payload,
            'share_storages',
            this.$refs.settings.getData()
          )
          this.isShowDrawer = false
        })
      }
      if (this.curDrawer === 'env') {
        this.$refs.env.validate().then(() => {
          this.$set(this.payload, 'params', this.$refs.env.getData())
          this.isShowDrawer = false
        })
      }
      if (this.curDrawer === 'notify') {
        this.$set(this.payload, 'notify_ctls', this.$refs.notify.getData())
        this.isShowDrawer = false
      }
    },
    setCurDrawer (val) {
      this.isShowDrawer = true
      this.curDrawer = val
    },
    closeDrawer () {
      this.isShowDrawer = false
      this.curDrawer = ''
    },
    closeFooter () {
      if (
        this.workflowCurJobLength !==
        this.payload.stages[this.curStageIndex].jobs.length
      ) {
        this.payload.stages[this.curStageIndex].jobs.pop()
        this.curJobIndex = this.curJobIndex - 1
      }
      this.job = this.payload.stages[this.curStageIndex].jobs[this.curJobIndex]
      this.$store.dispatch('setIsShowFooter', false)
    },
    saveModel () {
      this.$refs.modelForm.validate(valid => {
        if (valid) {
          const params = {
            template_name: this.modelFormInfo.name,
            category: '',
            ...this.payload
          }
          addWorkflowTemplateAPI(params).then(res => {
            this.isShowModelDialog = false
            this.$message({
              type: 'success',
              message: '新增成功'
            })
          })
        }
      })
    }
  },
  watch: {
    activeName (newVal, oldVal) {
      if (newVal === 'yaml') {
        this.yaml = jsyaml.dump(this.payload)
        this.$store.dispatch('setIsShowFooter', false)
      } else {
        this.payload = jsyaml.load(this.yaml)
      }
    },
    curJobIndex (val) {
      if (val !== -2) {
        // 保存构建后设置为-2，什么都不执行，目的是为了两次点击同一个stage，能触发这个函数（有初始化动作 没有地方能看到触发的）
        this.setJob()
      }
    },
    curStageIndex (val, oldVal) {
      this.workflowCurJobLength = this.payload.stages[val].jobs.length
      this.setJob()
    },
    job: {
      handler (val) {
        if (val) {
          this.serviceAndBuilds = this.originServiceAndBuilds
          if (
            val.spec &&
            val.spec.service_and_builds &&
            val.spec.service_and_builds.length > 0
          ) {
            this.serviceAndBuilds = differenceWith(
              this.originServiceAndBuilds,
              val.spec.service_and_builds,
              (a, b) => {
                return a.value === `${b.service_name}/${b.service_module}`
              }
            )
          }
        }
      },
      deep: true
    },
    'payload.display_name': {
      handler (val, old_val) {
        if (!this.isEdit) {
          this.payload.name = pinyin(val, {
            style: pinyin.STYLE_NORMAL
          }).join('')
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>
.new-workflow-home {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #fff;
  border-top: 1px solid @borderGray;

  .left {
    position: relative;
    float: left;
    width: calc(~'100%' - 102px);
    height: 100%;

    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 42px;
      margin: 24px;
      padding: 0 24px;
      color: #121212;
      line-height: 42px;
      box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.1);

      .name {
        display: flex;

        &-input {
          display: inline-block;
          width: 180px;
        }

        /deep/.el-form-item {
          margin: 8px 0;
        }
      }

      .tab {
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
    }

    .scale {
      position: absolute;
      right: 0;
      bottom: 6%;
      cursor: pointer;

      .icon {
        margin-right: 4px;
        padding: 4px;
        border: 1px solid #ddd;
      }
    }

    main {
      width: 100%;
      height: 100%;
      padding: 0 24px;

      .ui {
        display: flex;

        &-text {
          line-height: 40px;
        }

        &-stage {
          position: relative;
          display: flex;

          .item {
            position: relative;

            .stage {
              width: 140px;
              margin: -6px 4px;
              padding: 8px 0;
              border: 2px dotted @borderGray;
              border-radius: 4px;
            }

            .del {
              position: absolute;
              top: -6px;
              right: -6px;
              display: none;
              font-size: 16px;
            }

            .edit {
              position: absolute;
              top: 6px;
              right: 20%;
              color: #666;
              font-size: 16px;
              cursor: pointer;
            }

            &:hover {
              .del {
                display: block;
              }
            }
          }
        }

        .stage-add {
          margin: 0 4px;
          font-size: 16px;
          border: 2px dotted @borderGray;
        }
      }
    }

    .yaml {
      .vue-codemirror {
        border: 1px solid #dcdfe6;
        border-radius: 4px;

        /deep/ .CodeMirror {
          height: 70vh;
        }
      }

      &-error {
        color: red;
        font-size: 14px;
        line-height: 40px;
      }
    }

    footer {
      position: relative;
      z-index: 1;
      height: 100%;
      font-size: 14px;
      background: #fff;
      box-shadow: 1px 1px 14px rgba(0, 0, 0, 0.1);

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 42px;
        padding: 0 24px;
        line-height: 42px;
        border-top: 1px solid #ddd;
        border-bottom: 1px solid #ddd;
      }

      .main {
        max-height: 80%;
        padding: 0 24px;
        overflow-y: auto;
      }
    }
  }

  .right {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    float: right;
    width: 100px;
    height: 100%;
    background: #fff;
    border-left: 1px solid @borderGray;

    &-tab {
      margin: 16px;
      font-size: 14px;
      cursor: pointer;

      &:hover {
        font-weight: 500;
      }
    }
  }

  .drawer {
    color: #555;

    &-title {
      display: flex;
      justify-content: space-between;
    }

    /deep/.el-drawer__body {
      padding: 0 24px;
    }

    /deep/ .el-drawer.rtl,
    .el-drawer__container {
      top: auto;
      right: 0;
      bottom: 0;
      height: calc(~'100% - 102px') !important;
    }
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
    margin-top: 20px;
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

    .add {
      position: absolute;
      bottom: 0;
      left: 18px;
      color: @themeColor;
      font-weight: 500;
      cursor: pointer;
    }
  }
}
</style>
