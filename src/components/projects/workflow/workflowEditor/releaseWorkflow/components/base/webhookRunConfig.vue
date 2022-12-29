<template>
  <div class="custom-workflow">
    <el-form label-position="left" label-width="130px" size="small">
      <el-collapse v-model="activeName">
        <el-collapse-item title="工作流变量" name="env" class="mg-l8" v-if="payload.params && payload.params.length>0&&isShowParams">
          <el-table :data="payload.params.filter(item=>item.isShow)">
            <el-table-column :label="$t(`global.key`)">
              <template slot-scope="scope">{{scope.row.name}}</template>
            </el-table-column>
            <el-table-column :label="$t(`global.value`)">
              <template slot-scope="scope">
                <el-select v-model="scope.row.value" v-if="scope.row.type === 'choice'" size="small" style="width: 220px;">
                  <el-option v-for="(item,index) in scope.row.choice_option" :key="index" :value="item" :label="item">{{item}}</el-option>
                </el-select>
                <el-input
                  v-if="scope.row.type === 'text'"
                  v-model="scope.row.value"
                  size="small"
                  type="textarea"
                  :rows="2"
                  style="width: 220px;"
                ></el-input>
                <el-input
                  v-if="scope.row.type === 'string'"
                  class="password"
                  v-model="scope.row.value"
                  size="small"
                  type="text"
                  style="width: 220px;"
                ></el-input>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
        <div v-for="(stage,stageIndex) in payload.stages" :key="stage.name">
          <el-collapse-item
            v-for="(job,jobIndex) in stage.jobs"
            :title="`${job.name}`"
            :key="job.name"
            :name="`${stageIndex}${jobIndex}`"
            class="mg-l8"
          >
            <template slot="title">
              <!-- <el-checkbox v-model="job.skipped"></el-checkbox> -->
              <el-switch v-model="job.skipped" :active-value="false" :inactive-value="true" @click.stop.native></el-switch>
              <span class="mg-l8">{{job.name}}</span>
            </template>
            <div v-if="job.type === 'zadig-build'">
              <el-form-item :label="$t(`global.serviceModule`)">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="value"
                  size="small"
                  style="width: 220px;"
                  @change="handleServiceBuildChange($event,job)"
                >
                  <el-option
                    v-for="(service,index) of job.spec.service_and_builds"
                    :key="index"
                    :label="`${service.service_module}(${service.service_name})`"
                    :value="service"
                  >
                    <span>{{service.service_module}}</span>
                    <span style="color: #ccc;">({{service.service_name}})</span>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item :label="$t(`status.imageRepo`)" prop="docker_registry_id">
                <el-select v-model="job.spec.docker_registry_id" filterable placeholder="请选择镜像" size="small" style="width: 220px;">
                  <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
                </el-select>
              </el-form-item>
              <div v-if="job.pickedTargets">
                <CustomWorkflowBuildRows :pickedTargets="job.pickedTargets" :elSelectWidth="'140px'" />
              </div>
            </div>
            <div v-if="job.type === 'zadig-deploy'">
              <el-form-item prop="productName" :label="$t(`project.environments`)" v-if="!(job.spec.env.includes('fixed')||job.spec.env.includes('{{'))">
                <el-select v-model="job.spec.env" size="small" @change="getRegistryId(job.spec.env)" style="width: 220px;">
                  <el-option
                    v-for="pro of currentProjectEnvs"
                    :key="`${pro.projectName} / ${pro.name}`"
                    :label="`${pro.projectName} / ${pro.name}`"
                    :value="`${pro.name}`"
                  >
                    <span>{{`${pro.projectName} / ${pro.name}`}}</span>
                  </el-option>
                </el-select>
                <el-tooltip v-if="specificEnv" effect="dark" content="该工作流已指定环境运行，可通过修改 工作流->基本信息 来解除指定环境绑定" placement="top">
                  <span>
                    <i style="color: #909399;" class="el-icon-question"></i>
                  </span>
                </el-tooltip>
              </el-form-item>
              <el-form-item :label="$t(`globel.serviceModule`)" v-if="job.spec.source === 'runtime'">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="value"
                  size="small"
                  style="width: 220px;"
                  @change="handleServiceDeployChange"
                >
                  <el-option
                    v-for="(service,index) of job.spec.service_and_images"
                    :key="index"
                    :label="service.service_name"
                    :value="service"
                  >
                    <span>{{service.service_module}}</span>
                    <span style="color: #ccc;">({{service.service_name}})</span>
                  </el-option>
                </el-select>
              </el-form-item>
              <div v-for="(item,index) in job.pickedTargets" :key="index">
                <el-form-item :label="`${item.service_name}`">
                  <el-select
                    v-model="item.image"
                    filterable
                    clearable
                    reserve-keyword
                    value-key="value"
                    size="small"
                    style="width: 220px;"
                    placeholder="请选择镜像"
                  >
                    <el-option
                      v-for="(image,index) of item.images"
                      :key="index"
                      :value="image.host+'/'+image.owner+'/'+image.name+':'+image.tag"
                      :label="image.tag"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </div>
            </div>
            <div v-if="job.type === 'custom-deploy'">
              <el-form-item :label="$t(`workflow.selectContainer`)" v-if="job.spec.source === 'runtime'">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="target"
                  size="medium"
                  style="width: 220px;"
                  @change="handleContainerChange($event,job)"
                >
                  <el-option v-for="(item,index) of job.spec.targets" :key="index" :label="item.target" :value="item"></el-option>
                </el-select>
              </el-form-item>
              <div v-for="(item,index) in job.pickedTargets" :key="index">
                <el-form-item :label="item.service">
                  <el-select
                    v-model="item.image"
                    filterable
                    clearable
                    @change="handleCurImageChange"
                    reserve-keyword
                    size="medium"
                    style="width: 220px;"
                    placeholder="请选择镜像"
                  >
                    <el-option
                      v-for="(image,index) of item.images"
                      :key="index"
                      :value="image.host+'/'+image.owner+'/'+image.name+':'+image.tag"
                      :label="image.tag"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </div>
            </div>
            <div v-if="job.type === 'k8s-resource-patch'">
              <el-form-item :label="$t(`workflow.resourceName`)">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="resource_name"
                  size="medium"
                  style="width: 220px;"
                  @change="handleResourceChange($event,job)"
                >
                  <el-option
                    v-for="(item,index) of job.spec.patch_items"
                    :key="index"
                    :label="`${item.resource_kind}/${item.resource_name}`"
                    :value="item"
                  ></el-option>
                </el-select>
              </el-form-item>
              <el-form-item :label="$t(`workflow.updateContent`)">
                <div v-for="(item,index) in job.pickedTargets" :key="index">
                  <span>{{item.resource_name}}</span>
                  <el-table :data="item.params">
                    <el-table-column :label="$t(`global.key`)" prop="name"></el-table-column>
                    <el-table-column :label="$t(`global.value`)">
                      <template slot-scope="scope">
                        <el-select v-model="scope.row.value" v-if="scope.row.type === 'choice'" size="small" style="width: 220px;">
                          <el-option v-for="(item,index) in scope.row.choice_option" :key="index" :value="item" :label="item">{{item}}</el-option>
                        </el-select>
                        <el-input
                          v-if="scope.row.type === 'text'"
                          v-model="scope.row.value"
                          size="small"
                          type="textarea"
                          :rows="2"
                          style="width: 220px;"
                        ></el-input>
                        <el-input
                          v-if="scope.row.type === 'string'"
                          class="password"
                          v-model="scope.row.value"
                          size="small"
                          :type="scope.row.is_credential ? 'passsword' : ''"
                          :show-password="scope.row.is_credential ? true : false"
                          style="width: 220px;"
                        ></el-input>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-form-item>
            </div>
            <div v-if="job.type === 'k8s-gray-release'">
              <el-form-item :label="$t(`workflow.grayPercentage`)">{{job.spec.gray_scale}}</el-form-item>
              <el-form-item :label="$t(`workflow.selectContainer`)" v-if="!job.spec.from_job">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="value"
                  size="medium"
                  style="width: 220px;"
                  @change="handleContainerChange($event,job)"
                >
                  <el-option
                    v-for="(item,index) of job.spec.targets"
                    :key="index"
                    :label="`${item.container_name}/${item.workload_name}`"
                    :value="item"
                  ></el-option>
                </el-select>
              </el-form-item>
              <div v-for="(item,index) in job.pickedTargets" :key="index">
                <el-form-item :label="`${item.container_name}/${item.workload_name}`">
                  <el-select
                    v-model="item.image"
                    filterable
                    clearable
                    @change="handleCurImageChange"
                    reserve-keyword
                    size="medium"
                    style="width: 220px;"
                    placeholder="请选择镜像"
                  >
                    <el-option
                      v-for="(image,index) of item.images"
                      :key="index"
                      :value="image.host+'/'+image.owner+'/'+image.name+':'+image.tag"
                      :label="image.tag"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </div>
            </div>
            <div v-if="job.type === 'k8s-gray-rollback'">
              <el-form-item label="选择 Deployment">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  value-key="workload_name"
                  reserve-keyword
                  size="medium"
                  style="width: 220px;"
                  @change="handleContainerChange($event,job)"
                >
                  <el-option v-for="(item,index) of job.spec.targets" :key="index" :label="item.workload_name" :value="item"></el-option>
                </el-select>
              </el-form-item>
              <el-table :data="job.pickedTargets">
                <el-table-column label="Deployment  名称" prop="workload_name"></el-table-column>
                <el-table-column label="镜像名称" prop="origin_image"></el-table-column>
                <el-table-column label="副本数量" prop="origin_replica"></el-table-column>
              </el-table>
            </div>
            <div v-if="job.type === 'freestyle'">
              <CustomWorkflowCommonRows :job="job" />
            </div>
            <div v-if="job.type === 'plugin'">
              <CustomWorkflowCommonRows :job="job" type="plugin" />
            </div>
            <div v-if="job.type === 'zadig-test'">
              <div v-if="job.pickedTargets">
                <CustomWorkflowBuildRows :pickedTargets="job.pickedTargets" :elSelectWidth="'140px'" type="zadig-test" />
              </div>
            </div>
            <div v-if="job.type === 'zadig-scanning'">
              <div v-if="job.pickedTargets">
                <CustomWorkflowBuildRows :pickedTargets="job.pickedTargets" type="zadig-scanning" />
              </div>
            </div>
            <div v-if="job.type==='zadig-distribute-image'">
              <div v-if="job.spec.source === 'runtime'">
                <el-form-item :label="$t(`global.serviceModule`)">
                  <el-select
                    v-model="job.pickedTargets"
                    filterable
                    multiple
                    clearable
                    reserve-keyword
                    value-key="value"
                    size="medium"
                    style="width: 220px;"
                    @change="handleServiceDeployChange(job.pickedTargets)"
                  >
                    <el-option
                      v-for="(service,index) of job.spec.targets"
                      :key="index"
                      :label="`${service.service_module}(${service.service_name})`"
                      :value="service"
                    >
                      <span>{{service.service_module}}</span>
                      <span style="color: #ccc;">({{service.service_name}})</span>
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-table :data="job.pickedTargets">
                  <el-table-column :label="$t(`project.services`)">
                    <template slot-scope="scope">{{`${scope.row.service_module}(${scope.row.service_name})`}}</template>
                  </el-table-column>
                  <el-table-column label="原始镜像版本">
                    <template slot-scope="scope">
                      <el-select
                        v-model="scope.row.source_tag"
                        filterable
                        clearable
                        reserve-keyword
                        @change="handleSourceTagChange(scope.row)"
                        value-key="service_name"
                        size="small"
                        placeholder="请选择原始镜像版本"
                      >
                        <el-option v-for="(image,index) of scope.row.images" :key="index" :value="image.tag" :label="image.tag"></el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="目标镜像版本" width="240">
                    <template slot-scope="{row,$index}">
                      <div class="flex">
                        <el-input v-model="row.target_tag" placeholder="请输入目标镜像版本" size="small" class="input"></el-input>
                        <el-button v-if="$index===0" size="small" type="text" @click="applyAllImage(job.pickedTargets,row.target_tag)">应用全部</el-button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-else>
                <el-table :data="cloneWorkflow.fromJobInfo.pickedTargets">
                  <el-table-column :label="$t(`project.services`)">
                    <template slot-scope="scope">{{`${scope.row.service_module}(${scope.row.service_name})`}}</template>
                  </el-table-column>
                  <el-table-column label="原始镜像版本">
                    <span style="color: #909399; font-size: 12px; line-height: 33px;">来自前置构建任务</span>
                  </el-table-column>
                  <el-table-column label="修改版本">
                    <template slot-scope="scope">
                      <el-switch v-model="scope.row.update_tag"></el-switch>
                    </template>
                  </el-table-column>
                  <el-table-column label="目标镜像版本" width="240">
                    <template slot-scope="scope">
                      <div v-if="scope.row.update_tag" class="flex">
                        <el-input v-model="scope.row.target_tag" placeholder="请输入目标镜像版本" size="small" class="input"></el-input>
                        <el-button
                          size="small"
                          type="text"
                          @click="applyAllImage(cloneWorkflow.fromJobInfo.pickedTargets,scope.row.target_tag)"
                        >应用全部</el-button>
                      </div>
                      <span v-else>
                        <span style="color: #909399; font-size: 12px; line-height: 33px;">来自前置构建任务</span>
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-collapse-item>
        </div>
      </el-collapse>
    </el-form>
  </div>
