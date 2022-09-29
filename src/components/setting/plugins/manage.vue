<template>
  <div class="plugins" v-loading="loading">
    <el-row class="mg-b48">
      <el-form :model="source" label-position="left" ref="sourceForm" label-width="130px" inline class="form">
        <el-col :span="2">
          <span style="font-size: 14px;">来源</span>
          <el-link
            style="font-size: 14px; vertical-align: baseline;"
            type="primary"
            :href="`https://docs.koderover.com/zadig/settings/custom-task/`"
            :underline="false"
            target="_blank"
          >帮助</el-link>
        </el-col>
        <el-button type="primary" plain size="small" v-if="plugins.length===0&&!isShowOperateForm" @click="isShowOperateForm=true">+ 添加</el-button>
        <div v-else>
          <el-col :span="3">
            <el-form-item prop="codehost_id" :rules="{required: true, message: '代码源不能为空', trigger: ['blur', 'change']}">
              <el-select
                v-model="source.codehost_id"
                size="small"
                placeholder="请选择代码源"
                :disabled="plugins.length>0&&isSaved"
                @change="getRepoOwnerById(source.codehost_id)"
                filterable
              >
                <el-option
                  v-for="(host,index) in allCodeHosts"
                  :key="index"
                  :label="`${host.address}${host.alias?'('+host.alias+')':''}`"
                  :value="host.id"
                >{{ `${host.address}${host.alias?'('+host.alias+')':''}`}}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item prop="repo_owner" :rules="{required: true, message: '组织名/用户名不能为空', trigger: ['blur','change']}">
              <el-input
                v-if="source.source==='other'"
                v-model.trim="source.repo_owner"
                :disabled="plugins.length>0&&isSaved"
                placeholder="请输入"
                size="small"
              ></el-input>
              <el-select
                v-else
                v-model="source.repo_owner"
                size="small"
                @change="getRepoNameById(source.codehost_id,source.repo_owner)"
                @clear="clearRepoOwner"
                :disabled="plugins.length>0&&isSaved"
                :loading="searchRepoOwnerLoading"
                allow-create
                clearable
                placeholder="请选择组织名/用户名"
                filterable
              >
                <el-option v-for="(repo,index) in codeInfo['repoOwners']" :key="index" :label="repo.name" :value="repo.name"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item prop="repo_name" :rules="{required: true, message: '代码库不能为空', trigger: ['blur','change']}">
              <el-input
                v-if="source.source==='other'"
                v-model.trim="source.repo_name"
                :disabled="plugins.length>0&&isSaved"
                placeholder="请输入"
                size="small"
              ></el-input>
              <el-select
                v-else
                @change="getBranchInfoById(source.codehost_id,source.repo_owner,source.repo_name,source)"
                @clear="clearRepoName"
                v-model.trim="source.repo_name"
                remote
                :remote-method="searchRepoName"
                :loading="searchRepoNameLoading"
                allow-create
                :disabled="plugins.length>0&&isSaved"
                clearable
                size="small"
                placeholder="请选择代码库"
                filterable
              >
                <el-option v-for="(repo,index) in codeInfo['repos']" :key="index" :label="repo.name" :value="repo.name"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item prop="branch" :rules="{required: true, message: '分支不能为空', trigger: ['blur','change']}">
              <el-input
                v-if="source.source==='other'"
                v-model.trim="source.branch"
                :disabled="plugins.length>0&&isSaved"
                placeholder="请输入"
                size="small"
              ></el-input>
              <el-select
                v-else
                v-model.trim="source.branch"
                :disabled="plugins.length>0&&isSaved"
                placeholder="请选择分支"
                size="small"
                filterable
                allow-create
                clearable
              >
                <el-option
                  v-for="(branch,branch_index) in codeInfo['branches']"
                  :key="branch_index"
                  :label="branch.name"
                  :value="branch.name"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6" class="mg-t4">
            <el-button type="primary" plain size="small" v-if="!isSaved" @click="submit('save')">保存</el-button>
            <el-button type="primary" plain size="small" v-if="isSaved" @click="isSaved=false">编辑</el-button>
            <el-button type="success" plain size="small" :disabled="!isSaved" @click="submit('sync')">同步</el-button>
            <el-button type="danger" plain size="small" v-if="plugins.length>0" @click="del">删除</el-button>
          </el-col>
        </div>
      </el-form>
    </el-row>
    <div class="tip">
      <span>最新更新时间：</span>
      <span>{{$utils.convertTimestamp(source.update_time)}}</span>
    </div>
    <div class="tip" v-if="source.error">
      <span>错误信息：</span>
      <span>{{source.error}}</span>
    </div>
  </div>
