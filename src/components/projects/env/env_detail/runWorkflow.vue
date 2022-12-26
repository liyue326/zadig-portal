<template>
  <el-form class="run-workflow" label-position="left" label-width="90px">
    <el-form-item prop="pipelines" label="工作流">
      <el-select v-model="workflowName" size="medium" class="full-width" @change="getWorkflow" placeholder="请选择">
        <el-option v-for="(item,index) in workflows" :key="index" :label="item.display_name" :value="item.name"></el-option>
      </el-select>
    </el-form-item>
    <template>
      <div v-if="workflowType==='workflow'">
        <div v-if="buildDeployEnabled">
          <div v-loading="precreateLoading">
            <div v-if="pickedTargets.length > 0">
              <WorkflowBuildRows :pickedTargets="pickedTargets" />
            </div>
          </div>
          <div class="advanced-setting">
            <el-collapse>
              <el-collapse-item title="高级设置" name="1">
                <el-checkbox v-model="runner.reset_cache">
                  不使用工作空间缓存
                  <el-tooltip effect="dark" content="可能会增加任务时长。如果构建中不使用工作空间缓存，该设置会被忽略" placement="top">
                    <span>
                      <i style="color: #909399;" class="el-icon-question"></i>
                    </span>
                  </el-tooltip>
                </el-checkbox>
                <br />
                <el-checkbox v-model="runner.ignore_cache">
                  不使用 Docker 缓存
                  <el-tooltip effect="dark" content="只对配置了镜像构建步骤的构建生效" placement="top">
                    <span>
                      <i style="color: #909399;" class="el-icon-question"></i>
                    </span>
                  </el-tooltip>
                </el-checkbox>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>

        <div v-if="artifactDeployEnabled">
          <!-- K8s Artifact Deploy -->
          <K8sArtifactDeploy
            v-if="!isPm && forcedUserInput.artifact_args.length > 0"
            ref="k8sArtifactRef"
            :allServices="allServiceNames"
            :showCreateVersion="showCreateVersion"
            :k8sArtifactDeployData.sync="k8sArtifactDeployData"
            :forcedUserInput="forcedUserInput"
            disableServiceSelection
          />
          <!-- Pm Artifact Deploy -->
          <PmArtifactDeploy
            v-if="isPm && forcedUserInput.artifact_args.length > 0"
            :projectName="projectName"
            :allServices="allServiceNames"
            :forcedUserInput="forcedUserInput"
            :pmArtifactDeployData.sync="pmArtifactDeployData"
            disableServiceSelection
          />
        </div>
        <div class="start-task">
          <el-button
            @click="startTask"
            :loading="startTaskLoading"
            :disabled="pickedTargets.length === 0"
            type="primary"
            size="small"
          >{{ startTaskLoading?$t(`workflow.starting`):$t(`workflow.run`) }}</el-button>
          <span style="color: #ff1949;" v-if="pickedTargets.length === 0">该服务尚未配置构建，无法启动任务</span>
        </div>
      </div>
    </template>
  </el-form>
</template>

<script>
import WorkflowBuildRows from '@/components/common/workflowBuildRows.vue'
import K8sArtifactDeploy from '../../workflow/common/k8sArtifactDeploy.vue'
import PmArtifactDeploy from '../../workflow/common/pmArtifactDeploy.vue'
import {
  precreateWorkflowTaskAPI,
  getAllBranchInfoAPI,
  runWorkflowAPI,
  getWorkflowDetailAPI,
  getSingleProjectAPI
} from '@api'
import { sortBy, orderBy, cloneDeep, flattenDeep } from 'lodash'

