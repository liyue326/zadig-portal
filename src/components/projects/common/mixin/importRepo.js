import {
  getCodeSourceMaskedAPI,
  getRepoNameByIdAPI,
  getRepoOwnerByIdAPI,
  getBranchInfoByIdAPI
} from '@api'
const sourceRules = {
  codehostID: [{
    required: true,
    message: '代码源不能为空',
    trigger: 'change'
  }],
  owner: [{
    required: true,
    message: '组织名/用户名不能为空',
    trigger: 'change'
  }],
  repo: [{
    required: true,
    message: '名称不能为空',
    trigger: 'change'
  }],
  branch: [{
    required: true,
    message: '分支不能为空',
    trigger: 'change'
  }],
  valuesPaths: [{
    type: 'array',
    required: true,
    message: '请选择文件',
    trigger: 'change'
  }]
}
export default {
  data () {
    return {
      allCodeHosts: [],
      source: {
        codehostID: null,
        owner: '',
        repo: '',
        branch: '',
        namespace: ''
      },
      codeInfo: {
        repoOwners: [],
        repos: [],
        branches: []
      }
    }
  },
  methods: {
    getGitSource (id) {
      const codehostItem = this.allCodeHosts.find(item => {
        return item.id === id
      })
      return codehostItem ? codehostItem.type : ''
    },
    async queryCodeSource () {
      const key = this.$utils.rsaEncrypt()
      const res = await getCodeSourceMaskedAPI(key).catch(error => console.log(error))
      if (res) {
        this.allCodeHosts = res.filter(item => item.type !== 'other')
      }
    },
    async queryRepoOwnerById (id, key = '') {
      this.source.owner = ''
      this.source.repo = ''
      this.source.branch = ''
      const res = await getRepoOwnerByIdAPI(id, key).catch(error =>
        console.log(error)
      )
      if (res) {
        this.codeInfo.repoOwners = res
      }
    },
    getRepoNameById (id, owner, key = '') {
      this.source.repo = ''
      this.source.branch = ''
      const item = this.codeInfo.repoOwners.find(item => {
        return item.path === owner
      })
      const type = item ? item.kind : 'group'
      this.$refs.repoForm.clearValidate()
      getRepoNameByIdAPI(id, type, encodeURI(owner), key).then(res => {
        this.$set(this.codeInfo, 'repos', res)
      })
    },
    // select set namespace
    getBranchInfoById (id, owner, repo) {
      this.source.branch = ''
      const repoItem = this.codeInfo.repos.find(item => {
        return item.name === repo
      })
      this.source.namespace = repoItem.namespace || ''
      if (repo && owner) {
        getBranchInfoByIdAPI(id, this.source.namespace, repo).then(res => {
          this.$set(this.codeInfo, 'branches', res)
        })
      }
    },
    async searchProject (query) {
      const owner = this.source.owner
      const item = this.codeInfo.repoOwners.find(item => {
        return item.path === owner
      })
      const type = item ? item.kind : 'group'
      const id = this.source.codehostID
      const res = await getRepoNameByIdAPI(
        id,
        type,
        encodeURI(owner),
        query
      ).catch(error => console.log(error))
      if (res) {
        this.codeInfo.repos = res
      }
    },
    resetSource (val = null) {
      this.source = val || {
        codehostID: null,
        owner: '',
        repo: '',
        branch: '',
        valuesPaths: [],
        namespace: ''
      }
      this.$nextTick(() => {
        this.$refs.repoForm && this.$refs.repoForm.clearValidate()
      })
    }
  },
  created () {
    this.sourceRules = sourceRules
    this.queryCodeSource()
    if (this.source && this.source.codehostID && this.source.owner && this.source.repo) {
      const codehostId = this.source.codehostID
      const repoOwner = this.source.owner
      const repoName = this.source.repo
      getRepoOwnerByIdAPI(codehostId).then(res => {
        if (res) {
          this.$set(this.codeInfo, 'repoOwners', res)
          const item = this.codeInfo.repoOwners.find(item => {
            return item.path === repoOwner
          })
          const type = item ? item.kind : 'group'
          getRepoNameByIdAPI(codehostId, type, encodeURI(repoOwner)).then(res => {
            this.$set(this.codeInfo, 'repos', res)
            const repoItem = this.codeInfo.repos.find(
              item => {
                return item.name === repoName
              }
            )
            this.source.namespace = repoItem.namespace || ''
            getBranchInfoByIdAPI(codehostId, this.source.namespace, repoName).then(res => {
              if (res) {
                this.$set(this.codeInfo, 'branches', res)
              }
            })
          })
        }
      })
    }
  }
}
