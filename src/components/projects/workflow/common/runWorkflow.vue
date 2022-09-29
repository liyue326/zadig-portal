<template>
  <el-form class="run-workflow"
           label-width="90px">
    <el-form-item prop="productName"
                  label="环境">
      <el-select :value="runner.product_tmpl_name && runner.namespace ? `${runner.product_tmpl_name} / ${runner.namespace}` : ''"
                 @change="getPresetInfo"
                 size="medium"
                 :disabled="specificEnv"
                 class="full-width">
        <el-option v-for="pro of currentProjectEnvs"
                   :key="`${pro.projectName} / ${pro.name}`"
                   :label="`${pro.projectName} / ${pro.name}${pro.production?'（生产）':''}`"
                   :value="`${pro.projectName} / ${pro.name}`">
          <span>{{`${pro.projectName} / ${pro.name}`}}
            <el-tag v-if="pro.production"
                    type="danger"
                    size="mini"
                    effect="light">
              生产
            </el-tag>
          </span>
        </el-option>
        <el-option v-if="currentProjectEnvs.length===0"
                   label=""
                   value="">
          <router-link style="color: #909399;"
                       :to="`/v1/projects/detail/${targetProject}/envs/create`">
            {{`(环境不存在或者没有权限，点击创建环境)`}}
          </router-link>
        </el-option>
      </el-select>
      <el-tooltip v-if="specificEnv"
                  effect="dark"
                  content="该工作流已指定环境运行，可通过修改 工作流->基本信息 来解除指定环境绑定"
                  placement="top">
        <span><i style="color: #909399;"
             class="el-icon-question"></i></span>
      </el-tooltip>
      <div v-if="imageRegistryByEnv" class="show-image-info">镜像仓库：{{imageRegistryByEnv}}</div>
    </el-form-item>

    <div v-if="buildDeployEnabled"
         v-loading="precreateLoading">
      <el-form-item v-if="quickSelectEnabled"
                    label="构建">
        <el-select v-model="pickedBuildTarget"
                   filterable
                   clearable
                   multiple
                   reserve-keyword
                   value-key="name"
                   @change="pickBuildConfig"
                   size="medium"
                   class="full-width">
          <el-option v-for="(build,index) of buildTargets"
                     :key="index"
                     :label="build.name"
                     :value="build">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="服务">
        <el-select v-model="pickedBuildTargetNames"
                   filterable
                   multiple
                   clearable
                   reserve-keyword
                   value-key="key"
                   size="medium"
                   class="full-width">
          <el-option v-for="(service,index) of allServiceNames"
                     :key="index"
                     :disabled="!service.has_build"
                     :label="service.name"
                     :value="service">
            <span v-if="!service.has_build">
              <router-link style="color: #ccc;"
                           :to="`/v1/projects/detail/${runner.product_tmpl_name}/builds/create?service_name=${service.name}`">
                {{`${service.name}(${service.service_name}) (服务不存在构建，点击添加构建)`}}
              </router-link>
            </span>
            <span v-else>
              <span>{{service.name}}</span><span style="color: #ccc;"> ({{service.service_name}})</span>
            </span>
          </el-option>
        </el-select>
        <template v-if="!quickSelectEnabled">
          <el-button size="small"
                     @click="quickSelectEnabled=!quickSelectEnabled"
                     type="text">快捷选服务
          </el-button>
          <el-tooltip effect="dark"
                      content="通过指定构建配置间接选择出需要的服务"
                      placement="top">
            <span><i style="color: #909399;"
                 class="el-icon-question"></i></span>
          </el-tooltip>
        </template>

      </el-form-item>
      <!-- Build -->
      <div v-if="pickedTargets.length > 0">
        <WorkflowBuildRows :pickedTargets="pickedTargets"></WorkflowBuildRows>
      </div>
    </div>

    <template  v-if="artifactDeployEnabled">
      <!-- K8s Artifact Deploy -->
      <K8sArtifactDeploy
      v-if="!isPm"
      ref="k8sArtifactRef"
      v-loading="precreateLoading"
      :forcedUserInput="forcedUserInput"
      :allServices="allServiceNames"
      :showCreateVersion="showCreateVersion"
      :k8sArtifactDeployData.sync="k8sArtifactDeployData"
      />
      <!-- Pm Artifact Deploy -->
      <PmArtifactDeploy
      v-if="isPm"
      v-loading="precreateLoading"
      :forcedUserInput="forcedUserInput"
      :projectName = "projectName"
      :allServices="allServiceNames"
      :pmArtifactDeployData.sync="pmArtifactDeployData"  />
    </template>

    <!--  Test -->
    <div v-if="runner.tests.length > 0">
      <WorkflowTestRows :runnerTests="runner.tests"></WorkflowTestRows>
    </div>

    <div v-if="buildDeployEnabled"
         class="advanced-setting">
      <el-collapse>
        <el-collapse-item title="高级设置"
                          name="advanced">
          <el-checkbox v-model="runner.reset_cache">不使用工作空间缓存
            <el-tooltip effect="dark"
                        content="可能会增加任务时长。如果构建中不使用工作空间缓存，该设置会被忽略"
                        placement="top">
              <span><i style="color: #909399;"
                   class="el-icon-question"></i></span>
            </el-tooltip>
          </el-checkbox>
          <br>
          <el-checkbox v-model="runner.ignore_cache">不使用 Docker 缓存
            <el-tooltip effect="dark"
                        content="只对配置了镜像构建步骤的构建生效"
                        placement="top">
              <span><i style="color: #909399;"
                   class="el-icon-question"></i></span>
            </el-tooltip>
          </el-checkbox>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="start-task">
      <el-button @click="startTask"
                 :loading="startTaskLoading"
                 type="primary"
                 size="small">
        {{ startTaskLoading?'启动中':'启动任务' }}
      </el-button>
    </div>
  </el-form>
