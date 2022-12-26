<template>
  <div class="service-repo-select">
    <span class="primary-title">选择服务和代码信息</span>
    <span v-if="hasPlutus" class="multi-import" @click="openMultiImport">
      <i class="el-icon-sort"></i> 批量录入
    </span>
    <el-dialog
      title="批量录入"
      :visible.sync="showMultiImport"
      width="65%"
      custom-class="multi-import-repo-dialog"
      :close-on-click-modal="false"
    >
      <div class="input-tip">
        <ul>
          <li>- 格式：服务组件(服务),代码源标识,带分支信息的代码库 URL</li>
          <li>- 例如：aslan(zadig),koderover,https://github.com/koderover/zadig/tree/main</li>
          <li>- 请确保代码库信息 URL 在 Zadig 中已经成功集成</li>
          <li>- 请确保一行一条数据</li>
          <li>- 支持 GitHub、GitLab、Gitee</li>
        </ul>
      </div>
      <div class="editor">
        <el-input
          type="textarea"
          :autosize="{ minRows: 10}"
          placeholder="例如：aslan(zadig),koderover,https://github.com/koderover/zadig/tree/main"
          v-model="multiImportTxt"
        ></el-input>
        <span v-if="parseErr" class="error-msg">{{parseErr}}</span>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="showMultiImport = false">{{$t(`global.cancel`)}}</el-button>
        <el-button size="small" type="primary" @click="parseMultiImport">{{$t(`global.confirm`)}}</el-button>
      </span>
    </el-dialog>
    <template v-if="targets.length > 0">
      <div v-for="(target,targetIndex) in targets" :key="targetIndex" class="service-repo-container">
        <div class="operation">
          <span class="el-icon-delete delete" @click="deleteService(targetIndex)"></span>
        </div>
        <el-form
          :ref="`buildRepo-${targetIndex}`"
          :inline="true"
          :model="target"
          class="form-style"
          label-position="top"
          label-width="80px"
        >
          <div>
            <el-select v-model="target.service" size="small" value-key="key" filterable>
              <el-option
                v-for="(service,index) in serviceTargets"
                :key="index"
                :label="`${service.service_module}(${service.service_name})`"
                :value="service"
              ></el-option>
            </el-select>
          </div>
          <el-button
            v-if="target.repos.length === 0"
            style="margin-top: 10px;"
            size="mini"
            @click="addFirstRepo(targetIndex)"
            type="text"
            plain
          >添加代码库</el-button>
          <div v-if="showDivider" class="divider item"></div>
          <div v-for="(repo,repoIndex) in target.repos" :key="repoIndex">
            <el-row class="repo-select">
              <el-col :span="showAdvanced || showTrigger ?4:5">
                <el-form-item
                  :label="repoIndex === 0 ? (shortDescription?'平台':'代码源') : ''"
                  :prop="'repos.' + repoIndex + '.codehost_id'"
                  :rules="{required: true, message: '平台不能为空', trigger: ['blur', 'change']}"
                >
                  <el-select
                    v-model="target.repos[repoIndex].codehost_id"
                    size="small"
                    placeholder="请选择代码源"
                    @change="getRepoOwnerById(targetIndex,repoIndex,target.repos[repoIndex].codehost_id,'',repo)"
                    filterable
                  >
                    <el-option
                      v-for="(host,index) in allCodeHosts"
                      :key="index"
                      :label="`${host.address}${host.alias?'('+host.alias+')':''}`"
                      :value="host.id"
                    >{{`${host.address}${host.alias?'('+host.alias+')':''}`}}</el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="showAdvanced || showTrigger ?4:5">
                <el-form-item
                  :label="repoIndex === 0 ?'组织名/用户名' : ''"
                  :prop="'repos.' + repoIndex + '.repo_owner'"
                  :rules="{required: true, message: '组织名/用户名不能为空', trigger: ['blur', 'change']}"
                >
                  <el-input
                    v-if="repo.source==='other'"
                    v-model.trim="target.repos[repoIndex]['repo_owner']"
                    placeholder="请输入"
                    size="small"
                  ></el-input>
                  <el-select
                    v-else
                    @change="getRepoNameById(targetIndex,repoIndex,target.repos[repoIndex].codehost_id,target.repos[repoIndex]['repo_owner'])"
                    v-model.trim="target.repos[repoIndex]['repo_owner']"
                    remote
                    :remote-method="(query)=>{searchNamespace(targetIndex,repoIndex,query)}"
                    @clear="searchNamespace(targetIndex,repoIndex,'')"
                    loading-text="加载中，支持手动创建"
                    allow-create
                    clearable
                    size="small"
                    placeholder="组织名/用户名"
                    :loading="codeInfo[targetIndex][repoIndex].loading.owner"
                    filterable
                  >
                    <el-option
                      v-for="(repo_owner,index) in codeInfo[targetIndex][repoIndex] ? codeInfo[targetIndex][repoIndex]['repo_owners'] : []"
                      :key="index"
                      :label="repo_owner.path"
                      :value="repo_owner.path"
                    >
                      <span>{{repo_owner.path}}</span>
                      <template v-if="repo.source === 'gitee-enterprise'">
                        <span v-if="repo_owner.kind==='enterprise'">(企业)</span>
                        <span v-else-if="repo_owner.kind==='org'">(团队)</span>
                      </template>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="showAdvanced || showTrigger ?4:5">
                <el-form-item
                  :label="repoIndex === 0 ? (shortDescription?'名称':'代码库名称') : ''"
                  :prop="'repos.' + repoIndex + '.repo_name'"
                  :rules="{required: true, message: '名称不能为空', trigger: ['blur', 'change']}"
                >
                  <el-input v-if="repo.source==='other'" v-model.trim="target.repos[repoIndex]['repo_name']" placeholder="请输入" size="small"></el-input>
                  <el-select
                    v-else
                    @change="getBranchInfoById(targetIndex,repoIndex,target.repos[repoIndex].codehost_id,target.repos[repoIndex].repo_owner,target.repos[repoIndex].repo_name,'',repo)"
                    v-model.trim="target.repos[repoIndex].repo_name"
                    remote
                    :remote-method="(query)=>{searchProject(targetIndex,repoIndex,query)}"
                    @clear="searchProject(targetIndex,repoIndex,'')"
                    loading-text="加载中，支持手动创建"
                    allow-create
                    clearable
                    size="small"
                    placeholder="请选择代码库"
                    :loading="codeInfo[targetIndex][repoIndex].loading.repo"
                    filterable
                  >
                    <el-option
                      v-for="(repo,index) in codeInfo[targetIndex][repoIndex] ? codeInfo[targetIndex][repoIndex]['repos'] : []"
                      :key="index"
                      :label="repo.name"
                      :value="repo.name"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="showAdvanced || showTrigger ?4:5 ">
                <el-form-item
                  :label="repoIndex === 0 ? (shortDescription?'分支':'默认分支') : ''"
                  :prop="'repos.' + repoIndex + '.branch'"
                  :rules="{required: true, message: '分支不能为空', trigger: ['blur', 'change']}"
                >
                  <el-input v-if="repo.source==='other'" v-model.trim="target.repos[repoIndex]['branch']" placeholder="请输入" size="small"></el-input>
                  <el-select
                    v-else
                    v-model.trim="target.repos[repoIndex].branch"
                    placeholder="请选择"
                    size="small"
                    loading-text="加载中，支持手动创建"
                    filterable
                    remote
                    :remote-method="(query)=>{searchBranch(targetIndex,repoIndex,query,repo)}"
                    @clear="searchBranch(targetIndex,repoIndex,'',repo)"
                    allow-create
                    :loading="codeInfo[targetIndex][repoIndex].loading.branch"
                    clearable
                  >
                    <el-option
                      v-for="(branch,branch_index) in codeInfo[targetIndex][repoIndex] ? codeInfo[targetIndex][repoIndex]['branches'] : []"
                      :key="branch_index"
                      :label="branch.name"
                      :value="branch.name"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col v-if="showAdvanced" :span="3">
                <el-form-item :label="repoIndex === 0 ? '高级':''">
                  <div class="app-operation">
                    <el-button
                      type="primary"
                      size="mini"
                      round
                      plain
                      v-if="!showAdvancedSetting[repoIndex]"
                      @click="$set(showAdvancedSetting,repoIndex,true)"
                    >
                      {{$t('global.expand')}}
                      <i class="el-icon-arrow-down" />
                    </el-button>
                    <el-button
                      type="primary"
                      size="mini"
                      round
                      plain
                      v-if="showAdvancedSetting[repoIndex]"
                      @click="$set(showAdvancedSetting,repoIndex,false)"
                    >
                      {{$t('global.collapse')}}
                      <i class="el-icon-arrow-up" />
                    </el-button>
                  </div>
                </el-form-item>
              </el-col>
              <el-col v-if="showTrigger" :span="3">
                <el-form-item :label="repoIndex === 0 ? '启用触发器': ''">
                  <span slot="label">
                    <span>启用触发器</span>
                    <el-tooltip effect="dark" content="代码仓库的 Git Pull Request 以及 Git Push 事件会触发工作流执行，可以在后续的配置中进行修改" placement="top">
                      <i class="pointer el-icon-question"></i>
                    </el-tooltip>
                  </span>
                  <el-switch v-model="target.repos[repoIndex].enableTrigger"></el-switch>
                </el-form-item>
              </el-col>
              <el-col v-if="!showJustOne" :span="showAdvanced || showTrigger ?5:4 ">
                <el-form-item :label="repoIndex === 0 ? '操作':''">
                  <div class="app-operation">
                    <el-button
                      v-if="target.repos.length >= 1"
                      @click="deleteBuildRepo(targetIndex,repoIndex)"
                      type="danger"
                      size="small"
                      icon="el-icon-minus"
                      plain
                      circle
                    ></el-button>
                    <el-button
                      v-if="repoIndex===target.repos.length-1"
                      @click="addBuildRepo(targetIndex,repoIndex)"
                      type="primary"
                      icon="el-icon-plus"
                      size="small"
                      plain
                      circle
                    ></el-button>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row
              v-if="showAdvancedSetting[repoIndex]"
              style="padding: 4px; background-color: rgb(246, 246, 246, 0.5); border-radius: 6px;"
            >
              <el-col :span="showAdvanced || showTrigger ?4:5 ">
                <el-form-item label="Remote name">
                  <el-input v-model="repo.remote_name" size="small" placeholder="请输入"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="showAdvanced || showTrigger ?4:5 ">
                <el-form-item label="克隆目录名">
                  <el-input v-model="repo.checkout_path" size="small" placeholder="请输入"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4" style="margin-left: 4px;">
                <el-form-item label="子模块">
                  <el-switch v-model="repo.submodules"></el-switch>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-form>
        <div v-if="target.envs && target.envs.length" class="build-env-var">
          <div class="primary-title">
            变量
            <i
              :class="[target.showVars ? 'el-icon-arrow-up' : 'el-icon-arrow-down']"
              class="icon"
              @click="target.showVars = !target.showVars"
            ></i>
          </div>
          <div v-show="target.showVars">
            <el-row v-for="(env, index) in target.envs" :key="index" :gutter="10" class="var-content">
              <el-col :span="mini ? 6 : 4">
                <el-select v-model="env.type" size="small" disabled>
                  <el-option label="字符串" value="string"></el-option>
                  <el-option label="枚举" value="choice"></el-option>
                </el-select>
              </el-col>
              <el-col :span="mini ? 6 : 4">
                <el-input v-model="env.key" size="small" disabled></el-input>
              </el-col>
              <el-col :span="mini ? 6 : 4">
                <el-select v-if="env.type==='choice'" v-model="env.value" placeholder="默认值" size="small">
                  <el-option v-for="option in env.choice_option" :key="option" :label="option" :value="option"></el-option>
                </el-select>
                <el-input v-else :placeholder="$t(`global.value`)" v-model="env.value" size="small"></el-input>
              </el-col>
              <el-col :span="mini ? 6 : 4" v-show="env.type!=='choice'" style="line-height: 32px;">
                <el-checkbox v-model="env.is_credential">
                  敏感信息
                  <el-tooltip effect="dark" content="设置为敏感信息变量后，系统会将变量进行加密，使用时进行解密，同时在工作流运行日志里不可见" placement="top">
                    <i class="el-icon-question"></i>
                  </el-tooltip>
                </el-checkbox>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
    </template>
    <span class="el-icon-circle-plus-outline add-service-repo" @click="addService"></span>
  </div>
