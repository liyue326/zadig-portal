<template>
  <div class="webhook">
    <el-button type="primary" size="mini" icon="el-icon-plus" plain @click="triggerTypeDialogVisible = true">{{$t(`global.add`)}}</el-button>
    <div>
      <el-row :gutter="20" class="webhook-row" v-for="(item,index) in webhooks" :key="index">
        <el-col :span="2">
          <div class="content">
            <el-switch v-model="item.enabled" @change="changeWebhookStatus(item)"></el-switch>
          </div>
        </el-col>
        <el-col :span="1">
          <div class="content">
            <span class="iconfont icongit"></span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="content">
            <div class="cate">
              <span class="title">名称：</span>
              <span class="desc">{{item.name}}</span>
            </div>
            <div class="cate">
              <span class="title">{{$t(`global.repository`)}}</span>
              <span class="desc">{{item.main_repo.repo_name + '/' + item.main_repo.branch}}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="9">
          <div class="content">
            <div class="cate">
              <span class="title">{{$t(`workflow.targetBranch`)}}</span>
              <span class="desc">{{item.main_repo.branch}}</span>
            </div>
            <div class="cate">
              <span class="title">{{$t(`workflow.triggerEvents`)}}</span>
              <span class="desc">
                <div v-if="item.main_repo.events.length">
                  <span v-for="(event,index) in item.main_repo.events" :key="index">
                    <span
                      v-if="item.main_repo.source === 'gerrit'"
                    >{{ triggerMethods.gerrit.find(tri => tri.value === event)?triggerMethods.gerrit.find(tri => tri.value === event).label: 'N/A' }}</span>
                    <span
                      v-else
                    >{{ triggerMethods.git.find(tri => tri.value === event)?triggerMethods.git.find(tri => tri.value === event).label: 'N/A' }}</span>
                    <span v-if="index !== item.main_repo.events.length - 1">,</span>
                  </span>
                </div>
                <span v-else>{{ 'N/A' }}</span>
              </span>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="content">
            <div class="cate">
              <span class="title">描述：</span>
            </div>
            <div class="cate">
              <span class="desc">{{item.description}}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="2">
          <div class="content">
            <div class="operation">
              <span class="el-icon-edit" @click="editWebhook(item)"></span>
              <span class="el-icon-delete" @click="removeWebhook(index,item.name)"></span>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="webhook-row" v-for="(item,index) in timers" :key="item.id">
        <el-col :span="2">
          <div class="content">
            <el-switch v-model="item.enabled" @change="changeTimerStatus(item)"></el-switch>
          </div>
        </el-col>
        <el-col :span="1">
          <div class="content">
            <span class="el-icon-time"></span>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="content">
            <div class="cate">
              <span class="title">{{$t(`workflow.triggerWay`)}}</span>
              <span v-if="item.job_type === 'timing'" class="desc">{{$t(`triggerWay.timing`)}}</span>
              <span v-else-if="item.job_type === 'gap'" class="desc">{{$t(`triggerWay.gap`)}}</span>
              <span v-else-if="item.job_type === 'crontab'" class="desc">{{$t(`triggerWay.crontab`)}}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="9">
          <div class="content">
            <div class="cate">
              <span v-if="item.job_type === 'timing'|| item.job_type === 'gap'" class="title">时间配置：</span>
              <span v-if="item.job_type === 'crontab'" class="title">表达式：</span>
              <span v-if="item.job_type === 'timing'" class="desc">{{ translateDate(item.frequency) }}&nbsp;&nbsp;{{ item.time }}</span>
              <span
                v-if="item.job_type === 'gap'"
                class="desc"
              >每&nbsp;&nbsp;{{ item.number }}&nbsp;&nbsp;{{ item.frequency === 'hours' ? '小时' : '分钟'}}</span>
              <span v-if="item.job_type === 'crontab'" class="desc">{{ item.cron }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="4"></el-col>
        <el-col :span="2">
          <div class="content">
            <div class="operation">
              <span class="el-icon-edit" @click="editTimer(item)"></span>
              <span class="el-icon-delete" @click="removeTimer(index,item.id)"></span>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-dialog
      :visible.sync="webhookDialogVisible"
      :title="webhookEditMode?$t(`workflow.editTrigger`):$t(`workflow.addTrigger`)"
      width="800px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form ref="webhookForm" :model="currentWebhook" label-position="left" :label-width="curLanguage === 'zh-cn' ?'120px' :'160px'" :rules="webhookRules">
        <el-form-item :label="$t(`global.name`)" prop="name">
          <el-input
            size="small"
            autofocus
            ref="webhookNamedRef"
            :disabled="webhookEditMode"
            v-model="currentWebhook.name"
            :placeholder="$t(`global.inputName`)"
          ></el-input>
        </el-form-item>
        <el-form-item :label="$t('global.desc')" prop="description">
          <el-input size="small" type="textarea" v-model="currentWebhook.description" placeholder="请输入描述"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`global.repository`)" prop="repo">
          <el-select
            style="width: 100%;"
            v-model="currentWebhook.repo"
            size="small"
            @change="changeRepo"
            filterable
            allow-create
            clearable
            value-key="key"
            placeholder="请选择"
          >
            <el-option v-for="(repo,index) in webhookRepos" :key="index" :label="repo.repo_owner+'/'+repo.repo_name" :value="repo"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          :label="$t(`workflow.targetBranch`)"
          prop="main_repo.branch"
          v-if="checkGitRepo"
          :rules="[
          { required: true, message: currentWebhook.main_repo.is_regular ? $t(`workflow.inputRegExpressionConfiguration`):$t(`workflow.selectTargetBranch`), trigger: ['blur', 'change'] }
        ]"
        >
          <el-input
            style="width: 100%;"
            v-if="currentWebhook.main_repo.is_regular"
            v-model="currentWebhook.main_repo.branch"
            :placeholder="$t(`workflow.inputRegExpressionConfiguration`)"
            size="small"
          ></el-input>

          <el-select
            v-else
            style="width: 100%;"
            v-model="currentWebhook.main_repo.branch"
            size="small"
            filterable
            allow-create
            clearable
            placeholder="请选择分支"
          >
            <el-option
              v-for="(branch,index) in webhookBranches[currentWebhook.repo.repo_name]"
              :key="index"
              :label="branch.name"
              :value="branch.name"
            ></el-option>
          </el-select>
          <el-switch
            v-if="currentWebhook.repo.source!=='gerrit'"
            v-model="currentWebhook.main_repo.is_regular"
            :active-text="$t(`workflow.regularExpressionConfiguration`)"
            @change="currentWebhook.main_repo.branch = '';matchedBranchNames=null;"
          ></el-switch>
          <div v-show="currentWebhook.main_repo.is_regular">
            <span v-show="matchedBranchNames">当前正则匹配到的分支：{{matchedBranchNames && matchedBranchNames.length === 0 ? '无': ''}}</span>
            <span style="display: inline-block; padding-right: 10px;" v-for="branch in matchedBranchNames" :key="branch">{{ branch }}</span>
          </div>
        </el-form-item>
        <el-form-item v-if="currentWebhook.repo.source==='gerrit'" :label="$t(`workflow.triggerEvents`)" prop="main_repo.events">
          <el-checkbox-group v-model="currentWebhook.main_repo.events">
            <el-checkbox style="display: block;" label="change-merged">Change merged</el-checkbox>
            <el-checkbox style="display: block;" label="patchset-created">
              <span>Patchset created</span>
              <template v-if="currentWebhook.main_repo.events.includes('patchset-created')">
                <span style="color: #606266;">评分标签</span>
                <el-input size="mini" style="width: 200px;" v-model="currentWebhook.main_repo.label" placeholder="Code-Review"></el-input>
              </template>
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-else-if="currentWebhook.repo.source!=='gerrit'" :label="$t(`workflow.triggerEvents`)" prop="main_repo.events">
          <el-checkbox-group v-model="currentWebhook.main_repo.events">
            <el-checkbox v-for="tri in triggerMethods.git" :key="tri.value" :label="tri.value">{{ tri.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item :label="$t(`workflow.triggerStrategy`)" prop="auto_cancel">
          <el-checkbox v-model="currentWebhook.auto_cancel">
            <span>{{$t(`global.autoCancel`)}}</span>
            <el-tooltip effect="dark" content="如果您希望只构建最新的提交，则使用这个选项会自动取消队列中的任务" placement="top">
              <i class="el-icon-question"></i>
            </el-tooltip>
          </el-checkbox>
          <el-checkbox v-if="currentWebhook.repo.source==='gerrit'" v-model="currentWebhook.check_patch_set_change">
            <span>代码无变化时不触发工作流</span>
            <el-tooltip effect="dark" content="例外情况说明：当目标代码仓配置为 Gerrit 的情况下，受限于其 API 的能力，当单行代码有变化时也不被触发" placement="top">
              <i class="el-icon-question"></i>
            </el-tooltip>
          </el-checkbox>
        </el-form-item>
        <template v-if="currentWebhook.main_repo.source!=='gerrit'">
          <el-form-item :label="$t(`global.fileDirectory`)" prop="main_repo.match_folders">
            <el-input
              :autosize="{ minRows: 4, maxRows: 10}"
              type="textarea"
              v-model="currentWebhook.main_repo.match_folders"
              placeholder="输入目录时，多个目录请用回车换行分隔"
            ></el-input>
          </el-form-item>
          <ul style="color: #909399; font-size: 12px; line-height: 20px;" :style="{'paddingLeft':curLanguage === 'zh-cn' ?'120px' :'160px'}">
            <li>输入目录时，多个目录请用回车换行分隔</li>
            <li>"/" 表示代码库中的所有文件</li>
            <li>用 "!" 符号开头可以排除相应的文件</li>
          </ul>
        </template>
      </el-form>
      <div>
        <span>{{$t(`workflow.workflowExecutionVariables`)}}</span>
        <WebhookRunConfig
          :workflowName="workflowName"
          :projectName="projectName"
          :cloneWorkflow="currentWebhook.workflow_arg"
          :webhookSelectedRepo="currentWebhook.repo"
        />
      </div>
      <div slot="footer">
        <el-button @click="webhookDialogVisible = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="saveWebhook" size="small">{{$t(`global.confirm`)}}</el-button>
      </div>
    </el-dialog>

    <el-dialog
      :title="timerEditMode?$t(`workflow.editTimer`):$t(`workflow.addTimer`)"
      :visible.sync="timerDialogVisible"
      width="800px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form :model="currentTimer" ref="timerForm" :rules="timerRules" label-width="110px" label-position="left">
        <el-form-item :label="$t(`workflow.triggerWay`)" prop="job_type">
          <el-radio-group v-model="currentTimer.job_type" @change="changeTimerType">
            <el-radio label="timing">{{$t(`triggerWay.timing`)}}</el-radio>
            <el-radio label="gap">{{$t(`triggerWay.gap`)}}</el-radio>
            <el-radio label="crontab">{{$t(`triggerWay.crontab`)}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t(`workflow.timeConfig`)">
          <div v-if="currentTimer.job_type === 'timing'" class="inline-show">
            <!--定时-->
            <el-form-item prop="frequency">
              <el-select v-model="currentTimer.frequency" size="small" style="width: 150px;" placeholder="请选择">
                <el-option v-for="(item,index) in timerDateOptions" :key="index" :label="item.label" :value="item.value"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item prop="time">
              <el-time-picker
                v-model="currentTimer.time"
                value-format="HH:mm"
                format="HH:mm"
                size="small"
                style="width: 150px;"
                placeholder="请选择时间"
              ></el-time-picker>
            </el-form-item>
          </div>
          <div v-else-if="currentTimer.job_type === 'gap'" class="inline-show">
            <!--间隔-->
            <el-form-item prop="number">
              <el-input-number v-model="currentTimer.number" :min="1" size="small" style="width: 150px;"></el-input-number>
            </el-form-item>
            <el-form-item prop="frequency">
              <el-select v-model="currentTimer.frequency" size="small" style="width: 150px;">
                <el-option label="分钟" value="minutes"></el-option>
                <el-option label="小时" value="hours"></el-option>
              </el-select>
            </el-form-item>
          </div>
          <div v-else-if="currentTimer.job_type === 'crontab'">
            <!--Cron-->
            <el-form-item prop="cron">
              <el-input v-model="currentTimer.cron" placeholder="输入 Cron 表达式，用空格隔开" size="small" style="width: 300px;" />
            </el-form-item>
          </div>
        </el-form-item>
      </el-form>
      <div v-if="currentTimer.job_type === 'crontab'">
        <span style="display: inline-block; margin-bottom: 10px;">Cron 表达式解析</span>
        <el-table
          :data="cronExpressionParse"
          border
          size="small"
          class="cron-table-show"
          :header-cell-style="()=>{return {background: '#dddddd'}}"
          :cell-style="()=>{return {height:'30px'}}"
        >
          <el-table-column prop="min" label="分钟"></el-table-column>
          <el-table-column prop="hour" label="小时"></el-table-column>
          <el-table-column prop="date" label="日期"></el-table-column>
          <el-table-column prop="month" label="月份"></el-table-column>
          <el-table-column prop="week" label="星期"></el-table-column>
        </el-table>
      </div>
      <div style="margin: 10px 0;">
        <span style="display: inline-block; margin-bottom: 10px;">{{$t(`workflow.workflowExecutionVariables`)}}</span>
        <WebhookRunConfig :workflowName="workflowName" :projectName="projectName" :cloneWorkflow="currentTimer.workflow_v4_args" />
      </div>
      <div slot="footer">
        <el-button @click="timerDialogVisible = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="saveTimer" size="small">{{$t(`global.confirm`)}}</el-button>
      </div>
    </el-dialog>

    <el-dialog
      :visible.sync="triggerTypeDialogVisible"
      :title="$t(`workflow.addTrigger`)"
      width="400px"
      :close-on-click-modal="false"
      custom-class="trigger-types-dialog"
      append-to-body
    >
      <div class="trigger-types-container">
        <span>{{$t(`workflow.selectTriggerType`)}}</span>
        <div class="trigger-item" @click="triggerTypeDialogVisible = false;addWebhook()">
          <div class="icon">
            <span class="iconfont iconvery-master"></span>
          </div>
          <div class="detail">
            <h4 class="trigger-title">{{$t(`workflow.gitTrigger`)}}</h4>
            <span class="trigger-desc">{{$t(`workflow.codeChangeTrigger`)}}</span>
          </div>
        </div>
        <div class="trigger-item" @click="triggerTypeDialogVisible = false;addTimer()">
          <div class="icon">
            <span class="iconfont iconvery-time"></span>
          </div>
          <div class="detail">
            <h4 class="trigger-title">{{$t(`workflow.timer`)}}</h4>
            <span class="trigger-desc">{{$t(`workflow.timedTrigger`)}}</span>
          </div>
        </div>
      </div>
      <div slot="footer">
        <el-button @click="triggerTypeDialogVisible = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <!-- <el-button type="primary" @click="triggerTypeDialogVisible = false" size="small">{{$t(`global.confirm`)}}</el-button> -->
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { cloneDeep, isEqual, uniqBy, debounce } from 'lodash'
import WebhookRunConfig from './webhookRunConfig.vue'
import store from 'storejs'
import {
  getBranchInfoByIdAPI,
  addCustomWebhookAPI,
  getCustomWebhooksAPI,
  removeCustomWebhookAPI,
  updateCustomWebhookAPI,
  getCustomWebhookPresetAPI,
  addCustomTimerAPI,
  getCustomTimersAPI,
  removeCustomTimerAPI,
  updateCustomTimerAPI,
  getCustomTimerPresetAPI,
  checkRegularAPI
} from '@api'
const validateName = (rule, value, callback) => {
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9_\-\.]*[a-zA-Z0-9])?$/.test(value)) {
    callback(
      new Error(
        "触发器名称仅支持数字字符、'-'、'_'、'.' 且开始结束只能是数字字符"
      )
    )
  } else {
    callback()
  }
}
const validateRepo = (rule, value, callback) => {
  if (Object.keys(value).length === 0) {
    callback(new Error('请选择代码库'))
  } else {
    callback()
  }
}
const checkCron = (rule, value, callback) => {
  if (value.trim().split(/\s+/).length !== 5) {
    callback(new Error('请检查格式，仅支持 5 位！'))
  } else if (!/^[0-9\s/\-\*\,]+$/.test(value)) {
    callback(new Error('请检查格式，仅支持数字 * , - / '))
  } else {
    callback()
  }
}
const webhookInfo = {
  check_patch_set_change: false, // gerrit 类型 codehost 需要配置，代码无变更是否跳过
  name: '',
  auto_cancel: false,
  enabled: true,
  description: '',
  repos: [],
  main_repo: {
    source: '',
    repo_owner: '',
    repo_namespace: '',
    repo_name: '',
    branch: '',
    tag: '',
    label: '', // gerrit 类型 codehost，event 包含 patchset-created 需要配置
    committer: '',
    match_folders: '/\n!.md',
    codehost_id: null,
    is_regular: false, // 是否正则匹配
    events: [
      // # gerrit 类型 codehost: patchset-created,change-merged,剩余类型 codehost: push, pull_request,tag
    ]
  },
  repo: {},
  workflow_arg: {}
}

