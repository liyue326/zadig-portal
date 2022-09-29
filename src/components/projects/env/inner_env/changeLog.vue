<template>
  <div class="env-changelog-container">
    <el-dialog :title="`API 请求：${currentLog.time}`" :visible.sync="payloadDialogVisible" width="60%">
      <div>
        <vue-json-pretty v-if="currentLog.request_body" :data="currentLog.request_body"></vue-json-pretty>
        <p v-else>暂无请求 Payload 信息</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" size="small" @click="payloadDialogVisible = false">确 定</el-button>
      </span>
    </el-dialog>
    <div class="section">
      <div class="operation">
        <div class="type">
          <el-select v-model="search.searchType" size="small" placeholder="请选择查询类型">
            <el-option v-for="type in searchTypes" :key="type.value" :label="type.label" :value="type.value"></el-option>
          </el-select>
        </div>
        <div class="keyword">
          <el-input clearable size="small" v-model="search.keyword" @keyup.enter.native="getEnvLogBySearch" placeholder="请输入关键字"></el-input>
        </div>
        <el-button plain size="small" @click="getEnvLogBySearch" type="primary">查询</el-button>
      </div>
      <div class="storage-list">
        <template>
          <el-table
            :data="results"
            v-loading="loading"
            element-loading-text="拼命加载中"
            element-loading-spinner="el-icon-loading"
            style="width: 100%;"
          >
            <el-table-column width="180px" label="时间">
              <template slot-scope="{ row }">{{$utils.convertTimestamp(row.created_at,'yyyy-mm-dd-ss')}}</template>
            </el-table-column>
            <el-table-column label="用户名" prop="username"></el-table-column>
            <el-table-column label="操作" prop="method"></el-table-column>
            <el-table-column label="功能" prop="function"></el-table-column>
            <el-table-column label="详情" prop="name"></el-table-column>
            <el-table-column width="120px" label="状态码">
              <template slot-scope="{ row }">
                <el-tag effect="dark" :type="getStatusColor(row.status)" size="small">{{row.status}}</el-tag>
              </template>
            </el-table-column>
            <el-table-column width="120px" label="API 请求">
              <template slot-scope="{ row }">
                <el-button @click="viewRequestPayload(row)" icon="el-icon-document" type="text"></el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
      <div class="log-table-pagination">
        <el-pagination
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="paginationInfo.currentPage"
          :page-sizes="[50, 100, 150, 200]"
          :page-size="paginationInfo.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="paginationInfo.total"
        ></el-pagination>
      </div>
    </div>
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty'
import { getTheEnvChangeLogAPI } from '@api'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      searchTypes: [
        {
          label: '用户名',
          value: 'username'
        },
        {
          label: '功能',
          value: 'function'
        },
        {
          label: '状态码',
          value: 'status'
        },
        {
          label: '详情',
          value: 'detail'
        }
      ],
      results: [],
      loading: false,
      payloadDialogVisible: false,
      search: {
        searchType: 'username',
        keyword: ''
      },
      currentLog: {
        time: '',
        request_body: ''
      },
      paginationInfo: {
        total: 0,
        pageSize: 50,
        currentPage: 1
      }
    }
  },
  methods: {
    getEnvLogBySearch () {
      this.paginationInfo.currentPage = 1
      this.getEnvLog('search')
    },
    getEnvLog (type) {
      this.loading = true
      const payload = {
        projectName: this.projectName,
        envName: this.envName,
        pageSize: this.paginationInfo.pageSize,
        page: this.paginationInfo.currentPage,
        username: '',
        status: 0,
        function: '',
        detail: ''
      }
      payload[this.search.searchType] =
        this.search.searchType === 'status'
          ? Number(this.search.keyword)
          : this.search.keyword
      getTheEnvChangeLogAPI(payload).then(
        res => {
          this.loading = false
          this.paginationInfo.total = res.count
          this.results = res.logs
          if (type === 'search') {
            this.$message({
              message: '查询完毕',
              type: 'success'
            })
          }
        },
        () => {
          this.loading = false
        }
      )
    },
    getStatusColor (status) {
      if (status > 0 && status <= 299) {
        return 'success'
      } else if (status >= 400) {
        return 'danger'
      } else {
        return 'info'
      }
    },
    viewRequestPayload (request) {
      this.payloadDialogVisible = true
      this.currentLog.time = this.$utils.convertTimestamp(request.created_at)
      this.currentLog.request_body = request.request_body
        ? JSON.parse(request.request_body)
        : ''
    },
    handleSizeChange (val) {
      this.paginationInfo.pageSize = val
      this.getEnvLog()
    },
    handleCurrentChange (val) {
      this.paginationInfo.currentPage = val
      this.getEnvLog()
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    envName () {
      return this.$route.params.env_name
    }
  },
  components: {
    VueJsonPretty
  },
  created () {
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        { title: '项目', url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        {
          title: '环境',
          url: `/v1/projects/detail/${this.projectName}/envs/detail`
        },
        {
          title: this.envName,
          url: `/v1/projects/detail/${this.projectName}/envs/detail?envName=${this.envName}`
        },
        { title: '变更记录', url: '' }
      ]
    })
    this.getEnvLog()
  }
}
</script>

<style lang="less" scoped>
.env-changelog-container {
  position: relative;
  flex: 1;
  box-sizing: border-box;
  height: 100%;
  padding: 18px 24px;
  overflow: auto;
  font-size: 13px;

  .section {
    margin-bottom: 56px;

    .operation {
      margin-bottom: 18px;

      .type {
        display: inline-block;
        width: 120px;
      }

      .keyword {
        display: inline-block;
        width: 400px;
      }
    }

    .log-table-pagination {
      margin-top: 18px;
    }
  }
}
</style>
