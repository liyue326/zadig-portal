<template>
  <el-form class="workflow-args"
           label-width="100px"
           label-position="left">
    <el-form-item prop="productName"
                  :label="$t(`project.environments`)">
      <el-select :value="runner.product_tmpl_name&&runner.namespace ? `${runner.product_tmpl_name} / ${runner.namespace}` : ''"
                 @change="precreate"
                 size="small"
                 class="full-width">
        <el-option v-for="pro of matchedProducts"
                   :key="`${pro.projectName} / ${pro.name}`"
                   :label="`${pro.projectName} / ${pro.name}`"
                   :value="`${pro.projectName} / ${pro.name}`">
          <span>{{`${pro.projectName} / ${pro.name}`}}
          </span>
        </el-option>
      </el-select>
    </el-form-item>

    <div v-if="workflowMeta.build_stage.enabled"
         v-loading="precreateLoading">
      <el-form-item :label="$t(`project.services`)">
        <el-select v-model="pickedTargets"
                   filterable
                   multiple
                   clearable
                   value-key="key"
                   size="small"
                   class="full-width">
          <el-option v-for="(service,index) of allServiceNames"
                     :key="index"
                     :disabled="!service.has_build"
                     :label="service.name"
                     :value="service">
            <span v-if="!service.has_build">
              <router-link style="color: #ccc;"
                           :to="`/v1/projects/detail/${runner.product_tmpl_name}/builds/create?service_name=${service.name}`">
                {{`${service.name}(${service.service_name})(服务不存在构建，点击添加构建)`}}
              </router-link>
            </span>
            <span v-else>
              <span>{{service.name}}</span><span style="color: #ccc;"> ({{service.service_name}})</span>
            </span>
          </el-option>
        </el-select>
      </el-form-item>

      <div v-if="pickedTargets.length > 0">
        <WorkflowBuildRows :pickedTargets="pickedTargets"/>
      </div>
    </div>
    <div v-if="workflowMeta.test_stage.enabled">
      <WorkflowTestRows :runnerTests="runner.tests"/>
    </div>

    <div class="start-task"
         v-if="whichSave === 'inside'">
      <el-button @click="submit"
                 type="primary"
                 size="small">
        确定
      </el-button>
    </div>

  </el-form>
</template>

