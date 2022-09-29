<template>
  <div class="git-repo-container" v-loading="loading" element-loading-spinner="*" element-loading-background="rgba(255, 255, 255, 0.2)">
    <div v-if="!controlParam.hiddenRepoSelect" class="repo-attr">
      <span>仓库属性</span>
      <el-radio-group v-model="gitName" :disabled="isUpdate">
        <el-radio label="private">私有库</el-radio>
        <el-radio label="public">公开库</el-radio>
      </el-radio-group>
    </div>
    <el-form v-if="gitName === 'private'" :model="source" :rules="sourceRules" ref="sourceForm" label-width="140px">
      <el-form-item
        label="代码源"
        prop="codehostId"
        :rules="{
              required: true,
              message: '代码源不能为空',
              trigger: 'change',
            }"
      >
        <el-select
          v-model="source.codehostId"
          size="small"
          style="width: 100%;"
          placeholder="请选择代码源"
          @change="queryRepoOwnerById(source.codehostId)"
          filterable
          :disabled="isUpdate"
        >
          <el-option
            v-for="(host, index) in allCodeHosts"
            :key="index"
            :label="host.address + '('+host.alias+')'"
            :value="host.id"
          >
            {{
           host.address + '('+host.alias+')'
            }}
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        label="组织名/用户名"
        prop="repoOwner"
        :rules="{
              required: true,
              message: '组织名/用户名不能为空',
              trigger: 'change',
            }"
      >
        <el-select
          v-model="source.repoOwner"
          size="small"
          style="width: 100%;"
          @change="getRepoNameById(source.codehostId, source.repoOwner)"
          placeholder="请选择组织名/用户名"
          filterable
          :disabled="isUpdate"
        >
          <el-option v-for="(repo, index) in codeInfo['repoOwners']" :key="index" :label="repo.path" :value="repo.path"></el-option>
        </el-select>
      </el-form-item>
      <template>
        <el-form-item
          label="名称"
          prop="repoName"
          :rules="{
                required: true,
                message: '名称不能为空',
                trigger: 'change',
              }"
        >
          <el-select
            @change="
                  getBranchInfoById(
                    source.codehostId,
                    source.repoOwner,
                    source.repoName
                  )
                "
            v-model.trim="source.repoName"
            remote
            :remote-method="searchProject"
            :loading="searchProjectLoading"
            style="width: 100%;"
            allow-create
            clearable
            size="small"
            placeholder="请选择代码库"
            filterable
            :disabled="isUpdate"
          >
            <el-option v-for="(repo, index) in codeInfo['repos']" :key="index" :label="repo.name" :value="repo.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          label="分支"
          prop="branchName"
          :rules="{
                required: true,
                message: '分支不能为空',
                trigger: 'change',
              }"
        >
          <el-select
            v-model.trim="source.branchName"
            placeholder="请选择分支"
            style="width: 100%;"
            size="small"
            filterable
            allow-create
            clearable
            :disabled="isUpdate"
          >
            <el-option v-for="(branch, branch_index) in codeInfo['branches']" :key="branch_index" :label="branch.name" :value="branch.name"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          label="选择文件夹："
          :rules="{
                required: true,
                message: '请选择目录',
                trigger: 'change',
              }"
        >
          <span :key="item" v-for="item in selectPath">[{{ item }}]&nbsp;</span>
          <el-button @click="openFileTree" :disabled="!showSelectFileBtn || isUpdate" type="primary" plain size="mini" icon="el-icon-plus" circle></el-button>
        </el-form-item>
      </template>
      <el-form-item v-if="!controlParam.hiddenCreateButton" style="text-align: right;">
        <el-button size="small" type="primary" :loading="loading" :disabled="selectPath.length === 0" @click="submit">加载</el-button>
      </el-form-item>
    </el-form>
    <el-form v-if="gitName === 'public'" :model="source" :rules="sourceRules" ref="sourceForm" label-width="140px">
      <el-form-item prop="url" label="仓库地址">
        <el-input v-model="source.url" placeholder="https://github.com/owner/repo" size="small" :disabled="isUpdate"></el-input>
      </el-form-item>
      <el-form-item prop="path" label="文件目录">
        <span :key="item" v-for="item in selectPath">[{{ item }}]&nbsp;</span>
        <el-button @click="openFileTree" :disabled="!source.url || isUpdate" type="primary" plain size="mini" icon="el-icon-plus" circle></el-button>
      </el-form-item>
      <el-form-item  style="text-align: right;">
        <el-button size="small" :loading="loading" type="primary" @click="submit">加载</el-button>
      </el-form-item>
    </el-form>

    <el-dialog v-if="codehostSource === 'gerrit' || codehostSource === 'gitee'" :append-to-body="true"
               :visible.sync="workSpaceModalVisible"
               width="60%"
               title="请选择要同步的文件或文件目录"
               class="fileTree-dialog">
      <GerritFileTree ref="worktree"
                    :codehostId="source.codehostId"
                    :repoName="source.repoName"
                    :repoUUID="source.repoUUID"
                    :repoOwner="source.repoOwner"
                    :branchName="source.branchName"
                    :remoteName="source.remoteName"
                    :namespace="source.namespace"
                    :gitType="codehostSource"
                    @getPreloadServices="getPreloadServices"
                    :showTree="workSpaceModalVisible"/>
    </el-dialog>
    <el-dialog v-else :append-to-body="true" :visible.sync="workSpaceModalVisible" width="60%" title="请选择要同步的文件目录" class="fileTree-dialog">
      <GitFileTree
        v-if="source.codehostId || source.url"
        :codehostId="source.codehostId"
        :codehostSource="codehostSource"
        :repoName="source.repoName"
        :repoOwner="source.repoOwner"
        :branchName="source.branchName"
        :remoteName="source.remoteName"
        :namespace="source.namespace"
        :showTree="workSpaceModalVisible"
        :type="gitName"
        :url="source.url"
        :changeSelectPath="changeSelectPath"
        :justSelectOne="controlParam.justSelectOneFile"
      />
    </el-dialog>

  </div>