const timerInfo = {
  number: 1,
  frequency: '',
  time: '',
  max_failures: 1,
  job_type: 'timing',
  cron: '******',
  enabled: true,
  workflow_v4_args: {}
}
export default {
  data () {
    return {
      triggerTypeDialogVisible: false,
      webhookDialogVisible: false,
      timerDialogVisible: false,
      selectType: '',
      webhookEditMode: true,
      timerEditMode: true,
      webhooks: [],
      timers: [],
      currentWebhook: cloneDeep(webhookInfo),
      currentTimer: cloneDeep(timerInfo),
      webhookBranches: {},
      webhookRepos: [],
      triggerMethods: {
        git: [
          {
            value: 'push',
            label: 'Push commits'
          },
          {
            value: 'pull_request',
            label: 'Pull requests'
          },
          {
            value: 'tag',
            label: 'Push tags'
          }
        ],
        gerrit: [
          {
            value: 'change-merged',
            label: 'Change merged'
          },
          {
            value: 'patchset-created',
            label: 'Patchset created'
          }
        ]
      },
      webhookRules: {
        name: [{ trigger: 'change', required: true, validator: validateName }],
        repo: [{ trigger: 'change', required: true, validator: validateRepo }],
        'main_repo.branch': [
          {
            required: true,
            message: '请选择目标分支',
            trigger: ['blur', 'change']
          }
        ],
        'main_repo.events': [
          {
            required: true,
            message: '请选择触发事件',
            trigger: ['blur', 'change']
          }
        ],
        'main_repo.match_folders': [
          {
            required: true,
            message: '请输入文件目录',
            trigger: ['blur', 'change']
          }
        ]
      },
      timerRules: {
        job_type: [
          { required: true, message: '请选择触发方式', trigger: 'blur' }
        ],
        frequency: [{ required: true, message: '请选择周期', trigger: 'blur' }],
        time: [{ required: true, message: '请填选择时间', trigger: 'blur' }],
        number: [{ required: true, message: '请填选择时间', trigger: 'blur' }],
        cron: [{ required: true, validator: checkCron, trigger: 'blur' }]
      },
      timerDateOptions: [
        { label: '每天', value: 'day' },
        { label: '每周一', value: 'monday' },
        { label: '每周二', value: 'tuesday' },
        { label: '每周三', value: 'wednesday' },
        { label: '每周四', value: 'thursday' },
        { label: '每周五', value: 'friday' },
        { label: '每周六', value: 'saturday' },
        { label: '每周日', value: 'sunday' }
      ],
      matchedBranchNames: null,
      curLanguage: store.get('language')
    }
  },
  props: {
    config: {
      type: Object,
      required: true,
      default: () => ({})
    },
    isEdit: {
      type: Boolean,
      required: true
    },
    isShowDrawer: {
      type: Boolean,
      required: true,
      default: false
    },
    originalWorkflow: {
      required: true,
      type: Object,
      default: null
    },
    validObj: {
      required: false,
      type: Object,
      default: null
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    workflowName () {
      return this.config.name
    },
    cronExpressionParse () {
      const cronArr = this.currentTimer.cron.trim().split(/\s+/)
      return [
        {
          min: cronArr[0],
          hour: cronArr[1],
          date: cronArr[2],
          month: cronArr[3],
          week: cronArr[4]
        }
      ]
    },
    checkGitRepo () {
      return this.currentWebhook.repo
    }
  },
  methods: {
    checkRegular: debounce(({ value, that }) => {
      if (!that.webhookBranches[that.currentWebhook.repo.repo_name]) {
        return
      }
      const payload = {
        regular: value,
        branches:
          that.webhookBranches[that.currentWebhook.repo.repo_name].map(
            branch => branch.name
          ) || []
      }
      checkRegularAPI(payload).then(res => {
        that.matchedBranchNames = res || []
      })
    }, 500),
    translateDate (day) {
      const item = this.timerDateOptions.find(item => {
        return item.value === day
      })
      if (item) {
        return item.label
      }
    },
    validate () {
      return this.$refs.buildEnvRef.validate()
    },
    changeWebhookStatus (webhook) {
      const projectName = this.projectName
      const workflowName = this.workflowName
      updateCustomWebhookAPI(projectName, workflowName, webhook).then(() => {
        this.$message.success(
          `${webhook.name} 已${webhook.enabled ? '启用' : '禁用'}`
        )
        this.getWebhooks()
      })
    },
    async getWebhooks () {
      const projectName = this.projectName
      const workflowName = this.workflowName
      const result = await getCustomWebhooksAPI(projectName, workflowName)
      if (result) {
        this.webhooks = result
      }
    },
    async addWebhook () {
      const projectName = this.projectName
      const workflowName = this.workflowName
      this.currentWebhook = cloneDeep(webhookInfo)
      const preset = await getCustomWebhookPresetAPI(projectName, workflowName)
      if (preset) {
        this.$set(
          this.currentWebhook,
          'workflow_arg',
          cloneDeep(preset.workflow_arg)
        )
        if (preset.repos && preset.repos.length > 0) {
          this.webhookRepos = uniqBy(
            preset.repos.map(item => {
              item.key = `${item.repo_owner}/${item.repo_name}`
              delete item.branch
              return item
            }),
            'key'
          )
        } else {
          this.webhookRepos = []
        }

        this.webhookEditMode = false
        this.webhookDialogVisible = true
      }
    },
    async editWebhook (item) {
      const projectName = this.projectName
      const workflowName = this.workflowName
      this.webhookEditMode = true
      const currentWebhook = cloneDeep(item)
      const triggerName = currentWebhook.name
      const preset = await getCustomWebhookPresetAPI(
        projectName,
        workflowName,
        triggerName
      )
      if (preset) {
        if (preset.repos && preset.repos.length > 0) {
          this.webhookRepos = uniqBy(
            preset.repos.map(item => {
              item.key = `${item.repo_owner}/${item.repo_name}`
              delete item.branch
              return item
            }),
            'key'
          )
        } else {
          this.webhookRepos = []
        }
        this.$set(
          currentWebhook,
          'workflow_arg',
          cloneDeep(preset.workflow_arg)
        )
      }
      if (
        currentWebhook.main_repo.codehost_id &&
        currentWebhook.main_repo.repo_namespace &&
        currentWebhook.main_repo.repo_name
      ) {
        this.getBranchInfoById(
          currentWebhook.main_repo.codehost_id,
          currentWebhook.main_repo.repo_namespace,
          currentWebhook.main_repo.repo_name
        )
      }
      currentWebhook.repo = {
        key: `${currentWebhook.main_repo.repo_owner}/${currentWebhook.main_repo.repo_name}`,
        source: currentWebhook.main_repo.source,
        repo_namespace: currentWebhook.main_repo.repo_namespace,
        repo_name: currentWebhook.main_repo.repo_name,
        repo_owner: currentWebhook.main_repo.repo_owner,
        codehost_id: currentWebhook.main_repo.codehost_id
      }
      currentWebhook.main_repo.match_folders = currentWebhook.main_repo
        .match_folders
        ? currentWebhook.main_repo.match_folders.join('\n')
        : '/\n!.md'
      this.currentWebhook = currentWebhook
      this.webhookDialogVisible = true
    },
    removeWebhook (index, triggerName) {
      const projectName = this.projectName
      const workflowName = this.workflowName
      removeCustomWebhookAPI(projectName, workflowName, triggerName).then(
        res => {
          this.$message.success('删除成功')
          this.getWebhooks()
        }
      )
    },
    saveWebhook () {
      this.$refs.webhookForm.validate(async valid => {
        if (valid) {
          const payload = cloneDeep(this.currentWebhook)
          payload.main_repo.match_folders = payload.main_repo.match_folders.split(
            '\n'
          )
          payload.main_repo = Object.assign(payload.main_repo, payload.repo)
          delete payload.repo
          const workflowName = this.workflowName
          const projectName = this.projectName
          payload.workflow_arg.stages.forEach(stage => {
            stage.jobs.forEach(job => {
              if (job.type === 'zadig-build') {
                if (
                  job.spec.service_and_builds &&
                  job.spec.service_and_builds.length > 0
                ) {
                  job.spec.service_and_builds = job.pickedTargets
                  job.spec.service_and_builds.forEach(item => {
                    if (item.repos) {
                      item.repos.forEach(repo => {
                        if (typeof repo.prs === 'string') {
                          repo.prs = repo.prs.split(',').map(Number)
                        }
                        if (repo.branchOrTag) {
                          if (repo.branchOrTag.type === 'branch') {
                            repo.branch = repo.branchOrTag.name
                          }
                          if (repo.branchOrTag.type === 'tag') {
                            repo.tag = repo.branchOrTag.name
                          }
                        }
                      })
                    }
                  })
                  delete job.pickedTargets
                }
              }
              if (job.type === 'freestyle') {
                job.spec.steps.forEach(step => {
                  if (step.type === 'git') {
                    step.spec.repos.forEach(repo => {
                      if (typeof repo.prs === 'string') {
                        repo.prs = repo.prs.split(',').map(Number)
                      }
                      if (repo.branchOrTag) {
                        if (repo.branchOrTag.type === 'branch') {
                          repo.branch = repo.branchOrTag.name
                        }
                        if (repo.branchOrTag.type === 'tag') {
                          repo.tag = repo.branchOrTag.name
                        }
                      }
                    })
                  }
                })
              }
              if (job.type === 'zadig-deploy') {
                job.spec.service_and_images = cloneDeep(job.pickedTargets)
                if (
                  job.spec.service_and_images &&
                  job.spec.service_and_images.length > 0
                ) {
                  job.spec.service_and_images.forEach(item => {
                    delete item.images
                  })
                  delete job.pickedTargets
                }
              }
              if (job.type === 'custom-deploy') {
                job.spec.targets = cloneDeep(job.pickedTargets)
                delete job.pickedTargets
              }
              if (job.type === 'zadig-test') {
                job.spec.test_modules = cloneDeep(job.pickedTargets)
                if (job.spec.test_modules && job.spec.test_modules.length > 0) {
                  job.spec.test_modules.forEach(item => {
                    if (item.repos) {
                      item.repos.forEach(repo => {
                        if (typeof repo.prs === 'string') {
                          repo.prs = repo.prs.split(',').map(Number)
                        }
                        if (repo.branchOrTag) {
                          if (repo.branchOrTag.type === 'branch') {
                            repo.branch = repo.branchOrTag.name
                          }
                          if (repo.branchOrTag.type === 'tag') {
                            repo.tag = repo.branchOrTag.name
                          }
                        }
                      })
                    }
                  })
                }
                delete job.pickedTargets
              }
              if (job.type === 'zadig-scanning') {
                job.spec.scannings = cloneDeep(job.pickedTargets)
                if (job.spec.scannings && job.spec.scannings.length > 0) {
                  job.spec.scannings.forEach(item => {
                    if (item.repos) {
                      item.repos.forEach(repo => {
                        if (typeof repo.prs === 'string') {
                          repo.prs = repo.prs.split(',').map(Number)
                        }
                        if (repo.branchOrTag) {
                          if (repo.branchOrTag.type === 'branch') {
                            repo.branch = repo.branchOrTag.name
                          }
                          if (repo.branchOrTag.type === 'tag') {
                            repo.tag = repo.branchOrTag.name
                          }
                        }
                      })
                    }
                  })
                }
                delete job.pickedTargets
              }
              if (job.type === 'zadig-distribute-image') {
                if (job.spec.source === 'runtime') {
                  job.spec.targets = cloneDeep(job.pickedTargets)
                  job.spec.targets.forEach(item => {
                    delete item.images
                  })
                  delete job.pickedTargets
                } else {
                  // fromjob
                  if (
                    payload.workflow_arg.fromJobInfo.pickedTargets && payload.workflow_arg.fromJobInfo.pickedTargets.length > 0
                  ) {
                    payload.workflow_arg.fromJobInfo.pickedTargets.forEach(
                      item => {
                        if (item.update_tag && !item.target_tag) {
                          this.$message.error(
                            this.$t(`workflow.inputTargetImage`, {
                              serviceName: item.service_name
                            })
                          )
                          throw Error()
                        }
                      }
                    )
                    job.spec.targets = payload.workflow_arg.fromJobInfo.pickedTargets.map(
                      item => {
                        return {
                          service_name: item.service_name,
                          service_module: item.service_module,
                          source_tag: item.source_tag,
                          target_tag: item.target_tag,
                          update_tag: item.update_tag
                        }
                      }
                    )
                    delete payload.workflow_arg.fromJobInfo
                  }
                }
              }
            })
          })
          if (this.webhookEditMode) {
            const result = await updateCustomWebhookAPI(
              projectName,
              workflowName,
              payload
            )
            if (result) {
              this.$message.success('修改成功')
              this.$refs.webhookForm.resetFields()
              this.webhookDialogVisible = false
              this.getWebhooks()
            }
          } else {
            const result = await addCustomWebhookAPI(
              projectName,
              workflowName,
              payload
            )
            if (result) {
              this.$message.success('添加成功')
              this.$refs.webhookForm.resetFields()
              this.webhookDialogVisible = false
              this.getWebhooks()
            }
          }
        } else {
          return false
        }
      })
    },
    changeTimerStatus (timer) {
      const projectName = this.projectName
      updateCustomTimerAPI(projectName, timer).then(() => {
        this.getTimers()
        this.$message.success(`定时器已${timer.enabled ? '启用' : '禁用'}`)
      })
    },
    async getTimers () {
      const projectName = this.projectName
      const workflowName = this.workflowName
      const result = await getCustomTimersAPI(projectName, workflowName)
      if (result) {
        this.timers = result
      }
    },
    async addTimer () {
      const projectName = this.projectName
      const workflowName = this.workflowName
      this.currentTimer = cloneDeep(timerInfo)
      const preset = await getCustomTimerPresetAPI(projectName, workflowName)
      if (preset) {
        this.$set(
          this.currentTimer,
          'workflow_v4_args',
          cloneDeep(preset.workflow_v4_args)
        )
        this.timerEditMode = false
        this.timerDialogVisible = true
      }
    },
    async editTimer (item) {
      const projectName = this.projectName
      const workflowName = this.workflowName
      this.timerEditMode = true
      const currentTimer = cloneDeep(item)
      const timerID = currentTimer.id
      const preset = await getCustomTimerPresetAPI(
        projectName,
        workflowName,
        timerID
      )
      this.$set(
        currentTimer,
        'workflow_v4_args',
        cloneDeep(preset.workflow_v4_args)
      )
      this.currentTimer = currentTimer
      this.timerDialogVisible = true
    },
    removeTimer (index, timerID) {
      const projectName = this.projectName
      const workflowName = this.workflowName
      removeCustomTimerAPI(projectName, workflowName, timerID).then(res => {
        this.$message.success('删除成功')
        this.getTimers()
      })
    },
    saveTimer () {
      this.$refs.timerForm.validate(async valid => {
        if (valid) {
          const payload = cloneDeep(this.currentTimer)
          const workflowName = this.workflowName
          const projectName = this.projectName
          payload.workflow_v4_args.stages.forEach(stage => {
            stage.jobs.forEach(job => {
              job.spec.service_and_builds = job.pickedTargets
              delete job.pickedTargets
              if (
                job.spec.service_and_images &&
                job.spec.service_and_images.length > 0
              ) {
                job.spec.service_and_images.forEach(item => {
                  delete item.images
                })
              }
              if (
                job.spec.service_and_builds &&
                job.spec.service_and_builds.length > 0
              ) {
                job.spec.service_and_builds.forEach(item => {
                  if (item.repos) {
                    item.repos.forEach(repo => {
                      if (typeof repo.prs === 'string') {
                        repo.prs = repo.prs.split(',').map(Number)
                      }
                      if (repo.branchOrTag) {
                        if (repo.branchOrTag.type === 'branch') {
                          repo.branch = repo.branchOrTag.name
                        }
                        if (repo.branchOrTag.type === 'tag') {
                          repo.tag = repo.branchOrTag.name
                        }
                      }
                    })
                  }
                })
              }
              if (job.type === 'freestyle') {
                job.spec.steps.forEach(step => {
                  if (step.type === 'git') {
                    step.spec.repos.forEach(repo => {
                      if (typeof repo.prs === 'string') {
                        repo.prs = repo.prs.split(',').map(Number)
                      }
                      if (repo.branchOrTag) {
                        if (repo.branchOrTag.type === 'branch') {
                          repo.branch = repo.branchOrTag.name
                        }
                        if (repo.branchOrTag.type === 'tag') {
                          repo.tag = repo.branchOrTag.name
                        }
                      }
                    })
                  }
                })
              }
              if (job.type === 'zadig-deploy') {
                job.spec.service_and_images = job.spec.service_and_builds
                delete job.spec.service_and_builds
              }
            })
          })
          if (this.timerEditMode) {
            const result = await updateCustomTimerAPI(projectName, payload)
            if (result) {
              this.$message.success('修改成功')
              this.$refs.timerForm.resetFields()
              this.timerDialogVisible = false
              this.getTimers()
            }
          } else {
            const result = await addCustomTimerAPI(
              projectName,
              workflowName,
              payload
            )
            if (result) {
              this.$message.success('添加成功')
              this.$refs.timerForm.resetFields()
              this.timerDialogVisible = false
              this.getTimers()
            }
          }
        } else {
          return false
        }
      })
    },
    changeTimerType (type) {
      if (type === 'timing') {
        this.currentTimer.frequency = ''
        this.currentTimer.time = ''
      } else if (type === 'gap') {
        this.currentTimer.frequency = ''
        this.currentTimer.number = 1
      } else if (type === 'crontab') {
        this.currentTimer.cron = ''
      }
    },
    getBranchInfoById (id, namespace, repoName) {
      if (!namespace) return
      getBranchInfoByIdAPI(id, namespace, repoName).then(res => {
        this.$set(this.webhookBranches, repoName, res)
      })
    },
    changeRepo (currentRepo) {
      this.getBranchInfoById(
        currentRepo.codehost_id,
        currentRepo.repo_namespace,
        currentRepo.repo_name
      )
    },
    checkingBuildStageChanged (newConfig, oldConfig) {
      if (!isEqual(newConfig, oldConfig)) {
        this.$confirm(this.$t(`workflow.pleaseSaveTrigger`), '确认', {
          confirmButtonText: this.$t(`global.save`),
          cancelButtonText: this.$t(`global.cancel`),
          type: 'warning'
        })
          .then(() => {
            this.$emit('saveWorkflow')
          })
          .catch(() => {
            this.$emit('closeDrawer')
          })
      }
    }
  },
  watch: {
    config: {
      handler (newValue, oldValue) {
        if (newValue) {
          this.$forceUpdate()
        }
      },
      deep: true
    },
    isShowDrawer: {
      async handler (newValue, oldValue) {
        if (newValue) {
          if (!this.isEdit) {
            this.$confirm(
              this.$t(`workflow.pleaseSaveTrigger`),
              this.$t(`global.confirmation`),
              {
                confirmButtonText: this.$t(`global.save`),
                cancelButtonText: this.$t(`global.cancel`),
                type: 'warning'
              }
            )
              .then(() => {
                this.$emit('closeDrawer')
                this.$emit('saveWorkflow')
              })
              .catch(() => {
                this.$emit('closeDrawer')
              })
          }
          if (this.isEdit) {
            this.getWebhooks()
            this.getTimers()
            this.checkingBuildStageChanged(
              cloneDeep(this.config),
              cloneDeep(this.originalWorkflow)
            )
          }
        }
      },
      deep: true,
      immediate: true
    },
    'currentWebhook.main_repo.branch': {
      handler (value) {
        if (!value) {
          this.matchedBranchNames = null
        } else if (
          this.checkGitRepo &&
          this.currentWebhook.main_repo.is_regular
        ) {
          this.checkRegular({ value, that: this })
        }
      }
    }
  },
  created () {
    this.validObj &&
      this.validObj.addValidate({
        name: 'webhook',
        valid: this.validate
      })
  },
  components: {
    WebhookRunConfig
  }
}
</script>

<style lang="less" scoped>
@secondaryColor: #b1b1b2;
@primaryColor: #000;

.inline-show {
  display: flex;
  flex-direction: row;

  & > div {
    margin-right: 10px;
  }
}

.trigger-types-dialog {
  .el-dialog__body {
    .trigger-types-container {
      .trigger-item {
        display: flex;
        flex-direction: row;
        align-content: center;
        align-items: center;
        margin: 14px 0;
        padding: 10px 20px;
        border: 1px solid #ccc;
        border-radius: 4px;
        cursor: pointer;

        .icon {
          display: flex;
          margin-right: 20px;

          span {
            font-size: 24px;
          }
        }

        .detail {
          display: flex;
          flex-direction: column;

          .trigger-title {
            margin: 0;
            color: #4a4a4a;
            font-weight: 400;
            font-size: 15px;
          }

          .trigger-desc {
            margin-top: 4px;
            color: #909399;
            font-size: 14px;
          }
        }

        &:hover {
          border: 1px solid @themeColor;

          .icon {
            color: @themeColor;
          }
        }
      }
    }
  }
}

.webhook {
  .webhook-row {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding: 6px 0;
    border-bottom: 1px solid #ccc;

    &:last-child {
      border-bottom: none;
    }

    .content {
      display: flex;
      flex-direction: column;

      .cate {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        margin-bottom: 6px;

        &:last-child {
          margin-bottom: 0;
        }

        .title {
          color: @secondaryColor;
          font-weight: 400;
          font-size: 12px;
        }

        .desc {
          color: @primaryColor;
          font-weight: normal;
          font-size: 12px;
        }
      }

      .operation {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .el-icon-edit {
          color: @themeColor;
          cursor: pointer;
        }

        .el-icon-delete {
          color: #ff1949;
          cursor: pointer;
        }
      }
    }
  }
}
</style>