</template>

<script type="text/javascript">
import {
  getCodeSourceMaskedAPI,
  getRepoOwnerByIdAPI,
  getRepoNameByIdAPI,
  getBranchInfoByIdAPI
} from '@api'
import { mapState } from 'vuex'
import { orderBy, cloneDeep, drop, dropRight } from 'lodash'
export default {
  data () {
    return {
      allCodeHosts: [],
      codeInfo: [
        [{ repo_owners: '', loading: '', branch: '' }],
        [{ repo_owners: '', loading: '', branch: '' }]
      ],
      showAdvancedSetting: {},
      validateName: 'repoSelect',
      showMultiImport: false,
      multiImportTxt: '',
      parseErr: '',
      loading: {
        owner: false,
        repo: false,
        branch: false
      },
      codeInfoRepoOwnerCache: {

      }
    }
  },
  props: {
    serviceTargets: {
      required: true,
      type: Array,
      default: () => []
    },
    targets: {
      required: true,
      type: Array
    },
    currentTemplateEnvs: {
      required: true,
      type: Array
    },
    showDivider: {
      required: false,
      type: Boolean,
      default: false
    },
    isCreate: {
      required: false,
      type: Boolean,
      default: true
    },
    mini: {
      default: false,
      type: Boolean
    },
    showAdvanced: {
      required: false,
      type: Boolean,
      default: true
    },
    title: {
      required: false,
      type: String,
      default: '代码信息'
    },
    addBtnMini: {
      required: false,
      type: Boolean,
      default: false
    },
    shortDescription: {
      required: false,
      type: Boolean,
      default: false
    },
    showFirstLine: {
      required: false,
      type: Boolean,
      default: false
    },
    validObj: {
      required: false,
      type: Object,
      default: null
    },
    showTrigger: {
      required: false,
      type: Boolean,
      default: false
    },
    showJustOne: {
      required: false,
      type: Boolean,
      default: false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    })
  },
  methods: {
    addService () {
      if (this.targets.length === 0) {
        this.targets.push({
          service: {},
          repos: [],
          envs: cloneDeep(this.currentTemplateEnvs),
          showVars: false
        })
        this.addFirstRepo(this.targets.length - 1)
      } else {
        this.validateForm(this.targets.length - 1).then(res => {
          this.targets.push({
            service: {},
            repos: [],
            envs: cloneDeep(this.currentTemplateEnvs),
            showVars: false
          })
          this.addFirstRepo(this.targets.length - 1)
        })
      }
    },
    deleteService (index) {
      this.targets.splice(index, 1)
    },
    setLoadingState (targetIndex, repoIndex, loading, isLoading) {
      if (this.codeInfo[targetIndex][repoIndex]) {
        this.codeInfo[targetIndex][repoIndex].loading[loading] = isLoading
      }
    },
    validateForm (targetIndex = this.targets.length - 1) {
      const refName = `buildRepo-${targetIndex}`
      return new Promise((resolve, reject) => {
        this.$nextTick(() => {
          if (this.$refs[`${refName}`]) {
            this.$refs[`${refName}`][0].validate(valid => {
              if (valid) {
                resolve(true)
              } else {
                reject(false)
              }
            })
          } else {
            resolve(true)
          }
        })
      })
    },
    addBuildRepo (targetIndex, repoIndex) {
      const repoMeta = {
        codehost_id: null,
        repo_owner: '',
        repo_name: '',
        branch: '',
        checkout_path: '',
        remote_name: 'origin',
        submodules: false
      }
      this.showTrigger && (repoMeta.enableTrigger = false)
      this.validateForm(targetIndex)
        .then(res => {
          this.targets[targetIndex].repos.push(repoMeta)
          this.$set(this.codeInfo[targetIndex], repoIndex + 1, {
            repo_owners: [],
            repos: [],
            branches: [],
            loading: this.$utils.cloneObj(this.loading)
          })
          if (this.allCodeHosts && this.allCodeHosts.length === 1) {
            const codeHostId = this.allCodeHosts[0].id
            const type = this.allCodeHosts[0].type
            repoMeta.codehost_id = codeHostId
            if (type && type === 'other') {
              const authType = this.allCodeHosts[0].auth_type
              repoMeta.type = type
              repoMeta.source = type
              repoMeta.auth_type = authType
            } else {
              this.getRepoOwnerById(targetIndex, repoIndex + 1, codeHostId)
            }
          }
        })
        .catch(err => {
          console.log(err)
        })
    },
    addFirstRepo (targetIndex) {
      const repoMeta = {
        codehost_id: null,
        repo_owner: '',
        repo_name: '',
        branch: '',
        checkout_path: '',
        remote_name: 'origin',
        submodules: false
      }
      this.showTrigger && (repoMeta.enableTrigger = false)
      this.$set(this.codeInfo, targetIndex, {})
      this.$set(this.codeInfo[targetIndex], 0, {
        repo_owners: [],
        repos: [],
        branches: [],
        loading: this.$utils.cloneObj(this.loading)
      })
      // if (this.allCodeHosts && this.allCodeHosts.length === 1) {
      //   const codeHostId = this.allCodeHosts[0].id
      //   repoMeta.codehost_id = codeHostId
      //   this.getRepoOwnerById(0, codeHostId)
      // }
      this.targets[targetIndex].repos.push(repoMeta)
    },
    deleteBuildRepo (targetIndex, repoIndex) {
      this.targets[targetIndex].repos.splice(repoIndex, 1)
    },
    searchNamespace (targetIndex, repoIndex, query) {
      const id = this.targets[targetIndex].repos[repoIndex].codehost_id
      const codehostType = this.allCodeHosts.find(item => {
        return item.id === id
      }).type
      if (
        (codehostType === 'github' || codehostType === 'gitee-enterprise') &&
        query !== ''
      ) {
        const items = this.$utils.filterObjectArrayByKey(
          'path',
          query,
          this.codeInfo[targetIndex][repoIndex].origin_repo_owners
        )
        this.$set(
          this.codeInfo[targetIndex][repoIndex],
          'repo_owners',
          items || []
        )
        if (this.allCodeHosts && this.allCodeHosts.length > 1) {
          this.targets[targetIndex].repos[repoIndex].repo_owner = ''
          this.targets[targetIndex].repos[repoIndex].repo_name = ''
          this.targets[targetIndex].repos[repoIndex].branch = ''
        }
      } else {
        this.getRepoOwnerById(targetIndex, repoIndex, id, query)
      }
    },
    getRepoNameById (targetIndex, repoIndex, id, repo_owner, key = '') {
      if (!repo_owner) {
        return
      }
      const item = this.codeInfo[targetIndex][repoIndex].repo_owners.find(
        item => {
          return item.path === repo_owner
        }
      )
      let type = 'group'
      if (item) {
        type = item.kind
      }
      if (repo_owner) {
        if (!key) {
          this.codeInfo[targetIndex][repoIndex].repos = []
          this.codeInfo[targetIndex][repoIndex].branches = []
        }
        this.setLoadingState(targetIndex, repoIndex, 'repo', true)
        getRepoNameByIdAPI(id, type, encodeURI(repo_owner), key).then(res => {
          this.$set(
            this.codeInfo[targetIndex][repoIndex],
            'repos',
            orderBy(res, ['name'])
          )
          this.$set(
            this.codeInfo[targetIndex][repoIndex],
            'origin_repos',
            orderBy(res, ['name'])
          )
          this.setLoadingState(targetIndex, repoIndex, 'repo', false)
        })
      }
      this.targets[targetIndex].repos[repoIndex].repo_name = ''
      this.targets[targetIndex].repos[repoIndex].branch = ''
    },
    getBranchInfoById (
      targetIndex,
      repoIndex,
      id,
      repo_owner,
      repo_name,
      key = '',
      repo
    ) {
      if (!repo_name) {
        return
      }
      const repoItem = this.codeInfo[targetIndex][repoIndex].repos.find(
        item => {
          return item.name === repo_name
        }
      )
      let repoId = ''
      let namespace = ''
      if (repoItem) {
        repoId = repoItem.repo_id
        namespace = repoItem.namespace
        repo.repo_namespace = namespace
      } else {
        // for manual input
        namespace = repo_owner
        repo.repo_namespace = namespace
      }
      if (repo_owner && repo_name) {
        this.codeInfo[targetIndex][repoIndex].branches = []
        this.setLoadingState(targetIndex, repoIndex, 'branch', true)
        getBranchInfoByIdAPI(id, namespace, repo_name, 1, 200, key).then(
          res => {
            this.$set(
              this.codeInfo[targetIndex][repoIndex],
              'branches',
              res || []
            )
            this.$set(
              this.codeInfo[targetIndex][repoIndex],
              'origin_branches',
              res || []
            )
            this.setLoadingState(targetIndex, repoIndex, 'branch', false)
          }
        )
      }
      this.$set(this.targets[targetIndex].repos[repoIndex], 'repo_id', repoId)
      this.targets[targetIndex].repos[repoIndex].branch = ''
    },
    getRepoOwnerById (targetIndex, repoIndex, id, key = '', row) {
      const res = this.allCodeHosts.find(item => {
        return item.id === id
      })
      if (row && res) {
        row.source = res.type
        row.auth_type = res.auth_type
      }
      if (!key) {
        if (this.codeInfo[targetIndex][repoIndex]) {
          this.codeInfo[targetIndex][repoIndex].repo_owners = []
          this.codeInfo[targetIndex][repoIndex].repos = []
          this.codeInfo[targetIndex][repoIndex].branches = []
        }
      }
      this.setLoadingState(targetIndex, repoIndex, 'owner', true)
      getRepoOwnerByIdAPI(id, key).then(res => {
        this.$set(
          this.codeInfo[targetIndex][repoIndex],
          'repo_owners',
          orderBy(res, ['name'])
        )
        this.$set(
          this.codeInfo[targetIndex][repoIndex],
          'origin_repo_owners',
          orderBy(res, ['name'])
        )
        this.setLoadingState(targetIndex, repoIndex, 'owner', false)
      })
      if (this.allCodeHosts && this.allCodeHosts.length > 1) {
        this.targets[targetIndex].repos[repoIndex].repo_owner = ''
        this.targets[targetIndex].repos[repoIndex].repo_name = ''
        this.targets[targetIndex].repos[repoIndex].branch = ''
      }
    },
    makeRepoOwnerCache (codehostId, repoOwners) {
      if (!this.codeInfoRepoOwnerCache[codehostId]) {
        this.$set(this.codeInfoRepoOwnerCache, codehostId, {
          repoOwners: repoOwners
        })
      }
    },
    async getInitRepoInfo (targets) {
      for (let targetIndex = 0; targetIndex < targets.length; targetIndex++) {
        const target = targets[targetIndex]
        this.$set(this.codeInfo, targetIndex, {})
        for (let repoIndex = 0; repoIndex < target.repos.length; repoIndex++) {
          const repo = target.repos[repoIndex]
          const codehostId = repo.codehost_id
          const repoOwner = repo.source === 'other' ? 'other' : repo.repo_owner
          const repoName = repo.source === 'other' ? 'other' : repo.repo_name
          this.$set(this.codeInfo[targetIndex], repoIndex, {
            repo_owners: [],
            repos: [],
            branches: [],
            loading: this.$utils.cloneObj(this.loading)
          })
          if (codehostId) {
            if (this.codeInfoRepoOwnerCache[codehostId] && this.codeInfoRepoOwnerCache[codehostId].repoOwners.length > 0) {
              this.$set(
                this.codeInfo[targetIndex][repoIndex],
                'repo_owners',
                orderBy(this.codeInfoRepoOwnerCache[codehostId].repoOwners, ['name'])
              )
              this.$set(
                this.codeInfo[targetIndex][repoIndex],
                'origin_repo_owners',
                orderBy(this.codeInfoRepoOwnerCache[codehostId].repoOwners, ['name'])
              )
            } else {
              const repoOwners = await getRepoOwnerByIdAPI(codehostId)
              if (repoOwners) {
                this.makeRepoOwnerCache(codehostId, repoOwners)
                this.$set(
                  this.codeInfo[targetIndex][repoIndex],
                  'repo_owners',
                  orderBy(repoOwners, ['name'])
                )
                this.$set(
                  this.codeInfo[targetIndex][repoIndex],
                  'origin_repo_owners',
                  orderBy(repoOwners, ['name'])
                )
              }
              const item = this.codeInfo[targetIndex][
                repoIndex
              ].repo_owners.find(item => {
                return item.path === repoOwner
              })
              const type = item ? item.kind : 'group'
              getRepoNameByIdAPI(
                codehostId,
                type,
                encodeURI(repoOwner),
                ''
              ).then(res => {
                this.$set(
                  this.codeInfo[targetIndex][repoIndex],
                  'repos',
                  orderBy(repoNames, ['name'])
                )
                this.$set(
                  this.codeInfo[targetIndex][repoIndex],
                  'origin_repos',
                  orderBy(repoNames, ['name'])
                )
              })
            }
            getBranchInfoByIdAPI(
              codehostId,
              repo.repo_namespace,
              repoName
            ).then(res => {
              this.$set(
                this.codeInfo[targetIndex][repoIndex],
                'branches',
                res || []
              )
              this.$set(
                this.codeInfo[targetIndex][repoIndex],
                'origin_branches',
                res || []
              )
            })
          }
        }
      }
    },
    searchProject (targetIndex, repoIndex, query) {
      const id = this.targets[targetIndex].repos[repoIndex].codehost_id
      const repo_owner = this.targets[targetIndex].repos[repoIndex].repo_owner
      const codehostType = this.allCodeHosts.find(item => {
        return item.id === id
      }).type
      if (codehostType === 'github') {
        const items = this.$utils.filterObjectArrayByKey(
          'name',
          query,
          this.codeInfo[targetIndex][repoIndex].origin_repos
        )
        this.$set(this.codeInfo[targetIndex][repoIndex], 'repos', items)
        this.targets[targetIndex].repos[repoIndex].repo_name = ''
        this.targets[targetIndex].repos[repoIndex].branch = ''
      } else {
        this.getRepoNameById(targetIndex, repoIndex, id, repo_owner, query)
      }
    },
    searchBranch (targetIndex, repoIndex, query, repo) {
      const id = this.targets[targetIndex].repos[repoIndex].codehost_id
      const repoOwner = this.targets[targetIndex].repos[repoIndex].repo_owner
      const repoName = this.targets[targetIndex].repos[repoIndex].repo_name
      const codehostType = this.allCodeHosts.find(item => {
        return item.id === id
      }).type
      if (codehostType === 'gitlab') {
        this.getBranchInfoById(
          targetIndex,
          repoIndex,
          id,
          repoOwner,
          repoName,
          query,
          repo
        )
      } else {
        const items = this.$utils.filterObjectArrayByKey(
          'name',
          query,
          this.codeInfo[targetIndex][repoIndex].origin_branches
        )
        this.$set(this.codeInfo[targetIndex][repoIndex], 'branches', items)
      }
    },
    openMultiImport () {
      this.multiImportTxt = ''
      this.parseErr = ''
      const prefixPaddings = []
      this.serviceTargets.forEach(element => {
        prefixPaddings.push(
          `${element.service_module}(${element.service_name}),代码源标识`
        )
      })
      this.multiImportTxt = prefixPaddings.join('\n')
      this.showMultiImport = true
    },
    parseRepo (providerAlias, repoStr) {
      try {
        let trimedRepoStr = ''
        const allCodeHosts = this.allCodeHosts
        if (repoStr.endsWith('/')) {
          trimedRepoStr = repoStr.slice(0, -1)
        } else {
          trimedRepoStr = repoStr
        }
        const URLObject = new URL(trimedRepoStr)
        const providerAddress = URLObject.origin
        const provider = allCodeHosts.find(item => {
          return (
            item.address === providerAddress && item.alias === providerAlias
          )
        })
        if (provider) {
          let repoName = ''
          let branch = ''
          let namespace = ''
          const type = provider.type
          if (type === 'github') {
            // /koderover/zadig/tree/main
            const splitBySlash = drop(URLObject.pathname.split('/'), 1)
            namespace = URLObject.pathname.split('/')[1]
            repoName = splitBySlash[1]
            branch = splitBySlash[splitBySlash.length - 1]
          } else if (type === 'gitee') {
            // /koderover/zadig/tree/main/
            const splitBySlash = drop(URLObject.pathname.split('/'), 1)
            namespace = URLObject.pathname.split('/')[1]
            repoName = splitBySlash[1]
            branch = splitBySlash[splitBySlash.length - 1]
          } else if (type === 'gitlab') {
            // /kr-test-org1/microservice-demo/-/tree/main
            // /kr-test-org1/subgroup-1/subgroup-2/subgroup-3/helloworld/-/tree/main
            const splitBySlash = URLObject.pathname.split('-/tree')
            // /kr-test-org1/microservice-demo/ + /main
            // /kr-test-org1/subgroup-1/subgroup-2/subgroup-3/helloworld/ + /main
            branch = splitBySlash[splitBySlash.length - 1].split('/')[1]
            // /kr-test-org1/microservice-demo/
            // /kr-test-org1/subgroup-1/subgroup-2/subgroup-3/helloworld/
            const repoOwnerAndRepoNameSplit = drop(
              dropRight(splitBySlash[0].split('/'), 1),
              1
            )
            if (repoOwnerAndRepoNameSplit.length > 2) {
              // subgroup
              repoName =
                repoOwnerAndRepoNameSplit[repoOwnerAndRepoNameSplit.length - 1]
              namespace = dropRight(repoOwnerAndRepoNameSplit).join('/')
            } else {
              namespace = URLObject.pathname.split('/')[1]
              repoName = repoOwnerAndRepoNameSplit[1]
            }
          } else if (type === 'gitee-enterprise') {
            // /enterprise/dashboard/programs/215/projects/enterprise/multiservice-demo/tree/feature-1
            const splitBySlash = drop(URLObject.pathname.split('/'), 1)
            branch = splitBySlash[splitBySlash.length - 1]
            repoName = splitBySlash[splitBySlash.length - 3]
            namespace = splitBySlash[splitBySlash.length - 4]
          }
          return {
            address: provider.address,
            branch: branch,
            codehost_id: provider.id,
            is_primary: false,
            remote_name: 'origin',
            repo_name: repoName,
            repo_namespace: namespace,
            repo_owner: namespace,
            source: provider.type
          }
        } else {
          this.parseErr = '代码源标识不匹配，请检查。如需 添加/修改 代码源，可前往：系统设置-代码源'
        }
      } catch (error) {
        console.log(error)
        throw new Error(error)
      }
    },
    parseReposInfo (reposStrArray) {
      const providerAlias = reposStrArray[0]
      reposStrArray = drop(reposStrArray).map(repoStr => {
        return this.parseRepo(providerAlias, repoStr)
      })
      return reposStrArray
    },
    parseServiceInfo (line) {
      const projectName = this.projectName
      const serviceWithModule = line.split(',')[0]
      const serviceModule = serviceWithModule.split('(')[0]
      const serviceName = serviceWithModule.split('(')[1].split(')')[0]
      return {
        key: `${serviceName}/${serviceModule}`,
        product_name: projectName,
        service_module: serviceModule,
        service_name: serviceName
      }
    },
    parseMultiImport () {
      const lines = this.multiImportTxt.split('\n')
      const targets = []
      this.parseErr = ''
      lines.every((line, index) => {
        if (line.split(',').length >= 3) {
          const service = this.parseServiceInfo(line)
          const reposStrArray = drop(line.split(','), 1)
          const repos = this.parseReposInfo(reposStrArray)
          if (repos[0] && service) {
            targets.push({
              repos: repos,
              service: service
            })
            this.getInitRepoInfo(targets)
            this.$emit('update:targets', targets)
            this.showMultiImport = false
            return true
          } else {
            return false
          }
        } else {
          this.parseErr = `格式错误解析失败，请检查第 ${index + 1} 行!`
          return false
        }
      })
    }
  },
  mounted () {
    const key = this.$utils.rsaEncrypt()
    getCodeSourceMaskedAPI(key).then(response => {
      this.allCodeHosts = response
    })
    if (!this.isCreate) {
      this.getInitRepoInfo(this.targets)
    }
  },
  watch: {
    targets: {
      handler (new_val) {
        if (new_val) {
          new_val.forEach(item => {
            item.repos.forEach(repo => {
              if (repo.source === 'other') {
                repo.repo_namespace = repo.repo_owner
              }
            })
          })
        }
      },
      deep: true
    }
  }
}
</script>

