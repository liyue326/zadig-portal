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
              <el-form-item prop="name"
                            label="工作流名称">
                <el-input v-model="workflowInfo.name"
                          :disabled="editMode"
                          style="width: 80%;"
                          placeholder="请输入工作流名称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item prop="product_tmpl_name"
                            label="选择项目">
                <el-select v-model="workflowInfo.product_tmpl_name"
                           style="width: 80%;"
                           @change="getEnvServices(workflowInfo.product_tmpl_name)"
                           placeholder="请选择项目"
                           :disabled="editMode || !!$route.query.projectName"
                           filterable>
                    <el-option v-for="pro in projects" :key="pro.value" :label="pro.label"
                               :value="pro.value">
                    </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item prop="env_name">
                <template slot="label">
                  <span>指定环境</span>
                  <el-tooltip effect="dark"
                              content="支持工作流默认部署到某个环境"
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
          <el-form-item label="描述">
            <el-input type="input"
                      style="width: 100%;"
                      v-model="workflowInfo.description"></el-input>
          </el-form-item>
        </el-form>
        <div class="policy-title">运行策略</div>
        <el-form :model="workflowInfo"
                 :rules="rules"
                 ref="workflowInfoPolicy"
                 label-position="left"
                 label-width="120px">
          <el-form-item prop="is_parallel" class="label-icon">
            <template slot="label">
              <span>并发运行 </span>
              <el-tooltip effect="dark"
                          content="当同时更新多个不同服务时，产生的多个任务将会并发执行，以提升工作流运行效率"
                          placement="top">
                <i class="pointer el-icon-question"></i>
              </el-tooltip>
            </template>
            <el-switch v-model="workflowInfo.is_parallel"></el-switch>
          </el-form-item>
          <el-form-item prop="reset_image" class="label-icon" v-if="!isExternal">
            <template slot="label">
              <span>镜像版本回退 </span>
              <el-tooltip effect="dark"
                          content="当任务运行状态和测试结果满足回退策略的设定，镜像版本将自动回退到上一个版本"
                          placement="top">
                <i class="pointer el-icon-question"></i>
              </el-tooltip>
            </template>
            <el-switch v-model="workflowInfo.reset_image" @change="workflowInfo.reset_image_policy = ''"></el-switch>
          </el-form-item>
          <el-form-item prop="reset_image_policy" label="设置回退策略" v-if="workflowInfo.reset_image">
            <el-radio-group v-model="workflowInfo.reset_image_policy">
              <el-radio v-for="policy in resetPolicy" :key="policy.label" :label="policy.label">{{ policy.text }}</el-radio>
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

export default {
  data () {
    return {
      resetPolicy: [{
        label: 'taskCompleted',
        text: '任务执行完成'
      }, {
        label: 'deployFailed',
        text: '部署结果失败'
      }, {
        label: 'testFailed',
        text: '测试结果失败'
      }],
      projects: [],
      projectList: [],
      filteredEnvs: [],
      rules: {
        name: [
          {
            type: 'string',
            required: true,
            validator: this.validatePipelineName,
            trigger: 'blur'
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
    validatePipelineName (rule, value, callback) {
      const result = this.$utils.validatePipelineName([], value)
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
