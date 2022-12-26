<template>
  <div class="job-scanning">
    <el-form ref="ruleForm" :model="job" class="mg-t24 mg-b24" label-position="left" label-width="100px" size="small">
      <el-form-item :label="$t(`workflow.jobName`)" prop="name" :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}">
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <div class="mg-b24 title">{{$t(`workflow.chooseScan`)}}</div>
      <el-row :gutter="24" class="mg-b16">
        <el-col :span="6">{{$t(`workflow.scanName`)}}</el-col>
        <el-col :span="6">{{$t(`workflow.scanConfig`)}}</el-col>
        <el-col :span="6"></el-col>
      </el-row>
      <div v-for="(item,index) in job.spec.scannings" :key="index">
        <el-row :gutter="24" style="line-height: 30px;">
          <el-col :span="6">
            <el-form-item prop="name" label-width="0">
              <el-select size="small" v-model="item.name" filterable>
                <el-option
                  v-for="(scanning,index) in scanningList"
                  :key="index"
                  :value="scanning.name"
                  :label="scanning.name"
                >{{scanning.name}}</el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
           <el-tooltip class="item" effect="dark" :content="$t(`workflow.branchConfig`)"  placement="top">
                <span class="iconfont iconfenzhi" @click="handleVarBranchChange('branch',item,index)"></span>
              </el-tooltip>
              <el-tooltip class="item" effect="dark" :content="$t(`workflow.storageConfig`)" placement="top">
                <span class="iconfont iconcunchufuwu" @click="handleVarBranchChange('pv',item,index)"></span>
              </el-tooltip>
          </el-col>
          <el-col :span="4">
            <el-button type="danger" size="mini" plain @click="delScanning(index)">{{$t(`global.delete`)}}</el-button>
          </el-col>
        </el-row>
      </div>
      <el-select size="small" v-model="scanning" multiple filterable clearable class="mg-t24">
        <el-option disabled label="全选" value="ALL" :class="{selected: scanning.length === scanningList.length}" style="color: #606266;">
          <span
            style=" display: inline-block; width: 100%; font-weight: normal; cursor: pointer;"
            @click="scanning = scanningList.map(item=>item.name)"
          >全选</span>
        </el-option>
        <el-option v-for="(scanning,index) in scanningList" :key="index" :value="scanning.name" :label="scanning.name">{{scanning.name}}</el-option>
      </el-select>
      <el-button type="success" size="mini" plain :disabled="Object.keys(scanning).length === 0" @click="addScanning()">+ {{$t(`global.add`)}}</el-button>
    </el-form>
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
        <el-button @click="addRepo" :disabled="curItem.originRepos && curItem.originRepos.length === 0" type="primary" size="mini" plain>{{$t(`global.add`)}}</el-button>
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
  getCodeScannerListAPI,
  getClusterStatusAPI
} from '@api'
import { differenceWith, cloneDeep } from 'lodash'
import EnvTypeSelect from '../envTypeSelect.vue'
export default {
  name: 'JobScanning',
  props: {
    projectName: {
      type: String,
      default: ''
    },
    globalEnv: {
      type: Array,
      default: () => []
    },
    job: {
      type: Object,
      default: () => ({
        spec: {
          scannings: []
        }
      })
    },
    workflowInfo: {
      type: Object,
      default: () => ({})
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
      originScannings: [],
      scanning: '',
      isCanOpenShareStorage: false
    }
  },
  computed: {
    isShowFooter () {
      return this.$store.state.customWorkflow.isShowFooter
    },
    scanningList () {
      return differenceWith(
        this.originScannings,
        this.job.spec.scannings,
        (a, b) => {
          return a.name === b.name
        }
      )
    }
  },
  created () {
    this.getScanningList()
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
    getScanningList () {
      getCodeScannerListAPI(this.projectName).then(res => {
        this.originScannings = cloneDeep(res)
      })
    },
    addScanning () {
      let curService
      this.scanning.forEach(scanning => {
        curService = this.scanningList.find(item => item.name === scanning)
        curService.originRepos = cloneDeep(curService.repos)
        curService.repos = []
        this.job.spec.scannings.push(cloneDeep(curService))
      })
      this.scanning = []
    },
    delScanning (index) {
      this.job.spec.scannings.splice(index, 1)
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
      if (type === 'branch') {
        this.isShowBranchDialog = true
      } else {
        if (!item.share_storage_info) {
          this.$set(item, 'share_storage_info', {
            enabled: false,
            share_storages: []
          })
        }
        this.getClusterStatus(this.jobType.scanning, this.projectName, item.name, '')
        this.isShowPvDialog = true
      }
      const res = this.originScannings.find(
        scanning => scanning.name === item.name
      )
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
      this.curIndex = index
      this.curItem = cloneDeep(item)
    },
    saveCurSetting (type) {
      this.job.spec.scannings.forEach((item, index) => {
        if (index === this.curIndex) {
          this.$set(this.job.spec.scannings, index, this.curItem)
        }
      })
      if (type === 'branch') {
        this.isShowBranchDialog = false
      } else {
        this.isShowPvDialog = false
      }
    },
    validate () {
      if (this.job.spec.scannings.length === 0) {
        this.$message.error('请至少选择一个扫描任务')
        return
      }
      return this.$refs.ruleForm.validate()
    },
    getData () {
      this.job.spec.scannings.forEach(item => {
        delete item.curRepo
        item.project_name = item.product_name || ''
      })
      return this.job
    }
  },
  watch: {
    job: {
      handler (val, oldVal) {
        val.spec.scannings.forEach(item => {
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
.job-scanning {
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
