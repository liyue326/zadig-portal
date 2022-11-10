<template>
  <div class="projects-delivery-container">
    <div class="guide-container">
      <Step :activeStep="3"/>
      <div class="current-step-container">
        <div class="title-container">
          <span class="first">第四步</span>
          <span class="second">运行工作流触发服务的自动化交付</span>
        </div>
        <div class="block-list">
          <el-table v-loading="loading"
                    :data="mapWorkflows"
                    style="width: 100%;">
            <el-table-column label="工作流名称">
              <template slot-scope="scope">
                <span style="margin-left: 10px;">{{ scope.row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column width="200px"
                             label="环境信息">
              <template slot-scope="scope">
                <a v-if="scope.row.env_name"
                   class="env-name"
                   :href="`/v1/projects/detail/${ scope.row.projectName}/envs/detail?envName=${ scope.row.env_name}`"
                   target="_blank">{{ `${scope.row.projectName}-env-${scope.row.env_name}` }}</a>
              </template>
            </el-table-column>
            <el-table-column label="服务入口">
              <template slot-scope="scope">
                <div v-for="(ingress,ingress_index) in scope.row.ingress_infos"
                     :key="ingress_index">
                  <div v-for="(item,host_index) in scope.row.ingress_infos[ingress_index]['host_info']"
                       :key="host_index">
                    <a style="color: @themeColor;"
                       :href="`http://${item.host}`"
                       target="_blank">{{item.host}}</a>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column width="200px"
                             label="包含步骤">
              <template slot-scope="scope">
                <span>
                  <span v-for="(stage,index) in scope.row.enabledStages" :key="index" class="stage-tag">
                    <el-tag size="mini">{{wordTranslation(stage,'workflowStage')}}</el-tag>
                  </span>
                </span>
              </template>
            </el-table-column>
            <el-table-column width="150px"
                             label="更新信息">
              <template slot-scope="scope">
                {{$utils.convertTimestamp(scope.row.updateTime)}}
              </template>
            </el-table-column>
            <el-table-column width="120px"
                             label="操作">
              <template slot-scope="scope">
                <el-button type="primary"
                           size="mini"
                           round
                           @click="runCurrentTask(scope.row)"
                           plain>点击运行</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div class="help-links-container">
        <h3 class="links-header">
          您可能还需要：
        </h3>
        <ul class="links-list">
          <li class="list-item"><a target="_blank"
               href="https://docs.koderover.com/zadig/project/workflow/#git-webhook"
               class="list-item-link"><i class="icon el-icon-link"></i>
              <span class="list-item-link-text">
                配置 Git Webhook 自动触发服务升级</span></a></li>
        </ul>
      </div>
    </div>
    <div class="controls__wrap">
      <div class="controls__right">
        <router-link :to="`/v1/projects/detail/${projectName}/detail`">
          <el-button type="primary"
                  size="small"
                  :disabled="loading">完成</el-button>
        </router-link>
      </div>
    </div>
    <el-dialog :visible.sync="taskDialogVisible"
               title="运行 产品-工作流"
               custom-class="run-workflow"
               width="60%"
               class="dialog">
      <RunWorkflow v-if="taskDialogVisible"
                    :workflowName="workflow.name"
                    :displayName="workflow.display_name"
                    :workflowMeta="workflow"
                    :targetProject="workflow.product_tmpl_name"
                    @success="hideAfterSuccess"/>
    </el-dialog>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import Step from '../common/step.vue'
import RunWorkflow from '../../workflow/common/runWorkflow.vue'
import { wordTranslate } from '@utils/wordTranslate.js'
import { getProductWorkflowsInProjectAPI, getProjectIngressAPI, getWorkflowDetailAPI } from '@api'
export default {
  data () {
    return {
      loading: true,
      workflow: {},
      taskDialogVisible: false,
      mapWorkflows: []
    }
  },
  methods: {
    async getWorkflows () {
      this.loading = true
      const projectName = this.projectName
      const workflows = await getProductWorkflowsInProjectAPI(projectName)
      const ingresses = await getProjectIngressAPI(projectName)
      if (workflows && ingresses) {
        this.loading = false
        const w1 = 'workflow-qa'
        const w2 = 'workflow-dev'
        const w3 = 'ops-workflow'
        const currentWorkflows = workflows.filter(element => {
          return element.name.includes(w1) || element.name.includes(w2) || (element.name.includes(w3))
        }).map((ele) => {
          const element = Object.assign({}, ele)
          if (element.name.includes(w1)) element.env_name = 'qa'
          if (element.name.includes(w2)) element.env_name = 'dev'
          if (element.name.includes(w3)) element.env_name = ''
          return element
        })
        currentWorkflows.forEach(workflow => {
          ingresses.forEach(ingress => {
            if (ingress.env_name === workflow.env_name) {
              workflow.ingress_infos = ingress.ingress_infos
            }
          })
        })
        this.mapWorkflows = currentWorkflows
      }
    },
    wordTranslation (word, category, subitem) {
      return wordTranslate(word, category, subitem)
    },
    runCurrentTask (scope) {
      getWorkflowDetailAPI(scope.projectName, scope.name).then(res => {
        this.taskDialogVisible = true
        this.workflow = res
      }).catch(err => {
        window.console.log(err)
        this.taskDialogVisible = false
      })
    },
    hideAfterSuccess () {
      this.taskDialogVisible = false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  created () {
    this.getWorkflows()
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: '项目', url: '/v1/projects' }, { title: this.projectName, isProjectName: true, url: '' }] })
  },
  components: {
    Step,
    RunWorkflow
  },
  onboardingStatus: 0
}
</script>

<style lang="less">
@import "~@assets/css/component/onboarding-delivery.less";
</style>