export default {
  data () {
    return {
      runner: {
        workflow_name: '',
        product_tmpl_name: '',
        description: '',
        namespace: '',
        targets: [],
        tests: []
      },
      workflowName: '',
      repoInfoMap: {},
      workflowMeta: {},
      k8sArtifactDeployData: {},
      pmArtifactDeployData: {},
      precreateLoading: false,
      startTaskLoading: false,
      isHelm: false,
      isPm: false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    selectedDeployEnv () {
      return `${this.currentServiceMeta.ns}`
    },
    workflowType () {
      if (this.workflowName) {
        const currentWorkflow = this.workflows.find(
          element => element.name === this.workflowName
        )
        return currentWorkflow.workflow_type
      } else {
        return ''
      }
    },
    allServiceNames () {
      const targets = this.runner.targets.filter(
        item => item.service_name === this.currentServiceMeta.serviceName
      )
      return orderBy(
        sortBy(
          targets.map(element => {
            element.key = element.name + '/' + element.service_name
            return element
          }),
          'service_name'
        ),
        'name'
      )
    },
    pickedTargets: {
      get () {
        return this.runner.targets.filter(t => t.picked)
      }
    },
    buildRepos () {
      return this.$utils.flattenArray(
        this.runner.targets.map(tar => tar.build.repos)
      )
    },
    testRepos () {
      return this.$utils.flattenArray(this.runner.tests.map(t => t.builds))
    },
    allRepos () {
      return this.buildRepos.concat(this.testRepos)
    },
    allReposForQuery () {
      return this.allRepos.map(re => ({
        repo_owner: re.repo_owner,
        repo: re.repo_name,
        default_branch: re.branch,
        codehost_id: re.codehost_id,
        repo_namespace: re.repo_namespace,
        filter_regexp: re.filter_regexp
      }))
    },
    artifactDeployEnabled () {
      return !!(
        this.workflowMeta.artifact_stage &&
        this.workflowMeta.artifact_stage.enabled
      )
    },
    buildDeployEnabled () {
      return !!(
        this.workflowMeta.build_stage && this.workflowMeta.build_stage.enabled
      )
    },
    showCreateVersion () {
      return !this.isHelm && !this.isPm
    },
    // 构造克隆任务数据
    forcedUserInput () {
      if (this.artifactDeployEnabled) {
        return {
          artifact_args: this.allServiceNames
        }
      } else {
        return null
      }
    }
  },
  methods: {
    async checkProjectFeature (projectName) {
      const res = await getSingleProjectAPI(projectName)
      const productFeature = res.product_feature
      if (productFeature.deploy_type === 'k8s') {
        if (productFeature.basic_facility === 'cloud_host') {
          this.isPm = true
        }
      } else if (productFeature.deploy_type === 'helm') {
        this.isHelm = true
      }
    },
    getWorkflow () {
      if (this.workflowType === 'workflow') {
        getWorkflowDetailAPI(this.projectName, this.workflowName).then(res => {
          this.workflowMeta = res
          const namespace = this.currentServiceMeta.envName
          const projectName = this.workflowMeta.product_tmpl_name
          this.precreate(`${projectName} / ${namespace}`)
        })
      }
    },
    async precreate (proNameAndNamespace) {
      const [, namespace] = proNameAndNamespace.split(' / ')
      this.precreateLoading = true
      const res = await precreateWorkflowTaskAPI(
        this.projectName,
        this.workflowName,
        namespace
      )
      // prepare targets for view
      for (let i = 0; i < res.targets.length; i++) {
        const maybeNew = res.targets[i]
        const targetIndex = this.currentServiceMeta.targets.findIndex(t => {
          return t.service_name === maybeNew.service_name
        })
        if (targetIndex >= 0) {
          maybeNew.picked = true
        } else {
          maybeNew.picked = false
        }
      }
      // prepare deploys for view
      for (const tar of res.targets) {
        for (const dep of tar.deploy) {
          this.$set(dep, 'picked', true)
        }
      }
      this.runner = res
      this.precreateLoading = false
      getAllBranchInfoAPI({ infos: this.allReposForQuery })
        .then(res => {
          // make these repo info more friendly
          res.forEach(repo => {
            if (repo.prs) {
              repo.prs.forEach(element => {
                element.pr = element.id
              })
              repo.branchPRsMap = this.$utils.arrayToMapOfArrays(
                repo.prs,
                'targetBranch'
              )
            } else {
              repo.branchPRsMap = {}
            }
            if (repo.branches) {
              repo.branchNames = repo.branches.map(b => b.name)
            } else {
              repo.branchNames = []
            }
          })
          // and make a map
          this.repoInfoMap = this.$utils.arrayToMap(
            res,
            re => `${re.repo_owner}/${re.repo}`
          )

          /* prepare build/test repo for view
         see watcher for allRepos */
          for (const repo of this.allRepos) {
            this.$set(repo, '_id_', `${repo.repo_owner}/${repo.repo_name}`)
            const repoInfo = this.repoInfoMap[repo._id_]
            this.$set(repo, 'branchNames', repoInfo && repoInfo.branchNames)
            this.$set(
              repo,
              'branchPRsMap',
              repoInfo && repoInfo.branchPRsMap
            )
            this.$set(repo, 'tags', repoInfo.tags ? repoInfo.tags : [])
            this.$set(repo, 'prNumberPropName', 'pr')
            this.$set(repo, 'errorMsg', repoInfo.error_msg || '')
            // make sure branch/pr/tag is reactive
            this.$set(repo, 'branch', repo.branch || '')
            this.$set(
              repo,
              repo.prNumberPropName,
              repo[repo.prNumberPropName] || null
            )
            this.$set(repo, 'tag', repo.tag || '')
            let branchOrTag = null
            if (repo.branch) {
              branchOrTag = {
                type: 'branch',
                id: `branch-${repo.branch}`,
                name: repo.branch
              }
            } else if (repo.tag) {
              branchOrTag = {
                type: 'tag',
                id: `tag-${repo.tag}`,
                name: repo.tag
              }
            }
            this.$set(repo, 'branchOrTag', branchOrTag)
            this.$set(repo, 'branchAndTagList', [
              {
                label: 'Branches',
                options: (repo.branchNames || []).map(name => {
                  return {
                    type: 'branch',
                    id: `branch-${name}`,
                    name
                  }
                })
              },
              {
                label: 'Tags',
                options: (repo.tags || []).map(tag => {
                  return {
                    type: 'tag',
                    id: `tag-${tag.name}`,
                    name: tag.name
                  }
                })
              }
            ])
          }
        })
        .catch(() => {
          this.precreateLoading = false
        })
    },
    startTask () {
      const repoKeysToDelete = [
        '_id_',
        'branchNames',
        'branchPRsMap',
        'tags',
        'isGithub',
        'prNumberPropName',
        'id',
        'branchOrTag',
        'branchAndTagList'
      ]
      this.runner.targets = this.pickedTargets
      const payload = cloneDeep(this.runner)
      if (this.artifactDeployEnabled && !this.isPm) {
        payload.registry_id = this.k8sArtifactDeployData.pickedRegistry
        payload.artifact_args = []
        payload.targets = []
        this.k8sArtifactDeployData.services.forEach(element => {
          payload.artifact_args.push({
            service_name: element.service_name,
            image_name: element.image_name,
            name: element.name,
            image: element.image,
            deploy: element.deploy
          })
        })
        // 处理 K8s 交付物部署版本信息
        if (this.k8sArtifactDeployData.versionInfo.enabled) {
          if (this.k8sArtifactDeployData.versionInfo.labelStr !== '') {
            this.k8sArtifactDeployData.versionInfo.labels = this.k8sArtifactDeployData.versionInfo.labelStr
              .trim()
              .split(';')
          }
          payload.version_args = cloneDeep(
            this.k8sArtifactDeployData.versionInfo
          )
        } // 处理物理机交付物部署信息
      } else if (this.artifactDeployEnabled && this.isPm) {
        payload.storage_id = this.pmArtifactDeployData.pickedStorage
        payload.artifact_args = []
        payload.targets = []
        this.pmArtifactDeployData.services.forEach(element => {
          if (element.file) {
            payload.artifact_args.push({
              service_name: element.service_name,
              name: element.name,
              file_name: element.file.file_name,
              deploy: element.deploy,
              task_id: element.file.task_id,
              workflow_name: element.file.workflow_name,
              url: element.file.url
            })
          }
        })
      } else {
        for (const tar of payload.targets) {
          // trim target
          delete tar.picked
          // trim build repos
          for (const repo of tar.build.repos) {
            repo.pr = repo.pr ? repo.pr : 0
            repo.branch = ''
            repo.tag = ''
            if (typeof (repo.prs) === 'string') {
              repo.prs = repo.prs.split(',').map(Number)
            }
            repo[repo.branchOrTag.type] = repo.branchOrTag.name
            for (const key of repoKeysToDelete) {
              delete repo[key]
            }
          }
          // filter deploys
          tar.deploy = tar.deploy.filter(d => d.picked)
          // trim deploys
          for (const dep of tar.deploy) {
            delete dep.picked
          }
        }
      }
      // trim test repos
      for (const test of payload.tests) {
        for (const repo of test.builds) {
          repo.pr = repo.pr ? repo.pr : 0
          for (const key of repoKeysToDelete) {
            delete repo[key]
          }
        }
      }
      const projectName = this.workflowMeta.product_tmpl_name
      if (!this.checkInput(payload)) {
        return
      }
      this.startTaskLoading = true
      runWorkflowAPI(projectName, payload, this.artifactDeployEnabled)
        .then(res => {
          this.$message.success('创建成功')
          this.$emit('success')
          this.$router.push(
            `/v1/projects/detail/${projectName}/pipelines/multi/${res.pipeline_name}/${res.task_id}?status=running`
          )
        })
        .catch(error => {
          if (error.response && error.response.data.code === 6168) {
            const projectName = error.response.data.extra.productName
            const envName = error.response.data.extra.envName
            const serviceName = error.response.data.extra.serviceName
            this.$message({
              message: `检测到 ${projectName} 中 ${envName} 环境下的 ${serviceName} 服务未启动 <br> 请检查后再运行工作流`,
              type: 'warning',
              dangerouslyUseHTMLString: true,
              duration: 5000
            })
            this.$router.push(
              `/v1/projects/detail/${projectName}/envs/detail/${serviceName}?envName=${envName}&projectName=${projectName}`
            )
          }
        })
        .finally(() => {
          this.startTaskLoading = false
        })
    },
    checkInput (payload) {
      // Checking K8s artifact deploy
      if (this.artifactDeployEnabled && !this.isPm) {
        const invalidService = []
        this.k8sArtifactDeployData.services.forEach(item => {
          if (item.image === '' || item.image === undefined) {
            invalidService.push(item.name)
          }
        })
        if (this.k8sArtifactDeployData.services.length === 0) {
          this.$message({
            message: '请选择需要部署的服务',
            type: 'error'
          })
          return false
        } else {
          if (
            this.k8sArtifactDeployData.services.length > 0 &&
            this.k8sArtifactDeployData.pickedRegistry === ''
          ) {
            this.$message({
              message: '请选择镜像仓库',
              type: 'error'
            })
            return false
          } else if (invalidService.length > 0) {
            this.$message({
              message: invalidService.join(',') + ' 服务尚未选择镜像',
              type: 'error'
            })
            return false
          } else if (
            this.k8sArtifactDeployData.versionInfo.enabled &&
            this.k8sArtifactDeployData.versionInfo.version === ''
          ) {
            this.$message({
              message: '请填写版本名称',
              type: 'error'
            })
            return false
          } else {
            return true
          }
        } // Checking PM artifact deploy
      } else if (this.artifactDeployEnabled && this.isPm) {
        const invalidService = []
        this.pmArtifactDeployData.services.forEach(item => {
          if (!item.file) {
            invalidService.push(item.name)
          }
        })
        if (this.pmArtifactDeployData.services.length === 0) {
          this.$message({
            message: '请选择需要部署的服务',
            type: 'error'
          })
          return false
        } else {
          if (
            this.pmArtifactDeployData.services.length > 0 &&
            this.pmArtifactDeployData.pickedStorage === ''
          ) {
            this.$message({
              message: '请选择对象存储',
              type: 'error'
            })
            return false
          } else if (invalidService.length > 0) {
            this.$message({
              message: invalidService.join(',') + ' 服务尚未选择交付物',
              type: 'error'
            })
            return false
          } else {
            return true
          }
        } // Checking K8s deploy
      } else {
        if (payload.tests.length === 0 && payload.targets.length === 0) {
          this.$message({
            message: '请选择需要构建的服务',
            type: 'error'
          })
          return
        }
        // Checking repos
        const allRepos = flattenDeep(
          payload.targets.map(tar => tar.build.repos)
        ).concat(flattenDeep(payload.tests.map(test => test.builds)))
        const invalidRepo = allRepos.filter(repo => {
          if (repo.branch === '' && !repo.pr && repo.tag === '') {
            return true
          } else {
            return false
          }
        })
        if (invalidRepo.length === 0) {
          return true
        } else {
          this.$message({
            message:
              invalidRepo
                .map(item => {
                  return item.repo_name
                })
                .join(',') + ' 代码库尚未选择构建信息',
            type: 'error'
          })
          return false
        }
      }
    }
  },
  async created () {
    if (this.workflows && this.workflows.length > 0) {
      this.workflowName = this.workflows[0].name
      if (this.workflowType === 'workflow') {
        const workflowMeta = await getWorkflowDetailAPI(
          this.projectName,
          this.workflowName
        )
        this.workflowMeta = workflowMeta
        const namespace = this.currentServiceMeta.envName
        const projectName = this.workflowMeta.product_tmpl_name
        this.precreate(`${projectName} / ${namespace}`)
      }
      // Determine the project type and use different types of startup methods
      this.checkProjectFeature(this.projectName)
    }
  },
  props: {
    workflows: {
      required: true,
      type: Array,
      default: () => []
    },
    currentServiceMeta: {
      type: Object,
      required: true,
      default: null
    }
  },
  components: {
    WorkflowBuildRows,
    PmArtifactDeploy,
    K8sArtifactDeploy
  }
}
</script>

<style lang="less">
.run-workflow {
  .advanced-setting {
    margin-bottom: 10px;
    padding: 0 0;
  }

  .el-input,
  .el-select {
    &.full-width {
      width: 40%;
    }
  }

  .create-version {
    .el-input,
    .el-textarea,
    .el-select {
      &.full-width {
        width: 40%;
      }
    }

    .create-checkbox {
      margin-bottom: 15px;
    }
  }

  .start-task {
    margin-top: 15px;
  }
}
</style>
