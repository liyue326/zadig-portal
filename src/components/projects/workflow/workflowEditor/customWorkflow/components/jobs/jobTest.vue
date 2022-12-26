<template>
  <div class="job-test">
    <el-form ref="ruleForm" :model="job" class="mg-t24 mg-b24" label-position="left" label-width="100px" size="small">
      <el-form-item
        :label="$t(`workflow.jobName`)"
        prop="name"
        :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}"
      >
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <div class="mg-b24 title">{{$t(`workflow.selectTest`)}}</div>
      <el-row :gutter="24" class="mg-b16">
        <el-col :span="6">{{$t(`global.testName`)}}</el-col>
        <el-col :span="6">{{$t(`workflow.testConfig`)}}</el-col>
        <el-col :span="6"></el-col>
      </el-row>
      <div v-for="(item,index) in job.spec.test_modules" :key="index">
        <el-row :gutter="24" style="line-height: 30px;">
          <el-col :span="6">
            <el-form-item prop="name" label-width="0">
              <el-select size="small" v-model="item.name" filterable>
                <el-option v-for="(test,index) in testList" :key="index" :value="test.name" :label="test.name">{{test.name}}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-tooltip class="item" effect="dark" :content="$t(`workflow.varConfig`)" placement="top">
              <span class="iconfont iconbianliang1" @click="handleVarBranchChange('var',item,index)"></span>
            </el-tooltip>
            <el-tooltip class="item" effect="dark" :content="$t(`workflow.branchConfig`)" placement="top">
              <span class="iconfont iconfenzhi" @click="handleVarBranchChange('branch',item,index)"></span>
            </el-tooltip>
            <el-tooltip class="item" effect="dark" :content="$t(`workflow.storageConfig`)" placement="top">
              <span class="iconfont iconcunchufuwu" @click="handleVarBranchChange('pv',item,index)"></span>
            </el-tooltip>
          </el-col>
          <el-col :span="4">
            <el-button type="danger" size="mini" plain @click="delTest(index)">{{$t(`global.delete`)}}</el-button>
          </el-col>
        </el-row>
      </div>
      <el-select size="small" v-model="test" multiple filterable clearable class="mg-t24">
        <el-option disabled label="全选" value="ALL" :class="{selected: test.length === testList.length}" style="color: #606266;">
          <span
            style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
            @click="test = testList.map(item=>item.name)"
          >全选</span>
        </el-option>
        <el-option v-for="(test,index) in testList" :key="index" :value="test.name" :label="test.name">{{test.name}}</el-option>
      </el-select>
      <el-button type="success" size="mini" plain :disabled="Object.keys(test).length === 0" @click="addTest()">+ {{$t(`global.add`)}}</el-button>
    </el-form>
    <el-dialog :title="`${curItem.name} 变量配置`" :visible.sync="isShowVarDialog" :append-to-body="true" width="40%">
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
              v-if="scope.row.command === 'other'"
              ref="select"
              @focus="handleEnvChange(scope.row, scope.row.command)"
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
    <el-dialog :title="`${curItem.name} 分支配置`" :visible.sync="isShowBranchDialog" :append-to-body="true" width="40%">
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
        <el-button
          @click="addRepo"
          :disabled="curItem.originRepos && curItem.originRepos.length === 0"
          type="primary"
          size="mini"
          plain
        >{{$t(`global.add`)}}</el-button>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="isShowBranchDialog = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="saveCurSetting('branch',curItem)" size="small">{{$t(`global.confirm`)}}</el-button>
      </span>
    </el-dialog>
    <el-dialog :title="`${curItem.name} 共享存储配置`" :visible.sync="isShowPvDialog" :append-to-body="true" width="40%">
      <el-form ref="form" label-position="left" label-width="120px" v-if="curItem.share_storage_info">
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
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { jobType, validateJobName } from '../../config'
import {
  getAllBranchInfoAPI,
  getTestListAPI,
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
    job: {
      type: Object,
      default: () => ({
        spec: {
          test_modules: []
        }
      })
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
      isShowBranchDialog: false,
      isShowVarDialog: false,
      isShowPvDialog: false,
      curItem: {},
      curIndex: 0,
      originTestList: [],
      test: '',
      globalEnv: [],
      isCanOpenShareStorage: false
    }
  },
  computed: {
    isShowFooter () {
      return this.$store.state.customWorkflow.isShowFooter
    },
    testList () {
      return differenceWith(
        this.originTestList,
        this.job.spec.test_modules,
        (a, b) => {
          return a.name === b.name
        }
      )
    }
  },
  created () {
    this.getTestList()
    this.getGlobalEnv()
  },
  methods: {
    handleSwitchChange (val, item) {
      if (!val) {
        item.share_storage_info.share_storages = []
      }
    },
    getClusterStatus (type, projectName, name, id) {
      getClusterStatusAPI(type, projectName, name, id).then(res => {
        this.isCanOpenShareStorage = res
      })
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
    getTestList () {
      getTestListAPI(this.projectName).then(res => {
        this.originTestList = cloneDeep(res)
      })
    },
    addTest () {
      let curService
      this.test.forEach(test => {
        curService = this.testList.find(item => item.name === test)
        curService.originRepos = cloneDeep(curService.repos)
        curService.repos = []
        this.job.spec.test_modules.push(cloneDeep(curService))
      })
      this.test = []
    },
    delTest (index) {
      this.job.spec.test_modules.splice(index, 1)
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
          this.jobType.test,
          this.projectName,
          item.name,
          ''
        )
        this.isShowPvDialog = true
      }
      const res = this.originTestList.find(test => test.name === item.name)
      if (
        !item.originRepos ||
        (item.originRepos && item.originRepos.length === 0)
      ) {
        item.originRepos = differenceWith(
          res.repos || [],
          item.repos,
          (a, b) => {
            return a.repo_name === b.repo_name
          }
        )
      } else {
        item.originRepos = differenceWith(
          item.originRepos || [],
          item.repos,
          (a, b) => {
            return a.repo_name === b.repo_name
          }
        )
      }
      this.curItem = cloneDeep(item)
    },
    saveCurSetting (type) {
      this.job.spec.test_modules.forEach((item, index) => {
        if (index === this.curIndex) {
          this.$set(this.job.spec.test_modules, index, this.curItem)
        }
      })
      if (type === 'var') {
        this.isShowVarDialog = false
      } else if (type === 'branch') {
        this.isShowBranchDialog = false
      } else {
        this.isShowPvDialog = false
      }
    },
    validate () {
      if (this.job.spec.test_modules.length === 0) {
        this.$message.error('请至少选择一个测试')
        return
      }
      return this.$refs.ruleForm.validate()
    },
    getData () {
      this.job.spec.test_modules.forEach(item => {
        delete item.curRepo
        item.project_name = item.product_name || item.project_name
      })
      return this.job
    }
  },
  watch: {
    job: {
      handler (val, oldVal) {
        val.spec.test_modules.forEach(item => {
          if (item.repos.length > 0) {
            item.repos.forEach(repo => {
              this.getBranch(repo)
            })
          }
        })
      },
      immediate: true
    }
  }
}
</script>
<style lang="less" scoped>
.job-test {
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
