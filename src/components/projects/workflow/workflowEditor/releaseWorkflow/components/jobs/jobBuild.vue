<template>
  <div class="job-build">
    <el-form ref="ruleForm" :model="job" class="mg-t24 mg-b24" label-width="100px" size="small">
      <el-form-item :label="$t(`workflow.jobName`)" prop="name" :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}">
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <el-form-item :label="$t(`status.imageRepo`)" :rules="{required: true, message: '请选择镜像仓库', trigger: ['blur', 'change']}" prop="spec.docker_registry_id">
        <el-select v-model="job.spec.docker_registry_id" filterable placeholder="请选择" size="small" style="width: 220px;">
          <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
        </el-select>
      </el-form-item>
      <el-row :gutter="2" class="mg-b16">
        <el-col :span="6" class="title">{{$t(`global.serviceModule`)}}</el-col>
        <el-col :span="6" class="title">{{$t(`workflow.buildName`)}}</el-col>
        <el-col :span="8" class="title">{{$t(`workflow.buildConfig`)}}</el-col>
      </el-row>
      <div v-for="(item,index) in serviceAndBuilds" :key="index">
        <el-form :model="item" :ref="`ruleForm${index}`" label-position="left" size="small">
          <el-row :gutter="2" style="line-height: 30px;">
            <el-col :span="6">
              <div>{{item.service_name}}/{{item.service_module}}</div>
            </el-col>
            <el-col :span="6">
              <el-form-item prop="build_name" :rules="{required: true, message: '构建不能为空', trigger: ['blur','change']}">
                <el-select v-model="item.build_name" size="small" @change="handleBuildChange(item)" >
                  <el-option v-for="build in item.module_builds" :key="build.name" :label="build.name" :value="build.name">{{build.name}}</el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-tooltip class="item" effect="dark" :content="$t(`workflow.varConfig`)" placement="top">
                <span class="iconfont iconbianliang1" @click="handleVarBranchChange('var',item,index)"></span>
              </el-tooltip>
              <el-tooltip class="item" effect="dark" :content="$t(`workflow.branchConfig`)"  placement="top">
                <span class="iconfont iconfenzhi" @click="handleVarBranchChange('branch',item,index)"></span>
              </el-tooltip>
              <el-tooltip class="item" effect="dark" :content="$t(`workflow.storageConfig`)" placement="top">
                <span class="iconfont iconcunchufuwu" @click="handleVarBranchChange('pv',item,index)"></span>
              </el-tooltip>
            </el-col>
            <el-col :span="4">
              <el-button type="danger" size="mini" plain @click="delServiceAndBuild(index)">{{$t(`global.delete`)}}</el-button>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </el-form>
    <el-dialog
      :title="`${curItem.service_name}/${curItem.service_module} 变量配置`"
      :visible.sync="isShowVarDialog"
      :append-to-body="true"
      width="40%"
    >
      <el-table :data="curItem.key_vals" size="small">
        <el-table-column prop="key" :label="$t(`global.key`)"></el-table-column>
        <el-table-column :label="$t(`global.type`)">
          <template slot-scope="scope">{{scope.row.type === 'string' ? '字符串' : '枚举'}}</template>
        </el-table-column>
        <el-table-column :label="$t(`global.value`)" width="260">
          <template slot-scope="scope">
            <el-select
              size="small"
              v-model="scope.row.value"
              v-if="scope.row.command !== 'other'&&scope.row.type === 'choice'"
              style="width: 220px;"
            >
              <el-option v-for="option in scope.row.choice_option" :key="option" :label="option" :value="option">{{option}}</el-option>
            </el-select>
            <el-input
              class="password"
              v-model="scope.row.value"
              :type="scope.row.is_credential ? 'passsword' : ''"
              :show-password="scope.row.is_credential ? true : false"
              v-if="scope.row.command !== 'other'&&scope.row.type === 'string'"
              size="small"
              style="width: 220px;"
            ></el-input>
            <el-select
              v-model="scope.row.value"
              placeholder="请选择"
              filterable
              size="small"
              required
              ref="select"
              @focus="handleEnvChange(scope.row, scope.row.command)"
              v-if="scope.row.command === 'other'"
              style="display: inline-block; width: 220px;"
            >
              <el-option v-for="(item,index) in globalEnv" :key="index" :label="item" :value="item">{{item}}</el-option>
            </el-select>
            <EnvTypeSelect
              v-model="scope.row.command"
              isFixed
              isRuntime
              isOther
              style="display: inline-block;"
              @change="handleEnvTypeChange"
            />
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="isShowVarDialog = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="saveCurSetting('var',curItem)" size="small">{{$t(`global.confirm`)}}</el-button>
      </span>
    </el-dialog>
    <el-dialog
      :title="`${curItem.service_name}/${curItem.service_module} 分支配置`"
      :visible.sync="isShowBranchDialog"
      :append-to-body="true"
      width="40%"
    >
      <el-table :data="curItem.repos" size="small">
        <el-table-column prop="repo_name" :label="$t(`global.repository`)" width="200px"></el-table-column>
        <el-table-column prop="branch" label="默认分支">
          <template slot-scope="scope">
            <el-select size="small" v-model="scope.row.branch" filterable>
              <el-option v-for="option in scope.row.branches" :key="option.name" :label="option.name" :value="option.name">{{option.name}}</el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column :label="$t(`global.operation`)" width="100px">
          <template slot-scope="scope">
            <el-button @click="delRepo(scope.row)" type="danger" size="mini">{{$t(`global.delete`)}}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mg-t16">
        <el-select v-model="curItem.curRepo" value-key="repo_name" filterable size="small" placeholder="请选择代码库">
          <el-option v-for="repo of curItem.originRepos" :key="repo.repo_name" :label="repo.repo_name" :value="repo"></el-option>
        </el-select>
        <el-button @click="addRepo" :disabled="curItem.originRepos && curItem.originRepos.length === 0" type="primary" size="mini" plain>{{$t(`global.add`)}}</el-button>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="isShowBranchDialog = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="saveCurSetting('branch',curItem)" size="small">{{$t(`global.confirm`)}}</el-button>
      </span>
    </el-dialog>
    <el-dialog
      :title="`${curItem.service_name}/${curItem.service_module} 共享存储配置`"
      :visible.sync="isShowPvDialog"
      :append-to-body="true"
      width="40%"
    >
      <el-form ref="form" label-width="120px" label-position="left" v-if="curItem.share_storage_info">
        <el-form-item :label="$t(`workflow.enableSharedStorage`)">
          <el-switch
            v-model="curItem.share_storage_info.enabled"
            :disabled="!isCanOpenShareStorage"
            :active-value="true"
            :inactive-value="false"
            @change="handleSwitchChange($event,curItem)"
            active-color="#0066ff"
          ></el-switch>
          <el-tooltip v-if="!isCanOpenShareStorage" :content="$t(`workflow.enableSharedStorageTip`)" placement="top">
            <i class="el-icon-warning" style="color: red; vertical-align: -2px;"></i>
          </el-tooltip>
        </el-form-item>
        <el-form-item :label="$t(`workflow.selectShareDirectory`)" v-if="isCanOpenShareStorage&&curItem.share_storage_info.enabled">
          <el-select
            v-model="curItem.share_storage_info.share_storages"
           :placeholder="$t(`workflow.selectShareDirectory`)"
            filterable
            multiple
            value-key="name"
            size="small"
          >
            <el-option v-for="item in workflowInfo.share_storages" :key="item.value" :label="`${item.name}(${item.path})`" :value="item">
              <span>{{item.name}}</span>
              <span style="color: #ccc;">({{item.path}})</span>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="isShowPvDialog = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="saveCurSetting('pv',curItem)" size="small">{{$t(`global.confirm`)}}</el-button>
        <el-tooltip class="item" effect="dark" content="应用到所有使用相同构建的服务组件" placement="top">
          <el-button type="primary" @click="apply(curItem)" size="small">确认并应用其他组件</el-button>
        </el-tooltip>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { jobType, buildTabList, validateJobName } from '../../config'