</template>

<script>
import WorkflowBuildRows from '@/components/common/workflowBuildRows.vue'
import WorkflowTestRows from '@/components/common/workflowTestRows.vue'
import K8sArtifactDeploy from './k8sArtifactDeploy.vue'
import PmArtifactDeploy from './pmArtifactDeploy.vue'
import { listProductAPI, precreateWorkflowTaskAPI, getAllBranchInfoAPI, runWorkflowAPI, getBuildTargetsAPI, getSingleProjectAPI, getRegistryWhenBuildAPI } from '@api'
import { sortBy, keyBy, orderBy, cloneDeep, flattenDeep, differenceBy } from 'lodash'

export default {
  data () {
    return {
      buildTargets: [],
      pickedBuildTarget: [],
      imageRegistry: [],
      currentProjectEnvs: [],
      allServiceNames: [],
      pickedBuildTargetNames: [],
      k8sArtifactDeployData: {},
      pmArtifactDeployData: {},
      runner: {
        workflow_name: '',
        product_tmpl_name: '',
        namespace: '',
        targets: [],
        tests: []
      },
      specificEnv: true,
      precreateLoading: false,
      startTaskLoading: false,
      quickSelectEnabled: false,
      isHelm: false,
      isPm: false
    }
  },
  computed: {
    artifactDeployEnabled () {
      return !!((this.workflowMeta.artifact_stage && this.workflowMeta.artifact_stage.enabled))
    },
    buildDeployEnabled () {
      return this.workflowMeta.build_stage.enabled
    },
    distributeEnabled () {
      return !!this.runner.distribute_enabled
    },
    pickedTargets: {
      get () {
        this.pickedBuildTargetNames.forEach((item) => {
          item.deploy.forEach((deploy) => {
            // Set deploy is enabled by default
            deploy.picked = deploy.picked !== false
          })
        })
        return cloneDeep(this.pickedBuildTargetNames)
      }
    },
    haveForcedInput () {
      return !this.$utils.isEmpty(this.forcedUserInput)
    },
    showCreateVersion () {
      return !this.isHelm && !this.isPm
    },
    imageRegistryByEnv () {
      if (this.isPm || !this.currentProjectEnvs.length || !this.runner.namespace) {
        return
      }
      const namespace = this.runner.namespace
      const registryId = this.currentProjectEnvs.find(env => env.name === namespace).registry_id
      if (registryId) {
        const registry = this.imageRegistry.find(registry => registry.id === registryId)
        if (registry) {
          return registry.namespace ? `${registry.reg_addr}/${registry.namespace}` : registry.reg_addr
        }
      }
      return ''
    },
    projectName () {
      return this.workflowMeta.product_tmpl_name
    }
  },
  watch: {
    pickedBuildTargetNames: {
      immediate: true,
      handler: function (val, oldVal) {
        const newPicked = differenceBy(val, oldVal)
        this.pickBuildService(newPicked)
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
    pickBuildConfig () {
      let allBuildTargets = []
      this.pickedBuildTarget.forEach(t => {
        allBuildTargets = allBuildTargets.concat(t.targets)
      })
      this.pickedBuildTargetNames = this.allServiceNames.filter(t => {
        const index = allBuildTargets.findIndex(i => {
          return i.service_name === t.service_name && i.service_module === t.name
        })
        if (index >= 0) {
          return t
        }
        return false
      })
      this.pickBuildService(this.pickedBuildTargetNames)
    },
    pickBuildService (services) {
      // Get service repo info
      const buildRepos = flattenDeep(services.map(tar => tar.build.repos))
      this.getRepoInfo(buildRepos)
    },
    pickTestService (tests) {
      // Get test repo info
      const testRepos = flattenDeep(tests.map(test => test.builds))
      this.getRepoInfo(testRepos)
    },
    async getRepoInfo (originRepos) {
      const reposQuery = originRepos.map(re => {
        if (re.source === 'codehub') {
          return {
            source: re.source,
            repo_owner: re.repo_owner,
            repo: re.repo_name,
            default_branch: re.branch,
            project_uuid: re.project_uuid,
            repo_uuid: re.repo_uuid,
            repo_id: re.repo_id,
            codehost_id: re.codehost_id
          }
        } else {
          return {
            source: re.source,
            repo_owner: re.repo_owner,
            repo: re.repo_name,
            default_branch: re.branch,
            codehost_id: re.codehost_id,
            repo_namespace: re.repo_namespace,
            filter_regexp: re.filter_regexp
          }
        }
      })
      const payload = { infos: reposQuery }
      // b = branch, p = pr, t = tag
      const res = await getAllBranchInfoAPI(payload)
      // make these repo info more friendly
      res.forEach(repo => {
        if (repo.prs) {
          repo.prs.forEach(element => {
            element.pr = element.id
          })
          repo.branchPRsMap = this.$utils.arrayToMapOfArrays(repo.prs, 'targetBranch')
        } else {
          repo.branchPRsMap = {}
        }
        if (repo.branches) {
          repo.branchNames = repo.branches.map(b => b.name)
        } else {
          repo.branchNames = []
        }
      })

      const repoInfoMap = keyBy(res, (repo) => {
        return `${repo.repo_owner}/${repo.repo}`
      })
      for (const repo of originRepos) {
        this.$set(repo, '_id_', `${repo.repo_owner}/${repo.repo_name}`)
        const repoInfo = repoInfoMap[repo._id_]
        this.$set(repo, 'branchNames', repoInfo && repoInfo.branchNames)
        this.$set(repo, 'branchPRsMap', repoInfo && repoInfo.branchPRsMap)
        this.$set(repo, 'tags', (repoInfo && repoInfo.tags) ? repoInfo.tags : [])
        this.$set(repo, 'prNumberPropName', 'pr')
        if (repoInfo) {
          this.$set(repo, 'errorMsg', repoInfo.error_msg || '')
        }
        this.$set(repo, 'branch', repo.branch || '')
        this.$set(repo, repo.prNumberPropName, repo[repo.prNumberPropName] || null)
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
        this.$set(repo, 'branchAndTagList', [{
          label: 'Branches',
          options: (repo.branchNames || []).map(name => {
            return {
              type: 'branch',
              id: `branch-${name}`,
              name
            }
          })
        }, {
          label: 'Tags',
          options: (repo.tags || []).map(tag => {
            return {
              type: 'tag',
              id: `tag-${tag.name}`,
              name: tag.name
            }
          })
        }])
      }
    },
    getPresetInfo (projectNameAndEnvName, initArtifactImage = true) {
      const [, namespace] = projectNameAndEnvName.split(' / ')
      this.precreateLoading = true

      if (initArtifactImage && this.currentProjectEnvs.length && this.$refs.k8sArtifactRef) {
        const registryId = this.currentProjectEnvs.find(env => env.name === namespace).registry_id
        this.$refs.k8sArtifactRef.changeRegistryId(registryId)
      }

      precreateWorkflowTaskAPI(this.projectName, this.workflowName, namespace).then(res => {
      // Cloning task parameters exist
        if (this.haveForcedInput) {
          res.product_tmpl_name = this.forcedUserInput.product_tmpl_name
          const targets = orderBy(sortBy(this.forcedUserInput.targets.map(element => {
            element.key = element.name + '/' + element.service_name
            return element
          }), 'service_name'))
          // Set the default value of the deploy in targets
          targets.forEach(element => {
            if (element.deploy.length === 0) {
              element.deploy = [{
                env: `${element.service_name}/${element.name}`,
                picked: false,
                type: 'k8s'
              }]
            }
          })
          // Set the default value of the build targets
          this.$set(this, 'pickedBuildTargetNames', targets)
          // Set the default value of the test targets
          res.tests = this.forcedUserInput.tests
        }
        // Selected by default when only one service is available
        const avaliableTargets = res.targets.filter(element => {
          return element.has_build
        })
        if (!this.haveForcedInput && avaliableTargets.length === 1) {
          this.$set(this, 'pickedBuildTargetNames', avaliableTargets)
        }
        this.runner = res
        this.allServiceNames = cloneDeep(orderBy(sortBy(this.runner.targets.map(element => {
          element.key = element.name + '/' + element.service_name
          return element
        }), 'service_name'), 'name'))
        this.precreateLoading = false
        this.pickTestService(res.tests)
      }).catch(() => {
        this.precreateLoading = false
      })
    },
    startTask () {
      const repoKeysToDelete = [
        '_id_', 'branchNames', 'branchPRsMap', 'tags', 'isGithub', 'prNumberPropName', 'id', 'branchOrTag', 'branchAndTagList'
      ]
      this.runner.targets = this.pickedTargets
      const payload = cloneDeep(this.runner)
      if (this.artifactDeployEnabled && !this.isPm) {
        payload.registry_id = this.k8sArtifactDeployData.pickedRegistry
        payload.artifact_args = []
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
            this.k8sArtifactDeployData.versionInfo.labels = this.k8sArtifactDeployData.versionInfo.labelStr.trim().split(';')
          }
          payload.version_args = cloneDeep(this.k8sArtifactDeployData.versionInfo)
        }// 处理物理机交付物部署信息
      } else if (this.artifactDeployEnabled && this.isPm) {
        payload.storage_id = this.pmArtifactDeployData.pickedStorage
        payload.artifact_args = []
        this.pmArtifactDeployData.services.forEach(element => {
          payload.artifact_args.push({
            service_name: element.service_name,
            name: element.name,
            file_name: element.file.file_name,
            deploy: element.deploy,
            task_id: element.file.task_id,
            workflow_name: element.file.workflow_name,
            url: element.file.url
          })
        })
      } else {
        for (const tar of payload.targets) {
          // trim build repos
          for (const repo of tar.build.repos) {
            repo.pr = repo.pr ? repo.pr : 0
            repo.branch = ''
            repo.tag = ''
            if (repo.branchOrTag) {
              repo[repo.branchOrTag.type] = repo.branchOrTag.name
            }
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

        // trim test repos
        for (const test of payload.tests) {
          for (const repo of test.builds) {
            repo.pr = repo.pr ? repo.pr : 0
            for (const key of repoKeysToDelete) {
              delete repo[key]
            }
          }
        }
      }
      const projectName = this.targetProject
      if (!this.checkInput(payload)) {
        return
      }
      this.startTaskLoading = true
      runWorkflowAPI(projectName, payload, this.artifactDeployEnabled).then(res => {
        const taskId = res.task_id
        const workflowName = res.pipeline_name
        this.$message.success('创建成功')
        this.$emit('success')
        this.$router.push(`/v1/projects/detail/${projectName}/pipelines/multi/${workflowName}/${taskId}?status=running`)
      }).catch(error => {
        console.log(error)
        // handle error
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
          this.$router.push(`/v1/projects/detail/${projectName}/envs/detail/${serviceName}?envName=${envName}&projectName=${projectName}`)
        }
      }).finally(() => {
        this.startTaskLoading = false
      })
    },
    checkInput (payload) {
      // Checking environment
      if (!payload.product_tmpl_name || !payload.namespace) {
        this.$message.error('请选择环境')
        return false
      }
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
          if (this.k8sArtifactDeployData.services.length > 0 && this.k8sArtifactDeployData.pickedRegistry === '') {
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
          } else if (this.k8sArtifactDeployData.versionInfo.enabled && this.k8sArtifactDeployData.versionInfo.version === '') {
            this.$message({
              message: '请填写版本名称',
              type: 'error'
            })
            return false
          } else {
            return true
          }
        }// Checking PM artifact deploy
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
          if (this.pmArtifactDeployData.services.length > 0 && this.pmArtifactDeployData.pickedStorage === '') {
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
        }// Checking K8s deploy
      } else {
        if (payload.tests.length === 0 && payload.targets.length === 0) {
          this.$message({
            message: '请选择需要构建的服务',
            type: 'error'
          })
          return
        }
        // Checking repos
        const allRepos = flattenDeep(payload.targets.map(tar => tar.build.repos)).concat(flattenDeep(payload.tests.map(test => test.builds)))
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
            message: invalidRepo.map((item) => { return item.repo_name }).join(',') + ' 代码库尚未选择构建信息',
            type: 'error'
          })
          return false
        }
      }
    },
    getRegistryInfo (projectName) {
      getRegistryWhenBuildAPI(projectName).then(res => {
        this.imageRegistry = res
      })
    }
  },
  created () {
    const projectName = this.projectName
    this.getRegistryInfo(projectName)
    if (this.buildDeployEnabled) {
      getBuildTargetsAPI(projectName).then(res => {
        this.buildTargets = res
      })
    }
    listProductAPI(projectName).then(res => {
      // Sort by environment type first, then by name
      this.currentProjectEnvs = orderBy(res, ['production', 'name'], ['asc', 'asc'])
      // If the specified environment exists, the data is displayed, and if it does not match, it is manually selected
      if (this.workflowMeta.env_name && this.currentProjectEnvs.find(env => (env.name === this.workflowMeta.env_name))) {
        const envName = this.workflowMeta.env_name
        this.specificEnv = true
        this.getPresetInfo(`${projectName} / ${envName}`)
      } else {
        this.specificEnv = false
      }
      // For task clone
      if (this.haveForcedInput) {
        const projectName = this.forcedUserInput.product_tmpl_name
        const envName = this.forcedUserInput.namespace
        this.getPresetInfo(`${projectName} / ${envName}`, false)
      }
    })
    // Determine the project type and use different types of startup methods
    this.checkProjectFeature(projectName)
  },
  props: {
    workflowName: {
      type: String,
      required: true
    },
    targetProject: {
      type: String,
      required: true
    },
    workflowMeta: {
      type: Object,
      required: true
    },
    forcedUserInput: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  components: {
    WorkflowBuildRows,
    WorkflowTestRows,
    PmArtifactDeploy,
    K8sArtifactDeploy
  }
}
</script>

<style lang="less">
.run-workflow {
  .service-deploy-table {
    width: auto;
    margin-bottom: 15px;
    padding: 0 5px;
  }

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
    margin-bottom: 10px;
    margin-left: 10px;
  }

  .show-image-info {
    margin: 2px 0 -10px;
    color: #b1b3b6;
    font-size: 12px;
    line-height: 1;
  }
}
</style>