</template>

<script>
import {
  getCodeSourceMaskedAPI,
  getRepoOwnerByIdAPI,
  getRepoNameByIdAPI,
  getBranchInfoByIdAPI,
  updatePlugin,
  delPlugin,
  getPlugins
} from '@api'

export default {
  data () {
    return {
      allCodeHosts: [],
      codeInfo: {},
      source: {
        codehost_id: '',
        repo_owner: '',
        repo_name: '',
        branch: '',
        error: '',
        update_time: ''
      },
      searchRepoOwnerLoading: false,
      searchRepoNameLoading: false,
      isShowOperateForm: false,
      plugins: [],
      isSaved: false,
      loading: false
    }
  },
  created () {
    this.getPlugins()
  },
  methods: {
    getPlugins () {
      getPlugins().then(res => {
        if (res.length > 0) {
          this.source = res[0]
          this.isSaved = true
        } else {
          this.source = {
            codehost_id: '',
            repo_owner: '',
            repo_name: '',
            branch: '',
            error: '',
            update_time: ''
          }
        }
        this.plugins = res
        this.getInitRepoInfo(this.source)
      })
    },
    getInitRepoInfo (element) {
      const codehostId = element.codehost_id
      const repoOwner =
        element.source === 'other' ? 'other' : element.repo_owner
      const repoName = element.source === 'other' ? 'other' : element.repo_name
      const uuid = element.repo_uuid
      const key = this.$utils.rsaEncrypt()
      getCodeSourceMaskedAPI(key).then(res => {
        this.allCodeHosts = res.filter(element => {
          return element.type !== 'other'
        })
        // this.allCodeHosts = res
      })
      this.codeInfo = {
        repo_owners: [],
        repos: [],
        branches: []
      }
      if (codehostId) {
        getRepoOwnerByIdAPI(codehostId).then(res => {
          this.$set(this.codeInfo, 'repos', res)
          this.$set(this.codeInfo, 'repoOwners', res)
          const item = this.codeInfo.repoOwners.find(item => {
            return item.path === repoOwner
          })
          const type = item ? item.kind : 'group'
          const project_uuid = item.project_uuid ? item.project_uuid : ''
          getRepoNameByIdAPI(
            codehostId,
            type,
            encodeURI(repoOwner),
            '',
            project_uuid
          ).then(res => {
            this.$set(this.codeInfo, 'repos', res)
            this.$set(this.codeInfo, 'origin_repos', res)
          })
        })
        if (!repoName) return
        getBranchInfoByIdAPI(
          codehostId,
          element.repo_namespace,
          repoName,
          uuid
        ).then(res => {
          this.$set(this.codeInfo, 'branches', res || [])
          this.$set(this.codeInfo, 'origin_branches', res || [])
        })
      }
    },
    searchRepoName (query) {
      this.searchRepoNameLoading = true
      const repo_owner = this.source.repo_owner
      const item = this.codeInfo.repoOwners.find(item => {
        return item.path === repo_owner
      })
      const type = item ? item.kind : 'group'
      const id = this.source.codehost_id
      getRepoNameByIdAPI(id, type, encodeURI(repo_owner), query).then(res => {
        this.searchRepoNameLoading = false
        this.$set(this.codeInfo, 'repos', res)
      })
    },
    clearRepoName () {
      const repo_owner = this.source.repo_owner
      const item = this.codeInfo.repoOwners.find(item => {
        return item.path === repo_owner || item.name === repo_owner
      })
      const type = item ? item.kind : 'group'
      const project_uuid = item.project_uuid ? item.project_uuid : ''
      const id = this.source.codehost_id
      getRepoNameByIdAPI(
        id,
        type,
        encodeURI(repo_owner),
        '',
        project_uuid
      ).then(res => {
        this.$set(this.codeInfo, 'repos', res)
      })
      this.source.branch = ''
      this.source.path = ''
      this.$set(this.codeInfo, 'branches', [])
    },
    getRepoNameById (id, repo_owner, key = '') {
      const item = this.codeInfo.repoOwners.find(item => {
        return item.path === repo_owner || item.name === repo_owner
      })
      const type = item ? item.kind : 'group'
      const project_uuid = item.project_uuid ? item.project_uuid : ''
      if (repo_owner) {
        getRepoNameByIdAPI(
          id,
          type,
          encodeURI(repo_owner),
          key,
          project_uuid
        ).then(res => {
          this.$set(this.codeInfo, 'repos', res)
        })
      }
      this.source.repo_name = ''
      this.source.branch = ''
      this.source.path = ''
    },
    searchRepoOwner (query) {
      this.searchRepoOwnerLoading = true
      const id = this.source.codehost_id
      const type = this.allCodeHosts.find(item => {
        return item.id === id
      }).type
      if (type === 'github' && query !== '') {
        const items = this.$utils.filterObjectArrayByKey(
          'name',
          query,
          this.codeInfo.repoOwners
        )
        this.$set(this.codeInfo, 'repoOwners', items)
        this.searchRepoOwnerLoading = false
      } else {
        getRepoOwnerByIdAPI(id, query).then(res => {
          this.$set(this.codeInfo, 'repoOwners', res)
          this.searchRepoOwnerLoading = false
        })
      }
    },
    clearRepoOwner () {
      const id = this.source.codehost_id
      getRepoOwnerByIdAPI(id).then(res => {
        this.$set(this.codeInfo, 'repoOwners', res)
      })
      this.source.repo_name = ''
      this.source.branch = ''
      this.source.path = ''
      this.source.repo_namespace = ''

      this.$set(this.codeInfo, 'repos', [])
      this.$set(this.codeInfo, 'branches', [])
    },
    getRepoOwnerById (id, key = '') {
      const codehost = this.allCodeHosts.find(item => {
        return item.id === id
      })
      const type = codehost ? codehost.type : 'gitlab'
      this.source.source = type
      this.$refs.sourceForm.clearValidate()
      this.$set(this.codeInfo, 'repoOwners', [])
      this.$set(this.codeInfo, 'repos', [])
      this.$set(this.codeInfo, 'branches', [])
      getRepoOwnerByIdAPI(id, key).then(res => {
        this.$set(this.codeInfo, 'repoOwners', res)
      })
      this.source.repo_owner = ''
      this.source.repo_name = ''
      this.source.branch = ''
      this.source.path = ''
      this.source.repo_namespace = ''
    },
    getBranchInfoById (id, repo_owner, repo_name, row) {
      const repoItem = this.codeInfo.repos.find(item => {
        return item.name === repo_name
      })
      const repoUUID = repoItem.repo_uuid ? repoItem.repo_uuid : ''
      this.source.repoUUID = repoUUID
      this.source.repo_namespace = repoItem.namespace || ''
      if (repo_name && repo_owner) {
        getBranchInfoByIdAPI(
          id,
          this.source.repo_namespace,
          repo_name,
          repoUUID
        ).then(res => {
          this.$set(this.codeInfo, 'branches', res)
        })
        this.source.branch = ''
        this.source.path = ''
      }
    },
    del () {
      this.$confirm(`是否删除该插件源`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        delPlugin(this.source.id).then(res => {
          this.$message({
            type: 'success',
            message: '删除成功'
          })
          this.getPlugins()
          this.isShowOperateForm = false
        })
      })
    },
    submit (type) {
      this.loading = true
      this.$refs.sourceForm.validate(valid => {
        if (valid) {
          if (type === 'save') {
            this.isSaved = true
          }
          const {
            source,
            repo_owner,
            repo_namespace,
            repo_name,
            branch,
            codehost_id
          } = this.source
          const payload = {
            source,
            repo_owner,
            repo_namespace,
            repo_name,
            branch,
            codehost_id
          }
          updatePlugin(payload)
            .then(res => {
              this.loading = false
              this.$message.success('操作完成')
              this.getPlugins()
            })
            .catch(() => {
              this.loading = false
            })
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.plugins {
  padding: 24px;

  .form {
    display: flex;
    align-items: center;

    /deep/.el-form-item {
      margin-bottom: 0;
    }
  }

  .tip {
    margin: 8px 0;
    color: #555;
    font-size: 14px;
  }
}
</style>