</template>
<script>
import {
  getCodeSourceMaskedAPI,
  getRepoNameByIdAPI,
  getRepoOwnerByIdAPI,
  getBranchInfoByIdAPI,
  getRepoFilesAPI,
  createTemplateServiceAPI,
  updateTemplateServiceAPI
} from '@api'
import GitFileTree from './gitFileTree'
import GerritFileTree from '@/components/common/gitFileTree.vue'
export default {
  name: 'GitRepo',
  props: {
    currentSelect: {
      type: String,
      default: 'git'
    },
    currentService: Object,
    controlParam: {
      type: Object,
      default: () => {
        return {
          hiddenCreateButton: false,
          hiddenRepoSelect: false,
          justSelectOneFile: false
        }
      }
    }
  },
  components: {
    GitFileTree,
    GerritFileTree
  },
  data () {
    return {
      loading: false,
      gitName: 'private',
      codehostSource: '',
      allCodeHosts: [],
      searchProjectLoading: false,
      workSpaceModalVisible: false,
      selectPath: [],
      source: {
        codehostId: null,
        repoOwner: '',
        repoName: '',
        branchName: '',
        remoteName: '',
        gitType: '',
        services: [],
        path: '',
        isDir: false,
        url: null,
        namespace: ''
      },
      sourceRules: {
        url: [
          {
            required: true,
            message: '请输入 URL，包含协议',
            trigger: ['blur', 'change']
          }
        ]
      },
      codeInfo: {
        repoOwners: [],
        repos: [],
        branches: []
      },
      isUpdate: false
    }
  },
  methods: {
    closeSelectRepo () {
      this.source = {
        codehostId: null,
        repoOwner: '',
        repoName: '',
        branchName: '',
        remoteName: '',
        gitType: '',
        namespace: ''
      }
      this.selectPath = []
      this.$refs.sourceForm.resetFields()
    },
    async queryCodeSource () {
      const key = this.$utils.rsaEncrypt()
      const res = await getCodeSourceMaskedAPI(key).catch(error =>
        console.log(error)
      )
      if (res) {
        this.allCodeHosts = res.filter(item => item.type !== 'other')
      }
    },
    async queryRepoOwnerById (id, key = '') {
      this.source.repoOwner = ''
      this.source.repoName = ''
      this.source.branchName = ''
      this.getGitSource(id)
      const res = await getRepoOwnerByIdAPI(id, key).catch(error =>
        console.log(error)
      )
      if (res) {
        this.codeInfo.repoOwners = res
      }
    },
    async searchProject (query) {
      this.searchProjectLoading = true
      const repoOwner = this.source.repoOwner
      const item = this.codeInfo.repoOwners.find(item => {
        return item.path === repoOwner
      })
      const type = item ? item.kind : 'group'
      const id = this.source.codehostId
      const res = await getRepoNameByIdAPI(
        id,
        type,
        encodeURI(repoOwner),
        query
      ).catch(error => console.log(error))
      if (res) {
        this.codeInfo.repos = res
      }
      this.searchProjectLoading = false
    },
    getRepoNameById (id, repoOwner, key = '') {
      this.source.repoName = ''
      this.source.branchName = ''
      const item = this.codeInfo.repoOwners.find(item => {
        return item.path === repoOwner
      })
      const type = item ? item.kind : 'group'
      this.$refs.sourceForm.clearValidate()
      getRepoNameByIdAPI(id, type, encodeURI(repoOwner), key).then(res => {
        this.$set(this.codeInfo, 'repos', res)
      })
    },
    getBranchInfoById (id, repoOwner, repoName) {
      const repoItem = this.codeInfo.repos.find(item => {
        return item.name === repoName
      })
      this.source.branchName = ''
      this.source.namespace = repoItem.namespace || ''
      if (repoName && repoOwner) {
        getBranchInfoByIdAPI(id, this.source.namespace, repoName).then(res => {
          this.$set(this.codeInfo, 'branches', res)
        })
      }
    },
    openFileTree () {
      this.$refs.sourceForm.validate().then(res => {
        this.workSpaceModalVisible = true
      })
    },
    closeFileTree ({ successServices, failedServices }) {
      this.$store.commit('SERVICE_DIALOG_VISIBLE', false)
      if (successServices.length) {
        this.$store.dispatch('queryService', {
          projectName: this.$route.params.project_name,
          showServiceName: successServices[0]
        })
      } else {
        this.$message.error(failedServices[0].error)
      }
      const services = successServices.map(service => {
        return {
          serviceName: service,
          type: this.isUpdate ? 'update' : 'create'
        }
      })

      this.$store.commit('CHART_NAMES', services)

      this.$emit('triggleAction')
    },
    getPreloadServices (service) {
      this.changeSelectPath([service.path])
    },
    changeSelectPath (path) {
      this.selectPath = path
      this.workSpaceModalVisible = false
      const emitParams = {
        path: this.selectPath,
        codeHostID: this.source.codehostId,
        owner: this.source.repoOwner,
        repo: this.source.repoName,
        branch: this.source.branchName,
        namespace: this.source.namespace
      }
      this.$emit('selectPath', emitParams)
    },
    getGitSource (codehostId) {
      const codehostItem = this.allCodeHosts.find(item => {
        return item.id === codehostId
      })
      if (codehostItem) {
        this.codehostSource = codehostItem.type
      }
      return codehostItem ? codehostItem.type : ''
    },
    async addService () {
      this.loading = true
      const projectName = this.$route.params.project_name
      this.getGitSource(this.source.codehostId)
      if (this.codehostSource === 'gerrit' || this.codehostSource === 'gitee') {
        const params = {
          codehostId: this.source.codehostId,
          repoOwner: this.source.repoOwner,
          repoName: this.source.repoName,
          branchName: this.source.branchName,
          namespace: this.source.namespace,
          path: this.selectPath,
          type: this.codehostSource
        }
        await getRepoFilesAPI(params)
      }
      let payload = {}
      if (this.gitName === 'public') {
        payload = {
          source: 'publicRepo',
          createFrom: {
            repoLink: this.source.url,
            paths: this.selectPath
          }
        }
      } else {
        const source = this.codehostSource
        payload = {
          source: (source === 'gerrit' || source === 'gitee') ? source : 'repo',
          createFrom: {
            codehostID: this.source.codehostId,
            owner: this.source.repoOwner,
            repo: this.source.repoName,
            branch: this.source.branchName,
            paths: this.selectPath,
            namespace: this.source.namespace
          }
        }
      }
      const reqApi = this.isUpdate ? updateTemplateServiceAPI : createTemplateServiceAPI
      const res = await reqApi(projectName, payload).catch(error => console.log(error))
      if (res) {
        this.closeFileTree(res)
      }
      this.loading = false
    },
    async submit () {
      this.$refs.sourceForm.validate().then(res => {
        this.addService()
      })
    }
  },
  computed: {
    showSelectFileBtn () {
      return (
        this.source.codehostId &&
        this.source.repoName !== '' &&
        this.source.branchName !== ''
      )
    }
  },
  watch: {
    currentService: {
      handler (value) {
        const update =
          value && (!value.source || value.source !== 'chartTemplate')
        if (this.currentSelect === 'git' && value && update) {
          if (value.source) {
            const createFrom = value.create_from
            if (value.source === 'publicRepo') {
              this.gitName = 'public'
              this.source.url = createFrom.repo_link
            } else {
              this.gitName = 'private'
              const gitRepoConfig = createFrom.git_repo_config
              this.source.codehostId = gitRepoConfig.codehost_id
              this.source.branchName = gitRepoConfig.branch
              this.source.repoName = gitRepoConfig.repo
              this.source.repoOwner = gitRepoConfig.owner
              this.source.namespace = value.repo_namespace
            }
            this.selectPath = [createFrom.load_path]
          } else {
            // 老数据
            if (value.src_path) {
              this.gitName = 'public'
            } else {
              this.gitName = 'private'
            }
            this.source.codehostId = value.codehost_id
            this.source.branchName = value.branch_name
            this.source.repoName = value.repo_name
            this.source.repoOwner = value.repo_owner
            this.source.url = value.src_path
            this.selectPath = [value.load_path]
            this.source.namespace = value.repo_namespace
          }
          this.isUpdate = true
        } else {
          this.isUpdate = false
        }
      },
      immediate: true
    },
    gitName () {
      this.$refs.sourceForm && this.$refs.sourceForm.clearValidate()
    }
  },
  mounted () {
    this.queryCodeSource()
  }
}
</script>
<style lang="less" scoped>
.git-repo-container {
  .repo-attr {
    span {
      display: inline-block;
      width: 128px;
      margin-bottom: 20px;
      padding-right: 12px;
      line-height: 40px;
      text-align: right;
    }
  }
}

.submit-button {
  text-align: center;
}
</style>
