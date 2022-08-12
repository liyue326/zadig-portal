<template>
  <div class="new-workflow-home">
    <div class="left">
      <header>
        <div class="name">
          <CanInput v-model="payload.name" placeholder="工作流名称" :from="activeName" :disabled="!!isEdit" class="mg-r16" />
          <CanInput v-model="payload.description" :from="activeName" placeholder="描述信息" />
        </div>
        <div class="tab">
          <span
            class="tab-item"
            :class="{'active': activeName===item.name}"
            v-for="item in tabList"
            :key="item.name"
            @click="activeName = item.name"
          >{{item.label}}</span>
        </div>
        <div>
          <el-button type="primary" size="small" @click="operateWorkflow">保存</el-button>
          <el-button size="small" @click="cancelWorkflow">取消</el-button>
        </div>
      </header>
      <Multipane layout="horizontal" v-show="activeName === 'ui'" style="height: 100%;">
        <main class="mg-t16">
          <section class="ui">
            <span class="ui-text mg-r8">Start</span>
            <div class="line"></div>
            <div class="ui-stage" v-for="(item,index) in payload.stages" :key="item.label">
              <div class="item" @click="setCurStage(index,item)">
                <div @click="showStageOperateDialog('edit',item)" class="edit">
                  <i class="el-icon-s-tools"></i>
                </div>
                <Stage v-model="payload.stages[index]" :curJobIndex.sync="curJobIndex" />
                <div @click="delStage(index,item)" class="del">
                  <i class="el-icon-close"></i>
                </div>
              </div>
              <div class="line"></div>
            </div>
            <div>
              <el-button @click="showStageOperateDialog('add')" size="small" class="stage-add">+ 阶段</el-button>
            </div>
            <div class="line"></div>
            <span class="ui-text mg-l8">End</span>
          </section>
        </main>

        <MultipaneResizer class="multipane-resizer" v-if="isShowFooter&&activeName === 'ui'"></MultipaneResizer>
        <footer :style="{minHeight:'600px'}" v-if="isShowFooter">
          <div class="header">
            <span>{{curJobType}}</span>
            <div>
              <el-button size="mini" type="primary" @click="saveJobConfig">确定</el-button>
              <el-button size="mini" @click="closeFooter">取消</el-button>
            </div>
          </div>
          <div v-if="payload.stages.length > 0 && job" class="main">
            <el-form
              v-if="job.type !== jobType.freestyle"
              :rules="JobConfigRules"
              ref="jobRuleForm"
              :model="job"
              class="mg-t24 mg-b24"
              size="small"
            >
              <el-form-item label="任务名称" prop="name" v-if="payload.stages[curStageIndex] && payload.stages[curStageIndex].jobs.length > 0">
                <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
              </el-form-item>
              <el-form-item label="镜像仓库" prop="spec.docker_registry_id" v-if="job.type===jobType.build">
                <el-select v-model="job.spec.docker_registry_id" placeholder="请选择" size="small" style="width: 220px;">
                  <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
                </el-select>
              </el-form-item>
              <div v-if="payload.stages[curStageIndex].jobs.length > 0 && job.type === jobType.build" class="mg-t40">
                <ServiceAndBuild
                  :projectName="projectName"
                  v-model="job.spec.service_and_builds"
                  :originServiceAndBuilds="originServiceAndBuilds"
                  class="mg-b24"
                  :globalEnv="globalEnv"
                  ref="serviceAndbuild"
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
                >+ 添加</el-button>
              </div>
              <div v-if="job.type === 'plugin'">
                <Plugin v-model="job" ref="plugin" :globalEnv="globalEnv" />
              </div>
              <BuildEnv
                :projectName="projectName"
                v-if="job.type === jobType.deploy"
                v-model="job"
                ref="buildEnv"
                :originServiceAndBuilds="originServiceAndBuilds"
                :globalEnv="globalEnv"
                :workflowInfo="payload"
              ></BuildEnv>
            </el-form>
            <div v-else>
              <el-form
                :rules="JobConfigRules"
                ref="jobRuleForm"
                label-width="120px"
                :model="job"
                class="mg-t24"
                size="small"
                label-position="left"
              >
                <el-form-item
                  label="任务名称"
                  prop="name"
                  v-if="payload.stages[curStageIndex] && payload.stages[curStageIndex].jobs.length > 0"
                >
                  <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
                </el-form-item>
              </el-form>
              <JobCommonBuild :globalEnv="globalEnv" :ref="beInitCompRef" v-model="job" :workflowInfo="payload"></JobCommonBuild>
            </div>
          </div>
        </footer>
      </Multipane>
      <section v-show="activeName === 'yaml'" class="yaml">
        <div class="yaml-error">{{yamlError}}</div>
        <codemirror class="codemirror" ref="yamlEditor" v-model="yaml" :options="editorOptions" @blur="checkYaml"></codemirror>
      </section>
    </div>
    <div class="right">
      <div v-for="item in configList" :key="item.label" class="right-tab" @click="setCurDrawer(item.value)">{{item.label}}</div>
    </div>
    <el-drawer :visible.sync="isShowDrawer" direction="rtl" :modal-append-to-body="false" :show-close="false" class="drawer" size="40%">
      <span slot="title" class="drawer-title">
        <span>{{drawerTitle}}</span>
        <div>
          <el-button type="primary" size="mini" plain @click="handleDrawerChange">确定</el-button>
          <el-button size="mini" plain @click="isShowDrawer=false">取消</el-button>
        </div>
      </span>
      <span v-if="curDrawer === 'high'">
        <div class="mg-b16">运行策略</div>
        <el-form>
          <el-form-item>
            <span class="mg-r16">
              <span>并发运行</span>
              <el-tooltip effect="dark" content="当同时更新多个不同服务时，产生的多个任务将会并发执行，以提升工作流运行效率" placement="top">
                <i class="pointer el-icon-question"></i>
              </el-tooltip>
            </span>
            <el-switch v-model="multi_run"></el-switch>
          </el-form-item>
        </el-form>
      </span>
      <div v-if="curDrawer === 'env'">
        <Env :preEnvs="payload" ref="env" />
      </div>
    </el-drawer>
    <el-dialog :title="stageOperateType === 'add' ? '新建阶段' : '编辑阶段'" :visible.sync="isShowStageOperateDialog" width="30%">
      <StageOperate ref="stageOperate" :stageInfo="stage" :type="stageOperateType" />
      <div slot="footer">
        <el-button @click="isShowStageOperateDialog = false" size="small">取 消</el-button>
        <el-button type="primary" @click="operateStage('',stage)" size="small">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import {
  tabList,
  configList,
  jobTabList,
  editorOptions,
  jobType,
  jobTypeList,
  globalConstEnvs
} from './config'
import {
  getAssociatedBuildsAPI,
  addCustomWorkflowAPI,
  updateCustomWorkflowAPI,
  getCustomWorkflowDetailAPI,
  getRegistryWhenBuildAPI,
  checkCustomWorkflowYaml
} from '@api'
import { Multipane, MultipaneResizer } from 'vue-multipane'
import CanInput from './components/canInput'
import Stage from './stage.vue'
import StageOperate from './stageOperate.vue'
import ServiceAndBuild from './components/jobServiceAndBuild'
import BuildEnv from './components/jobBuildEnv.vue'
import JobCommonBuild from './components/jobCommonBuild.vue'
import Plugin from './components/plugin.vue'
import RunCustomWorkflow from '../../common/runCustomWorkflow'
import Service from '../../../guide/helm/service.vue'
import Env from './components/env.vue'
import jsyaml from 'js-yaml'
import bus from '@utils/eventBus'
import { codemirror } from 'vue-codemirror'
import { cloneDeep, differenceWith } from 'lodash'
const validateName = (rule, value, callback) => {
  const reg = /^[a-z][a-z0-9-]{0,32}$/
  if (value === '') {
    callback(new Error('请输入任务名称'))
  } else if (!reg.test(value)) {
    callback(
      new Error(
        '支持小写英文字母、数字或者中划线，必须小写英文字母开头，最多 32 位。'
      )
    )
  } else {
    callback()
  }
}
export default {
  name: 'CustomWorkflow',
  data () {
    return {
      tabList,
      configList,
      jobTabList,
      globalConstEnvs,
      activeName: 'ui',
      editorOptions,
      jobType,
      stage: {
        name: '',
        parallel: false,
        approval: {
          enabled: false,
          approve_users: [],
          timeout: null,
          needed_approvers: null,
          description: ''
        },
        jobs: []
      },
      job: {
        name: '',
        spec: {
          docker_registry_id: ''
        }
      },
      stageOperateType: 'add',
      payload: {
        name: '',
        project: '',
        description: '',
        multi_run: false,
        stages: [],
        params: []
      },
      curStageIndex: 0,
      curJobIndex: -2, // 不指向 job
      curDrawer: 'high',
      isShowStageOperateDialog: false,
      serviceAndBuilds: [],
      originServiceAndBuilds: [],
      dockerList: [],
      service: '',
      yaml: '',
      yamlError: '',
      isShowDrawer: false,
      multi_run: false,
      JobConfigRules: {
        name: [
          {
            required: true,
            trigger: 'blur',
            validator: validateName
          }
        ],
        spec: {
          docker_registry_id: [
            {
              required: true,
              message: '请选择镜像',
              trigger: 'blur'
            }
          ]
        }
      },
      beInitCompRef: 'beInitCompRef'
    }
  },
  components: {
    CanInput,
    Stage,
    StageOperate,
    Multipane,
    MultipaneResizer,
    ServiceAndBuild,
    BuildEnv,
    JobCommonBuild,
    Service,
    RunCustomWorkflow,
    codemirror,
    Plugin,
    Env
  },
  computed: {
    projectName () {
      return this.$route.query.projectName
    },
    isShowFooter () {
      return this.$store.state.customWorkflow.isShowFooter
    },
    isEdit () {
      return this.$route.params.workflow_name
    },
    curJobType () {
      const curType = jobTypeList.find(item => item.type === this.job.type)
      return curType ? curType.label : this.job.spec.plugin.name
    },
    // globalEnv () {
    //   const res = this.payload.params.map(item => {
    //     return `{{.workflow.params.${item.name}}}`
    //   })
    //   console.log(res)
    //   return this.globalConstEnvs.concat(res)
    // },
    drawerTitle () {
      const res = this.configList.find(item => {
        return item.value === this.curDrawer
      })
      return res.label
    }
  },
  created () {
    this.init()
  },
  methods: {
    init () {
      this.getRegistryWhenBuild()
      this.getServiceAndBuildList()
      this.setTitle()
      // edit
      if (this.isEdit) {
        this.getWorkflowDetail(this.$route.params.workflow_name)
      }
      this.$store.dispatch('setIsShowFooter', false)
    },
    setTitle () {
      bus.$emit('set-topbar-title', {
        title: '',
        breadcrumb: [
          { title: '项目', url: '/v1/projects' },
          {
            title: this.projectName,
            isProjectName: true,
            url: `/v1/projects/detail/${this.projectName}/detail`
          },
          {
            title: '工作流',
            url: `/v1/projects/detail/${this.projectName}/pipelines`
          },
          {
            title: this.$route.params.workflow_name,
            url: `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.$route.params.workflow_name}`
          }
        ]
      })
    },
    checkYaml () {
      checkCustomWorkflowYaml(this.yaml)
        .then(res => {
          this.yamlError = ''
        })
        .catch(error => {
          this.yamlError = error.response.data.description
        })
    },
    operateWorkflow () {
      if (this.activeName === 'yaml') {
        this.payload = jsyaml.load(this.yaml)
      }
      if (!this.payload.name) {
        this.$message.error(' 请填写工作流名称')
        return
      }
      if (this.payload.stages.length === 0) {
        this.$message.error(' 请至少填写一个阶段')
        return
      }
      this.payload.stages.forEach(item => {
        if (item.jobs.length === 0) {
          this.$message.error(`请填写 ${item.name} 中的任务`)
          throw Error()
        }
      })
      if (this.isShowFooter) {
        this.$message.error('请先保存任务配置')
        return
      }
      this.saveWorkflow()
    },
    saveWorkflow () {
      this.payload.project = this.projectName
      const yamlParams = jsyaml.dump(this.payload)
      const workflowName = this.payload.name
      if (this.$route.fullPath.includes('edit')) {
        updateCustomWorkflowAPI(
          workflowName,
          yamlParams,
          this.projectName
        ).then(res => {
          this.$message.success('编辑成功')
          this.getWorkflowDetail(this.payload.name)
          this.$router.push(
            `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.payload.name}`
          )
        })
      } else {
        addCustomWorkflowAPI(yamlParams, this.projectName).then(res => {
          this.$message.success('新建成功')
          this.getWorkflowDetail(this.payload.name)
          this.$router.push(
            `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.payload.name}`
          )
        })
      }
    },
    cancelWorkflow () {
      if (this.isEdit) {
        this.$router.push(
          `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.payload.name}`
        )
      } else {
        this.$router.push(`/v1/projects/detail/${this.projectName}/pipelines`)
      }
    },
    getWorkflowDetail (workflow_name) {
      getCustomWorkflowDetailAPI(workflow_name, this.projectName).then(res => {
        this.payload = jsyaml.load(res)
        this.payload.params.forEach(item => {
          if (item.value.includes('fixed')) {
            item.command = 'fixed'
            item.value = item.value.slice(8)
          }
        })
        this.payload.stages.forEach(stage => {
          stage.jobs.forEach(job => {
            if (job.spec && job.spec.service_and_builds) {
              job.spec.service_and_builds.forEach(service => {
                service.key_vals.forEach(item => {
                  if (item.value.includes('fixed')) {
                    item.command = 'fixed'
                    item.value = item.value.slice(8)
                  }
                  if (item.value.includes('{{')) {
                    item.command = 'other'
                  }
                })
              })
            }
            if (job.type === 'zadig-deploy') {
              if (job.spec.env.includes('fixed')) {
                job.spec.envType = 'fixed'
                job.spec.env = job.spec.env.slice(8)
              }
              if (job.spec.env.includes('{{')) {
                job.spec.envType = 'other'
              }
              if (job.spec.service_and_images.length > 0) {
                job.spec.serviceType = 'runtime'
              }
              if (job.spec.job_name.includes('{{')) {
                job.spec.serviceType = 'other'
              }
            }
            if (job.type === 'freestyle') {
              job.spec.properties.envs.forEach(item => {
                if (item.value.includes('fixed')) {
                  item.command = 'fixed'
                  item.value = item.value.slice(8)
                }
                if (item.value.includes('{{')) {
                  item.command = 'other'
                }
              })
            }
            if (job.type === 'plugin') {
              job.spec.plugin.inputs.forEach(item => {
                if (item.value && item.value.includes('fixed')) {
                  item.command = 'fixed'
                  item.value = item.value.slice(8)
                }
                if (item.value && item.value.includes('{{')) {
                  item.command = 'other'
                }
              })
            }
          })
        })
        this.multi_run = this.payload.multi_run
        this.$store.dispatch('setWorkflowInfo', cloneDeep(this.payload))
      })
    },
    showStageOperateDialog (type, row) {
      if (
        type === 'add' &&
        !this.isEdit &&
        this.payload.stages.length !== 0 &&
        this.stage.jobs.length === 0
      ) {
        this.$message.error('请至少创建一个任务')
        return
      }
      if (this.isShowFooter) {
        this.$message.error('请先保存上一个任务配置')
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
    operateStage () {
      this.$refs.stageOperate.validate().then(valid => {
        if (valid) {
          if (this.stageOperateType === 'add') {
            this.stage = this.$refs.stageOperate.getData()
            this.payload.stages.push(this.stage)
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
        confirmButtonText: '确定',
        cancelButtonText: '取消',
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
      return new Promise((resolve, reject) => {
        this.$refs.jobRuleForm.validate().then(valid => {
          if (valid) {
            if (this.job.type === jobType.deploy) {
              this.$refs.buildEnv.validate().then(valid => {
                this.job = this.$refs.buildEnv.getData()
                if (valid) {
                  this.$set(
                    this.payload.stages[this.curStageIndex].jobs,
                    this.curJobIndex,
                    this.job
                  )
                  this.$store.dispatch('setIsShowFooter', false)
                  resolve()
                }
              })
              reject()
            } else if (this.job.type === jobType.build) {
              if (this.$refs.serviceAndbuild.validate()) {
                this.job.spec.service_and_builds = this.$refs.serviceAndbuild.getData()
                this.$set(
                  this.payload.stages[this.curStageIndex].jobs,
                  this.curJobIndex,
                  this.job
                )
                this.$store.dispatch('setIsShowFooter', false)
                reject()
              } else {
                this.$message.error('请至少选择一个服务组件')
                reject()
              }
            } else if (this.job.type === jobType.freestyle) {
              this.$refs[this.beInitCompRef]
                .validate()
                .then(job => {
                  delete this.job.isCreate // 去除新建状态
                  this.$set(
                    this.payload.stages[this.curStageIndex].jobs,
                    this.curJobIndex,
                    job
                  )
                  this.$store.dispatch('setIsShowFooter', false)
                  this.curJobIndex = -2 // 为了反复切换同一个构建不能初始化
                  resolve()
                })
                .catch(err => {
                  console.log('common build valid error', err)
                  reject(err)
                })
            } else if (this.job.type === jobType.plugin) {
              this.$refs.plugin.validate().then(res => {
                this.$set(
                  this.payload.stages[this.curStageIndex].jobs,
                  this.curJobIndex,
                  res
                )
              })
              this.$store.dispatch('setIsShowFooter', false)
            }
          }
        })
      })
    },
    setJob () {
      if (this.payload.stages.length === 0) return
      this.job = cloneDeep(
        this.payload.stages[this.curStageIndex].jobs[this.curJobIndex]
      )
      if (this.job && [this.jobType.freestyle].includes(this.job.type)) {
        this.$nextTick(() => {
          this.$refs[this.beInitCompRef] &&
            this.$refs[this.beInitCompRef].initOpe()
        })
      }
    },
    getRegistryWhenBuild () {
      const projectName = this.projectName
      getRegistryWhenBuildAPI(projectName).then(res => {
        this.dockerList = res
      })
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
        this.$set(this.payload, 'multi_run', this.multi_run)
      }
      if (this.curDrawer === 'env') {
        console.log(this.$refs.env.getData())
        this.$set(this.payload, 'params', this.$refs.env.getData())
      }
      this.$message.success('设置成功')
      this.isShowDrawer = false
    },
    setCurDrawer (val) {
      this.isShowDrawer = true
      this.curDrawer = val
    },
    closeFooter () {
      this.job = this.payload.stages[this.curStageIndex].jobs[this.curJobIndex]
      this.$store.dispatch('setIsShowFooter', false)
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
    payload: {
      handler (val, oldVal) {
        const res = val.params.map(item => {
          return `{{.workflow.params.${item.name}}}`
        })
        this.globalEnv = this.globalConstEnvs.concat(res)
        this.setJob()
      },
      deep: true
    },
    curJobIndex (val) {
      if (val !== -2) {
        // 保存构建后设置为-2，什么都不执行，目的是为了两次点击同一个stage，能触发这个函数（有初始化动作 没有地方能看到触发的）
        this.setJob()
      }
    },
    curStageIndex () {
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
    }
  }
}
</script>

<style lang="less" scoped>
.new-workflow-home {
  display: flex;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  background: #fff;
  border-top: 1px solid @borderGray;

  .left {
    flex: 1;

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

    main {
      width: 100%;
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
        max-height: 400px;
        padding: 0 24px;
        overflow-y: scroll;
      }
    }
  }

  .right {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100px;
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
    width: 70px;
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
  }
}
</style>
