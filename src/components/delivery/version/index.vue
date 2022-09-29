<template>
  <div
    v-loading="loading"
    element-loading-text="加载中..."
    element-loading-spinner="iconfont iconfont-loading iconvery-versionmana"
    class="version-list-container"
  >
    <div class="operation">
      <div v-if="showHookConfig" class="hook-config">
        <span class="hook-switch">
          <span>
            Hook 配置
            <a
              href="https://docs.koderover.com/zadig/project/version/#hook-%E5%A4%96%E9%83%A8%E7%B3%BB%E7%BB%9F"
              target="_blank"
              rel="noopener noreferrer"
            >
              <el-tag size="mini" type="success" effect="dark" class="help-tag">帮助</el-tag>
            </a>
          </span>
          <el-switch v-model="versionHook.enable" style="margin-left: 10px;" @change="saveHook" :disabled="!isProjectAdmin"></el-switch>
        </span>
        <el-form ref="hookRef" :model="versionHook" v-if="versionHook.enable" inline class="hook-form">
          <el-form-item prop="hook_host" :rules="{required: true, message: '请选择外部系统', trigger: 'blur'}">
            <el-select v-model="versionHook.hook_host" placeholder="选择外部系统" size="small" clearable style="width: 100%;">
              <el-option v-for="external in externalList" :key="external.id" :label="external.server" :value="external.server"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item style=" margin-right: 5px; margin-left: -5px;">
            <span>/</span>
          </el-form-item>
          <el-form-item prop="path" :rules="{required: true, message: '请输入访问路径', trigger: 'blur'}">
            <el-input v-model="versionHook.path" placeholder="输入访问路径" size="small"></el-input>
          </el-form-item>
        </el-form>
        <i v-if="versionHook.enable" class="hook-icon el-icon-finished" @click="saveHook"></i>
      </div>
    </div>
    <el-table :data="versionList" v-if="versionList.length > 0" style="width: 100%;">
      <el-table-column label="版本">
        <template slot-scope="scope">
          <span class="version-link">
            <router-link
              v-if="projectName"
              :to="`/v1/projects/detail/${scope.row.versionInfo.productName}/version/detail/${scope.row.versionInfo.id}?version=${scope.row.versionInfo.version}&type=${scope.row.versionInfo.type}`"
            >
              {{
              scope.row.versionInfo.version }}
            </router-link>
            <router-link
              v-else
              :to="`/v1/delivery/version/detail/${scope.row.versionInfo.productName}/${scope.row.versionInfo.id}?version=${scope.row.versionInfo.version}&type=${scope.row.versionInfo.type}`"
            >
              {{
              scope.row.versionInfo.version }}
            </router-link>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="create_by" label="所属项目" v-if="!projectName">
        <template slot-scope="scope">
          <span>{{ scope.row.versionInfo.productName }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" v-if="showStatus">
        <template slot-scope="{ row }">
          <el-tag
            :type="helmStatusEnum[row.versionInfo.status].tag || 'info'"
            size="small"
          >{{ helmStatusEnum[row.versionInfo.status].text || '未知' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标签">
        <template slot-scope="scope">
          <span v-for="(label,index) in scope.row.versionInfo.labels" :key="index" style="margin-right: 3px;">
            <el-tag size="small">{{label}}</el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="create_by" label="创建人">
        <template slot-scope="scope">
          <span>{{ scope.row.versionInfo.createdBy }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="create_at" label="创建时间">
        <template slot-scope="scope">
          <span>{{ $utils.convertTimestamp(scope.row.versionInfo.created_at) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template slot-scope="scope">
          <el-button
            v-if="checkPermissionSyncMixin({type:'project',projectName: projectName, action: 'delete_delivery'})"
            size="mini"
            @click="deleteVersion(scope.row.versionInfo)"
            type="danger"
            plain
          >删除</el-button>
          <el-tooltip v-else effect="dark" content="无权限操作" placement="top">
            <el-button class="permission-disabled" size="mini" type="danger" plain>删除</el-button>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="versionList.length === 0 && !loading" class="version-not-available">
      <img src="@assets/icons/illustration/versionManage.svg" alt />
      <p>暂无可展示的版本信息</p>
    </div>
  </div>
</template>

<script>
import bus from '@utils/eventBus'
import { cloneDeep } from 'lodash'
import store from 'storejs'
import {
  getVersionListAPI,
  getVersionServiceListAPI,
  deleteVersionAPI,
  getSingleProjectAPI,
  getExternalSystemsAPI,
  updateSingleProjectAPI,
  queryUserBindingsAPI
} from '@api'
export default {
  data () {
    return {
      loading: false,
      userBindings: [],
      versionList: [],
      serviceList: [],
      selectedService: '',
      externalList: [],
      versionHook: {
        enable: false,
        hook_host: '',
        path: ''
      },
      showStatus: false,
      helmStatusEnum: {
        success: {
          text: '成功',
          tag: 'success'
        },
        failed: {
          text: '失败',
          tag: 'danger'
        },
        creating: {
          text: '创建中',
          tag: 'info'
        },
        retrying: {
          text: '重试中',
          tag: 'warning'
        }
      }
    }
  },
  methods: {
    deleteVersion (version) {
      const projectName = version.productName
      const versionId = version.id
      this.$confirm(`确定删除 ${version.version} 这个版本？`, '删除版本', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          deleteVersionAPI(projectName, versionId).then(res => {
            this.$message({
              type: 'success',
              message: '版本删除成功'
            })
            this.getVersionServiceList()
            this.searchVersionByService()
          })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    },
    searchVersionByService () {
      this.loading = true
      const selectedService = this.selectedService
      const projectName = this.projectName ? this.projectName : ''
      getVersionListAPI('', projectName, '', selectedService, 'brief').then(
        res => {
          this.versionList = res
          this.loading = false
        }
      )
    },
    getVersionServiceList () {
      const projectName = this.projectName ? this.projectName : ''
      getVersionServiceListAPI(projectName).then(res => {
        this.serviceList = res
      })
    },
    initData () {
      getSingleProjectAPI(this.projectName).then(res => {
        this.projectForm = res
        if (res.team_id === 0) {
          this.projectForm.team_id = null
        }
        if (!res.timeout) {
          this.projectForm.timeout = 10
        }
        const key = this.$utils.rsaEncrypt()
        getExternalSystemsAPI(key).then(res => {
          this.externalList = res.external_system
        })
        if (!this.projectForm.delivery_version_hook) {
          this.projectForm.delivery_version_hook = {
            enable: false,
            hook_host: '',
            path: ''
          }
        }
        this.versionHook = cloneDeep(this.projectForm.delivery_version_hook)
      })
    },
    saveHook (enable) {
      if (enable === true) {
        return
      }
      this.$refs.hookRef &&
        this.$refs.hookRef.validate().then(() => {
          const payload = {
            ...this.projectForm,
            delivery_version_hook: this.versionHook
          }
          updateSingleProjectAPI(this.projectName, payload).then(res => {
            this.$message({
              type: 'success',
              message: '配置更新成功'
            })
          })
        })
    },
    async getUserBinding (projectName) {
      const userInfo = store.get('userInfo')
      const userBindings = await queryUserBindingsAPI(
        userInfo.uid,
        projectName
      ).catch(error => console.log(error))
      if (userBindings) {
        this.userBindings = userBindings
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    showHookConfig () {
      const project = this.$store.getters.projectList.find(
        project => project.name === this.projectName
      )
      if (!this.projectName) {
        return false
      } else if (project && project.deployType === 'helm') {
        this.initData()
        this.showStatus = true
        return true
      } else {
        return false
      }
    },
    isProjectAdmin () {
      if (this.$utils.roleCheck('admin')) {
        return true
      } else if (this.userBindings.length > 0) {
        return this.userBindings.some(item => item.role === 'project-admin')
      } else {
        return false
      }
    }
  },
  created () {
    if (this.projectName) {
      bus.$emit(`set-topbar-title`, {
        title: '',
        breadcrumb: [
          { title: '项目', url: `/v1/projects` },
          {
            title: this.projectName,
            isProjectName: true,
            url: `/v1/projects/detail/${this.projectName}/detail`
          },
          { title: '版本管理', url: `` }
        ]
      })
      this.getUserBinding(this.projectName)
    } else {
      bus.$emit(`set-topbar-title`, {
        title: '',
        breadcrumb: [
          { title: '交付中心', url: `/v1/delivery` },
          { title: '版本管理', url: `` }
        ]
      })
    }

    this.getVersionServiceList()
    this.searchVersionByService()
  }
}
</script>

<style lang="less">
.version-list-container {
  position: relative;
  flex: 1;
  padding: 24px 24px;
  overflow: auto;

  .version-link {
    a {
      color: @themeColor;
    }
  }

  .operation {
    margin-bottom: 16px;
    line-height: 40px;
    text-align: right;

    .hook-config {
      display: inline-flex;
      align-items: center;

      .hook-switch {
        display: inline-block;
        margin-right: 10px;
        font-weight: 300;
        white-space: nowrap;

        .help-tag {
          vertical-align: super;
          cursor: pointer;
        }
      }

      .el-form.hook-form {
        white-space: nowrap;

        .el-form-item {
          margin-bottom: 0;
        }
      }

      .hook-icon {
        color: @themeColor;
        cursor: pointer;
      }
    }
  }

  .version-not-available {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    justify-content: center;

    img {
      width: 400px;
      height: 400px;
      padding: 45px;
    }

    p {
      color: #606266;
      font-size: 15px;
    }
  }
}
</style>
