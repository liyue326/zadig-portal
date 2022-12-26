<template>
  <div class="block-list">
    <el-table v-loading="loading" :data="mapWorkflows" style="width: 100%;">
      <el-table-column :label="$t(`global.workflowName`)">
        <template slot-scope="scope">
          <span style="margin-left: 10px;">{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column width="200px" :label="$t('project.onboardingComp.workflowStages')">
        <template slot-scope="scope">
          <span>
            <span v-for="(stage,index) in scope.row.enabledStages" :key="index" class="stage-tag">
              <el-tag size="mini">{{wordTranslation(stage,'workflowStage')}}</el-tag>
            </span>
          </span>
        </template>
      </el-table-column>
      <el-table-column width="400px" :label="$t('project.onboardingComp.updateTime')">
        <template slot-scope="scope">
          {{ $utils.convertTimestamp(scope.row.updateTime)}}/ {{scope.row.updateBy}}
        </template>
      </el-table-column>
      <el-table-column width="120px" :label="$t(`global.operation`)">
        <template slot-scope="scope">
          <el-button
            type="primary"
            size="mini"
            round
            @click="runCurrentTask(scope.row)"
            plain
            >{{$t('project.onboardingComp.clickToRun')}}</el-button
          >
        </template>
      </el-table-column>
    </el-table>
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
import { wordTranslate } from '@utils/wordTranslate.js'
import RunWorkflow from '../../workflow/common/runWorkflow.vue'
import { getProjectIngressAPI, getWorkflowDetailAPI, getProductWorkflowsInProjectAPI, generateWorkflowAPI } from '@api'

export default {
  name: 'runWorkflow',
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
        const currentWorkflows = workflows
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
  async created () {
    await generateWorkflowAPI(this.projectName)
    this.getWorkflows()
  },
  components: {
    RunWorkflow
  }
}
</script>
<style lang="less" scoped>
.block-list {
  flex: 1;
  margin-top: 15px;
  padding: 0 30px;
  overflow-y: auto;
  background-color: inherit;

  .env-name {
    color: @themeColor;
  }
}
</style>