<script>
import _ from 'lodash'
import WorkflowBuildRows from '@/components/common/workflowBuildRows.vue'
import WorkflowTestRows from '@/components/common/workflowTestRows.vue'
import { listProductAPI, createWorkflowTaskAPI, getAllBranchInfoAPI } from '@api'

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
      pickedTargets: [],
      products: [],
      repoInfoMap: {},
      precreateLoading: false
    }
  },
  computed: {
    distributeEnabled () {
      return this.workflowMeta.distribute_stage.enabled
    },
    allServiceNames () {
      return this.runner.targets.map(element => {
        element.key = element.name + '/' + element.service_name
        return element
      })
    },
    allRepos () {
      const buildRepos = this.runner.targets.length > 0 ? this.$utils.flattenArray(this.runner.targets.map(tar => tar.build.repos)) : []
      const testRepos = this.runner.tests.length > 0 ? this.$utils.flattenArray(this.runner.tests.map(t => t.builds)) : []
      return buildRepos.concat(testRepos)
    },
    allReposForQuery () {
      const allReposDeduped = this.$utils.deduplicateArray(
        this.allRepos,
        re => `${re.repo_owner}/${re.repo_name}`
      ) || []
      return allReposDeduped.map(re => ({
        repo_owner: re.repo_owner,
        repo: re.repo_name,
        default_branch: re.branch,
        codehost_id: re.codehost_id,
        repo_namespace: re.repo_namespace
      }))
    },
    haveForcedInput () {
      return !this.$utils.isEmpty(this.forcedUserInput)
    },
    forcedInputTargetMap () {
      if (this.haveForcedInput) {
        if (this.artifactDeployEnabled) {
          return _.keyBy(this.forcedUserInput.artifact_args, (i) => {
            return i.service_name + '/' + i.name
          })
        }
        return _.keyBy(this.forcedUserInput.targets, (i) => {
          return i.service_name + '/' + i.name
        })
      }
      return {}
    },
    forcedInputTarget () {
      if (this.haveForcedInput) {
        if (this.artifactDeployEnabled) {
          return this.forcedUserInput.artifact_args
        }
        return this.forcedUserInput.targets
      }
      return {}
    },
    matchedProducts () {
      return this.products.filter(p => p.projectName === this.targetProject)
    }
  },
  watch: {
    'runner.namespace' (newVal) {
      this.runner.tests.forEach(info => {
        info.namespace = newVal
      })
    }
  },
  methods: {
    precreate (proNameAndNamespace) {
      const [, namespace] = proNameAndNamespace.split(' / ')
      this.precreateLoading = true

      const deployID = (deploy) => {
        return `${deploy.env}|${deploy.type}`
      }
      createWorkflowTaskAPI(this.targetProject, namespace).then(res => {
        // prepare targets for view
        for (let i = 0; i < res.targets.length; i++) {
          res.targets[i].picked = false
          if (this.haveForcedInput) {
            const old = res.targets[i]
            const forcedObj = this.forcedInputTargetMap[`${old.service_name}/${old.name}`]
            if (forcedObj) {
              res.targets.splice(
                i,
                1,
                Object.assign(this.$utils.cloneObj(forcedObj), { deploy: old.deploy }, { picked: true })
              )
            }
          }
        }
        for (const tar of res.targets) {
          const forced = this.haveForcedInput ? this.forcedInputTargetMap[`${tar.service_name}/${tar.name}`] : null
          const depMap = forced ? this.$utils.arrayToMap((forced.deploy || []), deployID) : {}
          for (const dep of tar.deploy) {
            this.$set(dep, 'picked', !forced || (deployID(dep) in depMap))
          }
        }
        this.runner.workflow_name = this.workflowName
        this.runner.product_tmpl_name = this.targetProject
        this.runner.namespace = namespace

        if (this.haveForcedInput) {
          this.runner.description = this.forcedUserInput.description
          this.runner.tests = this.forcedUserInput.tests || []
          this.$set(this, 'pickedTargets', res.targets.filter(t => { return t.picked }))
        }
        this.runner.targets = res.targets
        this.precreateLoading = false
        getAllBranchInfoAPI({ infos: this.allReposForQuery }).then(res => {
          // make these repo info more friendly
          for (const repo of res) {
            if (repo.prs) {
              repo.prs.forEach(element => {
                element.pr = element.id
              })
              repo.branchPRsMap = this.$utils.arrayToMapOfArrays(repo.prs, 'targetBranch')
            } else {
              repo.branchPRsMap = {}
            }
            repo.branchNames = repo.branches ? repo.branches.map(b => b.name) : []
          }
          // and make a map
          this.repoInfoMap = this.$utils.arrayToMap(res, re => `${re.repo_owner}/${re.repo}`)
          for (const repo of this.allRepos) {
            this.$set(repo, '_id_', `${repo.repo_owner}/${repo.repo_name}`)
            const repoInfo = this.repoInfoMap[repo._id_]
            this.$set(repo, 'branchNames', repoInfo && repoInfo.branchNames)
            this.$set(repo, 'branchPRsMap', repoInfo && repoInfo.branchPRsMap)
            this.$set(repo, 'tags', repoInfo && repoInfo.tags)
            this.$set(repo, 'prNumberPropName', 'pr')
            this.$set(repo, 'errorMsg', (repoInfo.error_msg ? repoInfo.error_msg : ''))
            // make sure branch/pr/tag is reactive
            this.$set(repo, 'branch', repo.branch || '')
            this.$set(repo, repo.prNumberPropName, repo[repo.prNumberPropName] || undefined)
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
        }).catch(() => {
          this.precreateLoading = false
        })
      }).catch(() => {
        this.precreateLoading = false
      })
    },

    submit () {
      if (!this.checkInput()) {
        return
      }
      const clone = this.$utils.cloneObj(this.runner)
      const repoKeysToDelete = [
        '_id_', 'branchNames', 'branchPRsMap', 'tags', 'isGithub', 'prNumberPropName', 'id', 'branchOrTag', 'branchAndTagList'
      ]
      // filter targets
      clone.targets = this.pickedTargets
      for (const tar of clone.targets) {
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

      if (clone.tests) {
        // trim test repos
        for (const test of clone.tests) {
          for (const repo of test.builds) {
            repo.pr = repo.pr ? repo.pr : 0
            for (const key of repoKeysToDelete) {
              delete repo[key]
            }
          }
        }
      }

      if (!this.workflowMeta.test_stage.enabled) {
        delete clone.tests
      }
      this.$emit('success', clone)
      return clone
    },
    checkInput () {
      if (!this.runner.product_tmpl_name || !this.runner.namespace) {
        this.$message.error('请选择环境')
        return false
      }

      const emptyValue = []

      this.allRepos.forEach(item => {
        if (item.use_default || !item.repo_name) {
          return
        }

        if (!item.branchOrTag) {
          emptyValue.push(item.repo_name)
        }
      })

      if (emptyValue.length === 0) {
        return true
      } else {
        this.$message({
          message: emptyValue.join(',') + ' 代码尚未选择构建信息',
          type: 'error'
        })
        return false
      }
    }
  },
  created () {
    this.runner.tests = this.testInfos
    listProductAPI(this.targetProject).then(res => {
      this.products = res
      const product = this.forcedUserInput.product_tmpl_name
      const namespace = this.forcedUserInput.namespace
      if (this.haveForcedInput &&
        this.products.find(p => p.projectName === product)) {
        this.precreate(`${product} / ${namespace}`)
      }
    })
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
    },
    testInfos: {
      type: Array,
      default () {
        return []
      }
    },
    whichSave: {
      typeof: String,
      default: 'inside'
    }
  },
  components: {
    WorkflowBuildRows,
    WorkflowTestRows
  }
}
</script>

<style lang="less" >
.workflow-args {
  .el-input,
  .el-select {
    &.full-width {
      width: 40%;
    }

    width: 100%;
  }
}
</style>