<style lang="less" scoped>
@labelColor: #000;
@labelWeight: 300;

.multi-import-repo-dialog {
  .el-dialog__body {
    padding: 10px 10px;
  }

  .input-tip {
    margin-bottom: 10px;
    padding: 6px;
    background: #f5f5f5;
    border-radius: 4px;
  }

  .error-msg {
    display: inline-block;
    margin-top: 6px;
    color: #ff1949;
    font-weight: 400;
    font-size: 12px;
  }
}

.service-repo-select {
  .multi-import {
    color: @themeColor;
    font-weight: 300;
    font-size: 14px;
    cursor: pointer;

    i {
      transform: rotate(90deg);
    }
  }

  .form-style {
    .item-title {
      display: inline-block;
      width: 117px;
      margin: 20px 0 10px;
      color: @labelColor;
      font-weight: @labelWeight;
      font-size: 14px;
      line-height: 22px;
    }
  }

  .divider {
    width: 100%;
    height: 1px;
    margin: 5px 0 15px 0;
    background-color: #dfe0e6;

    &.item {
      width: 30%;
    }
  }

  /deep/ .el-row.repo-select {
    .el-form-item__label {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .el-form-item__content {
      .el-input {
        .el-input__inner {
          padding-right: 50px;
        }
      }
    }

    .app-operation {
      white-space: nowrap;
    }
  }

  .add-service-repo {
    margin-top: 10px;
    color: @themeColor;
    cursor: pointer;
  }

  .service-repo-container {
    padding: 2px 10px 2px 10px;
    border: 1px solid #ebedf0;
    border-radius: 6px;

    .operation {
      text-align: right;

      .delete {
        color: #ff1949;
        cursor: pointer;
      }
    }

    &:not(:first-child) {
      margin-bottom: 5px;
    }

    .build-env-var {
      .primary-title {
        .icon {
          margin-left: 5px;
          cursor: pointer;
        }
      }

      .var-content {
        margin-bottom: 18px;
      }
    }
  }
}
</style>
