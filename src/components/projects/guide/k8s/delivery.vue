<template>
  <div class="projects-delivery-container">
    <div class="guide-container">
      <Step :thirdStepTitle="$t('environments.common.envCreation')" :activeStep="3"/>
      <div class="current-step-container">
        <div class="title-container">
          <span class="first">{{$t('project.onboardingComp.fourthStep')}}</span>
          <span class="second">{{$t('project.onboardingComp.fourthStepTip')}}</span>
        </div>
        <div class="block-list">
          <el-table v-loading="loading"
                    :data="mapWorkflows"
                    style="width: 100%;">
            <el-table-column :label="$t(`global.workflowName`)">
              <template slot-scope="scope">
                <span style="margin-left: 10px;">{{ scope.row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column width="120px"
                             :label="$t('project.onboardingComp.envName')">
              <template slot-scope="scope">
                <a v-if="scope.row.env_name"
                   class="env-name"
                   :href="`/v1/projects/detail/${ scope.row.projectName}/envs/detail?envName=${ scope.row.env_name}`"
                   target="_blank">{{ scope.row.env_name }}</a>
              </template>
            </el-table-column>
            <el-table-column :label="$t('global.serviceEntrypoint')">
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
                             :label="$t('project.onboardingComp.workflowStages')">
              <template slot-scope="scope">
                <span>
                  <span v-for="(stage,index) in scope.row.enabledStages" :key="index" class="stage-tag">
                    <el-tag size="mini">{{wordTranslation(stage,'workflowStage')}}</el-tag>
                  </span>
                </span>
              </template>
            </el-table-column>
            <el-table-column width="150px"
                             :label="$t('project.onboardingComp.updateTime')">
              <template slot-scope="scope">
                {{$utils.convertTimestamp(scope.row.updateTime)}}
              </template>
            </el-table-column>
            <el-table-column width="120px"
                             :label="$t(`global.operation`)">
              <template slot-scope="scope">
                <el-button type="primary"
                           size="mini"
                           round
                           @click="runCurrentTask(scope.row)"
                           plain>{{$t('project.onboardingComp.clickToRun')}}</el-button>
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
                  :disabled="loading">{{$t('project.onboardingComp.finish')}}</el-button>
        </router-link>
      </div>
    </div>
    <el-dialog :visible.sync="taskDialogVisible"
               :title="$t(`workflow.runProductWorkflow`)"
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
        const prefixLen = `${projectName}-workflow-`.length
        const currentWorkflows = workflows.map((ele) => {
          const element = Object.assign({}, ele)
          if (element.name === `${projectName}-ops-workflow`) {
            element.env_name = ''
          } else {
            element.env_name = element.name.slice(prefixLen)
          }
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
        console.log(err)
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
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' }, { title: this.projectName, isProjectName: true, url: '' }] })
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
