<template>
  <el-dialog
    :title="$t('project.deleteProjectComp.inputProjectNameToDelete', { projectName: projectName})"
    :visible.sync="deleteDialogVisible"
    width="40%"
  >
    <div class="delete-project-content">
      <template v-if="projectDeleteInfo.deploy_type === 'external'">
        <div style="margin-bottom: 4px;">
          {{$t('project.deleteProjectComp.deleteExternalProjectTip')}}
          <span
            style="color: red;"
          >{{$t('project.deleteProjectComp.deleteProjectCaution')}}</span>
        </div>
        <div>
          <span style="font-weight: 500;">{{$t('project.services')}}：</span>
          <span>{{ services.join(', ') || $t('global.emptyText') }}</span>
        </div>
        <div>
          <span style="font-weight: 500;">{{$t('project.environments')}}：</span>
          <span>{{ envNames.join(', ') || $t('global.emptyText') }}</span>
        </div>
        <div style="margin: 12px 0 4px;">
          {{$t('project.deleteProjectComp.deleteProjectTip')}}
          <span
            style="color: red;"
          >{{$t('project.deleteProjectComp.deleteProjectCaution')}}</span>
        </div>
        <div>
          <span style="font-weight: 500;">{{$t('project.builds')}}：</span>
          <span>{{ buildConfigs.join(', ') || $t('global.emptyText') }}</span>
        </div>
        <div>
          <span style="font-weight: 500;">{{$t('project.workflows')}}：</span>
          <span>{{ workflows.join(', ') || $t('global.emptyText') }}</span>
        </div>
      </template>
      <template v-else>
        <div>
          {{$t('project.deleteProjectComp.deleteProjectTip')}}
          <span
            style="color: red;"
          >{{$t('project.deleteProjectComp.deleteProjectCaution')}}</span>
        </div>
        <div>
          <span style="font-weight: 500;">{{$t('project.services')}}：</span>
          <span>{{ services.join(', ') || $t('global.emptyText') }}</span>
        </div>
        <div>
          <span style="font-weight: 500;">{{$t('project.environments')}}：</span>
          <span>{{ envNames.join(', ') || $t('global.emptyText') }}</span>
        </div>
        <div>
          <span style="font-weight: 500;">{{$t('project.builds')}}：</span>
          <span>{{ buildConfigs.join(', ') || $t('global.emptyText') }}</span>
        </div>
        <div>
          <span style="font-weight: 500;">{{$t('project.workflows')}}：</span>
          <span>{{ workflows.join(', ') || $t('global.emptyText') }}</span>
        </div>
      </template>
      <div style="margin: 16px 0 6px;">
        <el-checkbox
          v-if="['k8s', 'helm'].includes(projectDeleteInfo.deploy_type)"
          v-model="projectDeleteInfo.is_delete"
        >{{$t('project.deleteProjectComp.deleteK8sNamespace')}}</el-checkbox>
      </div>
      <el-form ref="deleteForm" :model="projectDeleteInfo" :rules="deleteRules" label-width="80px">
        <el-form-item label-width="0" prop="project_name">
          <el-input v-model="projectDeleteInfo.project_name" :placeholder="$t('project.createProjectComp.inputProjectName')" size="small"></el-input>
        </el-form-item>
      </el-form>
    </div>
    <div slot="footer">
      <el-button @click="deleteDialogVisible = false" size="small">{{$t(`global.cancel`)}}</el-button>
      <el-button type="danger" @click="identifyDeleteProject" size="small">{{$t(`global.confirm`)}}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import {
  getServiceTemplatesAPI,
  getProductWorkflowsInProjectAPI,
  getBuildConfigsAPI,
  getEnvironmentsAPI,
  deleteProjectAPI
} from '@api'

export default {
  props: {
    followUpFn: Function
  },
  data () {
    return {
      deleteDialogVisible: false,
      projectName: '',
      services: [],
      envNames: [],
      buildConfigs: [],
      workflows: [],
      projectDeleteInfo: {
        is_delete: true,
        project_name: '',
        deploy_type: ''
      }
    }
  },
  computed: {
    deleteRules () {
      return {
        project_name: [
          {
            required: true,
            validator: (rule, value, callback) => {
              if (!value) {
                callback(new Error(this.$t('project.createProjectComp.inputProjectName')))
              } else if (value !== this.projectName) {
                callback(new Error(this.$t('project.deleteProjectComp.projectNameDontMatch')))
              } else {
                callback()
              }
            },
            trigger: 'change'
          }
        ]
      }
    }
  },
  methods: {
    async openDialog (projectName) {
      this.projectName = projectName
      this.deleteDialogVisible = true
      this.services = []
      this.envNames = []
      this.buildConfigs = []
      this.workflows = []
      this.projectDeleteInfo = {
        is_delete: true,
        project_name: '',
        deploy_type: this.$store.getters.projectDeployType(projectName)
      }
      this.$nextTick(() => {
        this.$refs.deleteForm.resetFields()
      })
      this.initDeleteProject()
    },
    async initDeleteProject () {
      const projectName = this.projectName
      const result = await Promise.all([
        getServiceTemplatesAPI(projectName),
        getProductWorkflowsInProjectAPI(projectName),
        getBuildConfigsAPI(projectName),
        getEnvironmentsAPI(projectName)
      ])
      this.services = result[0].data.map(element => {
        return element.service_name
      })
      this.workflows = result[1].map(element => {
        return element.name
      })
      this.buildConfigs = result[2].map(element => {
        return element.name
      })
      this.envNames = result[3].map(element => {
        return element.name
      })
    },
    identifyDeleteProject () {
      this.$refs.deleteForm.validate(valid => {
        if (valid) {
          deleteProjectAPI(
            this.projectName,
            this.projectDeleteInfo.is_delete
          ).then(() => {
            this.$message({
              type: 'success',
              message: this.$t('project.deleteProjectComp.successfullyDeleted')
            })
            this.deleteDialogVisible = false
            this.followUpFn && this.followUpFn()
          })
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.delete-project-content {
  margin: -10px 10px;
  line-height: 22px;
}
</style>