</template>

<script>
import CustomWorkflowBuildRows from '@/components/common/customWorkflowBuildRows.vue'
import CustomWorkflowCommonRows from '@/components/common/customWorkflowCommonRows.vue'
import {
  listProductAPI,
  getAllBranchInfoAPI,
  imagesAPI,
  getRegistryWhenBuildAPI,
  getAssociatedBuildsAPI
} from '@api'
import { keyBy, orderBy, cloneDeep } from 'lodash'

export default {
  data () {
    return {
      registry_id: '',
      currentProjectEnvs: [],
      dockerList: [],
      specificEnv: true,
      startTaskLoading: false,
      activeName: '00',
      payload: {
        workflow_name: '',
        stages: [
          {
            name: '',
            jobs: []
          }
        ]
      },
      originServiceAndBuilds: []
    }
  },
  props: {
    workflowName: {
      type: String,
      required: true,
      default: ''
    },
    projectName: {
      type: String,
      required: true,
      default: ''
    },
    cloneWorkflow: {
      type: Object,
      required: true,
      default: () => ({})
    },
    webhookSelectedRepo: {
      type: Object,
      default: () => ({})
    }
  },
  components: {
    CustomWorkflowBuildRows,
    CustomWorkflowCommonRows
  },
  created () {
    this.init()
  },
  methods: {
    init () {
      this.getEnvList()
      this.getRegistryWhenBuild()
      this.getServiceAndBuildList()
      if (Object.keys(this.cloneWorkflow).length > 0) {
        this.cloneWorkflow.stages.forEach(stage => {
          stage.jobs.forEach(job => {
            if (
              job.spec.service_and_builds &&
              job.spec.service_and_builds.length > 0
            ) {
              job.pickedTargets = job.spec.service_and_builds
              job.pickedTargets.forEach(build => {
                this.getRepoInfo(build.repos)
                build.repos.forEach(repo => {
                  if (
                    repo.codehost_id === this.webhookSelectedRepo.codehost_id &&
                    repo.repo_name === this.webhookSelectedRepo.repo_name &&
                    repo.repo_owner === this.webhookSelectedRepo.repo_owner
                  ) {
                    this.$set(repo, 'showTip', true)
                  }
                })
              })
            }
            if (job.type === 'zadig-deploy') {
              // Mapping for value-key
              if (
                job.spec &&
                job.spec.service_and_images &&
                job.spec.service_and_images.length > 0
              ) {
                job.spec.service_and_images.forEach(service => {
                  service.value = `${service.service_name}/${service.service_module}`
                })
              }
            }
          })
        })
        this.$set(this, 'payload', this.cloneWorkflow)
        this.handleEnv()
      }
    },
    handleEnv () {
      this.payload.params.forEach(item => {
        if (item.value.includes('fixed') || item.value.includes('{{')) {
          item.isShow = false
        } else {
          item.isShow = true
        }
      })
      this.payload.stages.forEach(stage => {
        stage.jobs.forEach(job => {
          if (job.spec && job.spec.service_and_builds) {
            this.cloneWorkflow.fromJobInfo = cloneDeep(job)
            job.spec.service_and_builds.forEach(service => {
              service.key_vals.forEach(item => {
                if (item.value.includes('fixed') || item.value.includes('{{')) {
                  item.isShow = false
                } else {
                  item.isShow = true
                }
              })
              service.value = `${service.service_name}/${service.service_module}`
              service.key_vals.forEach(key => {
                // if (key.is_credential) {
                //   key.value = this.$utils.aesDecrypt(key.value)
                // }
              })
            })
          }
          if (job.type === 'zadig-deploy' && job.spec.source === 'runtime') {
            job.pickedTargets = job.spec.service_and_images
            this.handleServiceDeployChange(job.pickedTargets)
            setTimeout(() => {
              job.spec.service_and_images = this.originServiceAndBuilds
            }, 1000)
          }
          if (job.type === 'custom-deploy') {
            job.spec.targets.forEach(item => {
              item.service = item.target.split('/')[2]
            })
            job.pickedTargets = job.spec.targets
            this.handleContainerChange(job.pickedTargets, job)
          }
          if (job.type === 'freestyle') {
            job.spec.steps.forEach(step => {
              if (step.type === 'git') {
                this.getRepoInfo(step.spec.repos)
              }
            })
            job.spec.properties.envs.forEach(item => {
              if (item.value.includes('fixed') || item.value.includes('{{')) {
                item.isShow = false
              } else {
                item.isShow = true
              }
            })
            // 判断是否展示(固定值和全局变量不展示)一个都没有的话则不展示表头
            const len = job.spec.properties.envs.filter(item => item.isShow)
            job.isShowCommon = len.length !== 0
          }
          if (job.type === 'plugin') {
            job.spec.plugin.inputs.forEach(item => {
              if (item.value.includes('fixed') || item.value.includes('{{')) {
                item.isShow = false
              } else {
                item.isShow = true
              }
            })
            const len = job.spec.plugin.inputs.filter(item => item.isShow)
            job.isShowPlugin = len.length !== 0
          }
          if (job.type === 'zadig-test') {
            job.pickedTargets = job.spec.test_modules
            job.spec.test_modules.forEach(service => {
              this.getRepoInfo(service.repos)
              service.key_vals.forEach(item => {
                if (
                  item.value.includes('<+fixed>') ||
                  item.value.includes('{{')
                ) {
                  item.isShow = false
                } else {
                  item.isShow = true
                }
              })
            })
          }
          if (job.type === 'zadig-scanning') {
            job.pickedTargets = job.spec.scannings
            job.spec.scannings.forEach(service => {
              this.getRepoInfo(service.repos)
            })
          }
          if (job.type === 'zadig-distribute-image') {
            if (job.spec.source === 'runtime') {
              job.spec.targets.forEach(service => {
                service.value = `${service.service_name}/${service.service_module}`
              })
              this.registry_id = job.spec.source_registry_id
            } else {
              this.cloneWorkflow.fromJobInfo.pickedTargets = job.spec.targets
            }
          }
        })
      })
    },
    getEnvList () {
      const projectName = this.projectName
      listProductAPI(projectName).then(res => {
        // Sort by environment type first, then by name
        this.currentProjectEnvs = orderBy(
          res,
          ['production', 'name'],
          ['asc', 'asc']
        )
      })
    },
    getRegistryWhenBuild () {
      const projectName = this.projectName
      getRegistryWhenBuildAPI(projectName).then(res => {
        this.dockerList = res
      })
    },
    async getRepoInfo (originRepos) {
      const reposQuery = originRepos.map(re => {
        return {
          source: re.source,
          repo_owner: re.repo_owner,
          repo: re.repo_name,
          default_branch: re.branch,
          codehost_id: re.codehost_id,
          repo_namespace: re.repo_namespace,
          filter_regexp: re.filter_regexp
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

      const repoInfoMap = keyBy(res, repo => {
        return `${repo.repo_owner}/${repo.repo}`
      })
      for (const repo of originRepos) {
        this.$set(repo, '_id_', `${repo.repo_owner}/${repo.repo_name}`)
        const repoInfo = repoInfoMap[repo._id_]
        this.$set(repo, 'branchNames', repoInfo && repoInfo.branchNames)
        this.$set(repo, 'branchPRsMap', repoInfo && repoInfo.branchPRsMap)
        this.$set(repo, 'tags', repoInfo && repoInfo.tags ? repoInfo.tags : [])
        this.$set(repo, 'prNumberPropName', 'pr')
        if (repoInfo) {
          this.$set(repo, 'errorMsg', repoInfo.error_msg || '')
        }
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
    },
    getRegistryId (val) {
      const namespace = val.split('/')[1].trim()
      const res = this.currentProjectEnvs.find(item => {
        return item.name === namespace
      })
      this.registry_id = res.registry_id
    },
    getRegistryList (name, id, item) {
      return imagesAPI(name, id).then(res => {
        return res
      })
    },
    handleServiceDeployChange (val) {
      val.forEach(item => {
        this.getRegistryList([item.service_module], this.registry_id).then(
          res => {
            this.$set(item, 'images', res)
          }
        )
      })
    },
    handleServiceBuildChange (services, job) {
      this.cloneWorkflow.fromJobInfo = cloneDeep(job)
      services.forEach(service => {
        this.getRepoInfo(service.repos)
        service.repos.forEach(repo => {
          if (
            repo.codehost_id === this.webhookSelectedRepo.codehost_id &&
            repo.repo_name === this.webhookSelectedRepo.repo_name &&
            repo.repo_owner === this.webhookSelectedRepo.repo_owner
          ) {
            this.$set(repo, 'showTip', true)
          }
        })
      })
      this.$forceUpdate()
    },
    getServiceAndBuildList () {
      const projectName = this.projectName
      getAssociatedBuildsAPI(projectName, true).then(res => {
        res.forEach(item => {
          item.value = `${item.service_name}/${item.service_module}`
        })
        this.originServiceAndBuilds = res
      })
    },
    handleContainerChange (val, job) {
      val.forEach(item => {
        this.getRegistryList([item.service || item.container_name], job.spec.docker_registry_id).then(
          res => {
            this.$set(item, 'images', res)
            this.$forceUpdate()
          }
        )
      })
    },
    handleImageChange (job) {
      this.handleContainerChange(job.pickedTargets, job)
    },
    handleCurImageChange () {
      this.$forceUpdate()
    },
    applyAllImage (allTags, curTag) {
      allTags.forEach(item => {
        this.$set(item, 'target_tag', curTag)
      })
    },
    handleSourceTagChange (row) {
      if (!row.target_tag) {
        this.$set(row, 'target_tag', row.source_tag)
      }
    }
  },
  watch: {
    webhookSelectedRepo: {
      handler (val) {
        if (val) {
          if (this.payload.stages) {
            this.payload.stages.forEach(stage => {
              if (stage.jobs) {
                stage.jobs.forEach(job => {
                  if (
                    job.type === 'zadig-build' &&
                    job.pickedTargets &&
                    job.pickedTargets.length > 0
                  ) {
                    job.pickedTargets.forEach(build => {
                      if (build.repos) {
                        build.repos.forEach(repo => {
                          if (
                            repo.codehost_id === val.codehost_id &&
                            repo.repo_name === val.repo_name &&
                            repo.repo_owner === val.repo_owner
                          ) {
                            this.$set(repo, 'showTip', true)
                          } else {
                            this.$set(repo, 'showTip', false)
                          }
                        })
                      }
                    })
                  }
                  if (job.type === 'freestyle') {
                    if (
                      job.spec &&
                      job.spec.steps &&
                      job.spec.steps.length > 0
                    ) {
                      job.spec.steps.forEach(step => {
                        if (step.type === 'git') {
                          if (step.spec.repos && step.spec.repos.length > 0) {
                            step.spec.repos.forEach(repo => {
                              if (
                                repo.codehost_id === val.codehost_id &&
                                repo.repo_name === val.repo_name &&
                                repo.repo_owner === val.repo_owner
                              ) {
                                this.$set(repo, 'showTip', true)
                              } else {
                                this.$set(repo, 'showTip', false)
                              }
                            })
                          }
                        }
                      })
                    }
                  }
                })
              }
            })
          }
        }
      },
      immediate: false,
      deep: true
    },
    cloneWorkflow (val) {
      if (val) {
        this.init()
      }
    }
  },
  computed: {
    isShowParams () {
      // if (this.payload.params) {
      //   const len = this.payload.params.filter(item => item.isShow)
      //   return len.length === 0
      //     ? false
      //     : len.length !== this.payload.params.length
      // } else {
      //   return false
      // }
      return true
    }
  }
}
</script>
<style lang="less" scoped>
.custom-workflow {
  .flex {
    display: flex;
    justify-content: space-between;

    .input {
      width: 160px;
    }
  }
}
</style>
