<template>
  <div class="product-basic-info">
    <el-card class="box-card">
      <div>
        <el-form :model="workflowInfo"
                 :rules="rules"
                 ref="workflowInfo"
                 label-position="top"
                 label-width="80px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item prop="display_name"
                            :label="$t(`global.workflowName`)">
                <el-input v-model="workflowInfo.display_name"
                          style="width: 80%;"
                          :placeholder="$t(`workflow.inputWorkflowName`)"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item prop="name"
                            :label="$t(`global.workflowID`)">
                <el-input v-model="workflowInfo.name"
                          :disabled="editMode"
                          style="width: 80%;"
                          :placeholder="$t(`workflow.inputWorkflowID`)"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item prop="env_name">
                <template slot="label">
                  <span>{{$t(`workflow.specifyEnvironment`)}}</span>
                  <el-tooltip effect="dark"
                              :content="$t(`workflow.specifyEnvironmentTip`)"
                              placement="top">
                    <i class="pointer el-icon-question"></i>
                  </el-tooltip>
                </template>
                <el-select v-model="workflowInfo.env_name"
                           style="width: 80%;"
                           placeholder="请选择环境"
                           clearable
                           filterable>
                    <el-option :label="env.name" v-for="(env,index) in filteredEnvs" :key="index"
                               :value="env.name">
                    </el-option>
                    <el-option v-if="filteredEnvs.length===0"
                               label=""
                               value="">
                      <router-link style="color: #909399;"
                                   :to="`/v1/projects/detail/${workflowInfo.product_tmpl_name}/envs/create`">
                        {{`(环境不存在，点击创建环境)`}}
                      </router-link>
                    </el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item :label="$t('global.desc')">
            <el-input type="input"
                      style="width: 100%;"
                      v-model="workflowInfo.description"></el-input>
          </el-form-item>
        </el-form>
        <div class="policy-title">{{$t(`workflow.runPolicy`)}}</div>
        <el-form :model="workflowInfo"
                 :rules="rules"
                 ref="workflowInfoPolicy"
                 label-position="left"
                 label-width="120px">
          <el-form-item prop="is_parallel" class="label-icon">
            <template slot="label">
              <span>{{$t(`workflow.concurrentExecution`)}} </span>
              <el-tooltip effect="dark"
                          :content="$t(`workflow.concurrentExecutionTip`)"
                          placement="top">
                <i class="pointer el-icon-question"></i>
              </el-tooltip>
            </template>
            <el-switch v-model="workflowInfo.is_parallel"></el-switch>
          </el-form-item>
          <el-form-item prop="reset_image" class="label-icon" v-if="!isExternal">
            <template slot="label">
              <span>{{$t(`workflow.imageVersionRollback`)}} </span>
              <el-tooltip effect="dark"
                          :content="$t(`workflow.imageVersionRollbackTip`)"
                          placement="top">
                <i class="pointer el-icon-question"></i>
              </el-tooltip>
            </template>
            <el-switch v-model="workflowInfo.reset_image" @change="workflowInfo.reset_image_policy = ''"></el-switch>
          </el-form-item>
          <el-form-item prop="reset_image_policy" :label="$t(`workflow.setFallbackPolicy`)" v-if="workflowInfo.reset_image">
            <el-radio-group v-model="workflowInfo.reset_image_policy">
              <el-radio v-for="policy in resetPolicy" :key="policy.label" :label="policy.label">{{ $t(`resetPolicy.${policy.text}`) }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script type="text/javascript">
import bus from '@utils/eventBus'
import { templatesAPI, listProductAPI } from '@api'
const pinyin = require('pinyin')

export default {
  data () {
    return {
      resetPolicy: [{
        label: 'taskCompleted',
        text: 'taskCompleted'
      }, {
        label: 'deployFailed',
        text: 'deployFailed'
      }, {
        label: 'testFailed',
        text: 'testFailed'
      }],
      projects: [],
      projectList: [],
      filteredEnvs: [],
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
        ],
        product_tmpl_name: [
          {
            type: 'string',
            required: true,
            message: '请选择项目',
            trigger: 'blur'
          }
        ],
        reset_image_policy: {
          type: 'string',
          required: true,
          message: '请选择回退策略',
          trigger: 'blur'
        }
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.query.projectName
    },
    isExternal () {
      const project = this.$store.getters.projectList.find(project => {
        return project.name === this.projectName
      })
      return project ? project.deployType === 'external' : false
    }
  },
  created () {
    if (this.$store.getters.projectList.length === 0) {
      this.$store.dispatch('getProjectList')
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
    getEnvServices (projectName) {
      listProductAPI(projectName).then(res => {
        this.filteredEnvs = res
      })
    }
  },
  props: {
    workflowInfo: {
      required: true,
      type: Object
    },
    editMode: {
      required: true,
      type: Boolean
    }
  },
  watch: {
    workflowInfo: {
      immediate: true,
      handler: function () {
        if (this.$route.query.projectName) {
          this.workflowInfo.product_tmpl_name = this.$route.query.projectName
        }

        if (!this.$route.query.projectName && !this.editMode) {
          templatesAPI().then(res => {
            this.projects = res
          })
        }
        const projectName = this.workflowInfo.product_tmpl_name
        bus.$on('check-tab:basicInfo', () => {
          Promise.all([this.$refs.workflowInfo.validate(), this.$refs.workflowInfoPolicy.validate()]).then(valid => {
            bus.$emit('receive-tab-check:basicInfo', valid)
          })
        })
        if (projectName) {
          this.getEnvServices(projectName)
        }
      }
    },
    'workflowInfo.display_name': {
      handler (val, old_val) {
        if (!this.editMode) {
          this.workflowInfo.name = pinyin(val, {
            style: pinyin.STYLE_NORMAL
          }).join('')
        }
      }
    }
  },
  beforeDestroy () {
    bus.$off('check-tab:basicInfo')
  }
}
</script>

<style lang="less">
.product-basic-info {
  .pointer {
    cursor: pointer;
  }

  .box-card {
    .el-card__header {
      text-align: center;
    }

    .el-form {
      .el-form-item {
        margin-bottom: 5px;
      }

      .pipe-schedule-container {
        .el-form-item__content {
          margin-left: 0 !important;
        }
      }
    }

    .policy-title {
      margin: 30px 0 10px;
      font-weight: 500;
      font-size: 16px;
    }

    .divider {
      width: 100%;
      height: 1px;
      margin: 13px 0;
      background-color: #dfe0e6;
    }
  }
}
</style>