import {
  getAllBranchInfoAPI,
  getRegistryWhenBuildAPI,
  getWorkflowGlobalVarsAPI,
  getClusterStatusAPI
} from '@api'
import { differenceWith, cloneDeep } from 'lodash'
import EnvTypeSelect from '../envTypeSelect.vue'
import jsyaml from 'js-yaml'
export default {
  name: 'JobBuild',
  props: {
    projectName: {
      type: String,
      default: ''
    },
    originServiceAndBuilds: {
      type: Array,
      default: () => []
    },
    job: {
      type: Object,
      default: () => ({})
    },
    workflowInfo: {
      type: Object,
      default: () => ({})
    },
    curStageIndex: {
      type: Number,
      default: 0
    },
    curJobIndex: {
      type: Number,
      default: 0
    }
  },
  components: { EnvTypeSelect },
  data () {
    return {
      validateJobName,
      jobType,
      buildTabList,
      isShowBranchDialog: false,
      isShowVarDialog: false,
      isShowPvDialog: false,
      curItem: {},
      curIndex: 0,
      dockerList: [],
      globalEnv: [],
      isCanOpenShareStorage: false
    }
  },
  computed: {
    serviceAndBuilds: {
      get () {
        this.job.spec.service_and_builds.forEach(val => {
          if (
            !val.build_name &&
            val.module_builds &&
            val.module_builds.length > 0
          ) {
            // default select first build
            val.build_name = val.module_builds[0].name
            this.handleBuildChange(val)
          }
          if (val.repos) {
            val.repos.forEach(repo => {
              this.getBranch(repo)
            })
          }
        })
        return this.job.spec.service_and_builds
      }
    },
    isShowFooter () {
      return this.$store.state.customWorkflow.isShowFooter
    }
  },
  created () {
    this.setServiceBuilds()
    this.getRegistryWhenBuild()
    this.getGlobalEnv()
  },
  methods: {
    handleSwitchChange (val, item) {
      if (!val) {
        item.share_storage_info.share_storages = []
      }
    },
    apply (curItem) {
      // 使用相同构建的服务组件都应用当前配置
      this.serviceAndBuilds.forEach(item => {
        if (item.build_name === curItem.build_name) {
          item.share_storage_info = this.curItem.share_storage_info
        }
      })
      this.isShowPvDialog = false
    },
    getClusterStatus (type, projectName, name, id) {
      getClusterStatusAPI(type, projectName, name, id).then(res => {
        this.isCanOpenShareStorage = res
      })
    },
    handleEnvChange (row, command) {
      row.value = ''
      if (command === 'other') {
        this.getGlobalEnv()
      }
    },
    handleEnvTypeChange (val) {
      if (val === 'other') {
        this.$nextTick(() => {
          this.$refs.select.toggleMenu()
        })
      }
    },
    delServiceAndBuild (index) {
      this.serviceAndBuilds.splice(index, 1)
      this.$emit('input', this.serviceAndBuilds)
    },
    getRegistryWhenBuild () {
      const projectName = this.projectName
      getRegistryWhenBuildAPI(projectName).then(res => {
        this.dockerList = res
      })
    },
    setServiceBuilds () {
      this.serviceAndBuilds.forEach(item => {
        const res = this.originServiceAndBuilds.find(
          build => build.service_name === item.service_name
        )
        this.$set(item, 'module_builds', res ? res.module_builds : [])

        // set repos
        const result =
          item.module_builds.find(build => build.name === item.build_name) || []
        const originRepos = differenceWith(
          result.repos || [],
          item.repos,
          (a, b) => {
            return a.repo_name === b.repo_name
          }
        )
        this.$set(item, 'originRepos', originRepos || [])
      })
    },
    handleBuildChange (item) {
      const res = item.module_builds.find(
        build => build.name === item.build_name
      )
      if (res) {
        res.key_vals.forEach(item => {
          if (item.is_credential) {
            // item.value = this.$utils.aesDecrypt(item.value)
          }
        })
      }
      this.$set(item, 'key_vals', res.key_vals || [])
      this.$set(item, 'originRepos', res.repos || [])
      this.$set(item, 'repos', [])
    },
    addRepo () {
      if (this.curItem.repos) {
        this.curItem.repos.push(this.curItem.curRepo)
      } else {
        this.$set(this.curItem, 'repos', [this.curItem.curRepo])
      }
      this.curItem.originRepos = this.curItem.originRepos.filter(
        repo => repo.repo_name !== this.curItem.curRepo.repo_name
      )
      this.getBranch(this.curItem.curRepo)
      this.curItem.curRepo = {}
    },
    delRepo (row) {
      this.curItem.repos = this.curItem.repos.filter(
        repo => repo.repo_name !== row.repo_name
      )
      this.curItem.originRepos.push(row)
    },
    async getBranch (item) {
      const repo = [
        {
          repo_owner: item.repo_owner,
          repo: item.repo_name,
          default_branch: item.branch,
          codehost_id: item.codehost_id
        }
      ]
      const payload = {
        infos: repo
      }
      const res = await getAllBranchInfoAPI(payload)
      if (res) {
        this.$set(item, 'branches', res[0].branches)
      }
    },
    handleVarBranchChange (type, item, index) {
      this.curIndex = index
      if (type === 'var') {
        this.isShowVarDialog = true
      } else if (type === 'branch') {
        this.isShowBranchDialog = true
      } else {
        if (!item.share_storage_info) {
          this.$set(item, 'share_storage_info', {
            enabled: false,
            share_storages: []
          })
        }
        this.getClusterStatus(
          this.jobType.build,
          this.projectName,
          item.build_name,
          ''
        )
        this.isShowPvDialog = true
      }
      this.curItem = cloneDeep(item)
    },
    getGlobalEnv () {
      const params = cloneDeep(this.workflowInfo)
      const curJob = cloneDeep(this.job)
      curJob.name = Math.random()
      params.stages[this.curStageIndex].jobs[this.curJobIndex] = curJob
      getWorkflowGlobalVarsAPI(curJob.name, jsyaml.dump(params)).then(res => {
        this.globalEnv = res
      })
    },
    saveCurSetting (type) {
      this.$set(this.serviceAndBuilds, this.curIndex, this.curItem)
      if (type === 'var') {
        this.isShowVarDialog = false
      } else if (type === 'branch') {
        this.isShowBranchDialog = false
      } else {
        this.isShowPvDialog = false
      }
    },
    validate () {
      if (this.serviceAndBuilds.length === 0) {
        this.$message.error('请至少选择一个服务组件')
        return
      }
      const valid = []
      return this.$refs.ruleForm.validate().then(val => {
        if (val) {
          this.serviceAndBuilds.forEach((item, index) => {
            valid.push(this.$refs[`ruleForm${index}`][0].validate())
          })
          return Promise.all(valid)
        }
      })
    },
    getData () {
      this.serviceAndBuilds.forEach(item => {
        delete item.currentTab
        delete item.isShowVals
        delete item.originRepos
        delete item.module_builds
        if (item.repos && item.repos.length > 0) {
          item.repos.forEach(repo => {
            delete repo.branches
          })
        }
      })
      this.job.spec.service_and_builds = this.serviceAndBuilds
      return this.job
    }
  },
  watch: {
    isShowFooter (val) {
      if (val) {
        this.setServiceBuilds()
      }
    }
  }
}
</script>
<style lang="less" scoped>
.job-build {
  width: 80%;
  color: #606266;
  font-size: 14px;

  .title {
    font-weight: 500;
  }

  .iconfont {
    margin-right: 8px;
    color: #06f;
    cursor: pointer;
  }

  .iconbianliang1 {
    font-weight: 600;
  }

  .password {
    /deep/.el-input__suffix {
      display: none !important;
    }
  }
}
</style>
