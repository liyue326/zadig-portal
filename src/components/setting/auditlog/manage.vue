<template>
  <div class="setting-auditlog-container">
    <el-dialog :title="$t('sysSetting.auditLog.APIPayloadDialogTitle',{ time:currentLog.time })"
               :visible.sync="payloadDialogVisiable"
               width="500px">

      <div>
        <vue-json-pretty v-if="currentLog.request_body"
                         :data="currentLog.request_body">
        </vue-json-pretty>
        <p v-if="currentLog.request_body ===''">{{$t('sysSetting.auditLog.noPayload')}}</p>
      </div>
      <span slot="footer"
            class="dialog-footer">
        <el-button type="primary"
                   size="small"
                   @click="payloadDialogVisiable = false">{{$t(`global.confirm`)}}</el-button>
      </span>
    </el-dialog>
    <div class="section">
      <div class="operation">
        <div class="type">
          <el-select v-model="searchType"
                     size="small"
                     :placeholder="$t(`sysSetting.auditLog.selectType`)">
            <el-option :label="$t(`sysSetting.auditLog.username`)"
                       value="username">
            </el-option>
            <el-option :label="$t(`sysSetting.auditLog.project`)"
                       value="product_name">
            </el-option>
            <el-option :label="$t(`sysSetting.auditLog.function`)"
                       value="function">
            </el-option>
            <el-option :label="$t(`sysSetting.auditLog.statusCode`)"
                       value="status">
            </el-option>
          </el-select>

        </div>

        <div class="keyword">
          <el-input clearable
                    size="small"
                    v-model="keyword"
                    @keyup.enter.native="getAuditLogBySearch"
                    :placeholder="$t(`sysSetting.auditLog.inputKeyword`)"></el-input>
        </div>

        <el-button plain
                   size="small"
                   @click="getAuditLogBySearch"
                   type="primary">{{$t(`sysSetting.auditLog.search`)}}</el-button>
      </div>
      <div class="storage-list">
        <template>
          <el-table :data="results"
                    v-loading="loading"
                    :element-loading-text="$t('global.loading')"
                    element-loading-spinner="el-icon-loading"
                    style="width: 100%;">
            <el-table-column width="160px"
                             :label="$t(`sysSetting.auditLog.time`)">
              <template slot-scope="scope">
                {{$utils.convertTimestamp(scope.row.created_at,'yyyy-mm-dd-ss')}}
              </template>
            </el-table-column>
            <el-table-column :label="$t(`sysSetting.auditLog.username`)">
              <template slot-scope="scope">
                {{scope.row.username}}
              </template>
            </el-table-column>
            <el-table-column width="100px"
                             :label="$t(`global.operation`)">
              <template slot-scope="scope">
                {{scope.row.method}}
              </template>
            </el-table-column>
            <el-table-column :label="$t(`sysSetting.auditLog.project`)">
              <template slot-scope="scope">
                {{scope.row.product_name}}
              </template>
            </el-table-column>
            <el-table-column :label="$t(`sysSetting.auditLog.function`)">
              <template slot-scope="scope">
                {{scope.row.function}}
              </template>
            </el-table-column>
            <el-table-column :label="$t(`sysSetting.auditLog.detail`)">
              <template slot-scope="scope">
                {{scope.row.name}}
              </template>
            </el-table-column>
            <el-table-column width="100px"
                             :label="$t(`sysSetting.auditLog.statusCode`)">
              <template slot-scope="scope">
                <el-tag effect="dark"
                        :type="getStatusColor(scope.row.status)"
                        size="small">
                  {{scope.row.status}}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column width="100px"
                             :label="$t(`sysSetting.auditLog.APIPayload`)">
              <template slot-scope="scope">
                <el-button @click="viewRequestPayload(scope.row)"
                           icon="el-icon-document"
                           type="text"></el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
      <!--start of page-divide -->
      <div class="log-table-pagination">
        <el-pagination background
                       @size-change="handleSizeChange"
                       @current-change="handleCurrentChange"
                       :current-page="currentPageList"
                       :page-sizes="[50, 100,150, 200]"
                       :page-size="logPageSize"
                       layout="total, sizes, prev, pager, next, jumper"
                       :total="totalLog">
        </el-pagination>
      </div>
      <!--page divide-->
    </div>
  </div>
</template>

<script>
import VueJsonPretty from 'vue-json-pretty'
import { getAuditLogAPI } from '@api'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      results: [],
      loading: false,
      payloadDialogVisiable: false,
      searchType: 'username',
      keyword: '',
      currentLog: {
        request_body: ''
      },
      totalLog: 0,
      logPageSize: 50,
      currentPageList: 1
    }
  },
  methods: {
    getAuditLogBySearch () {
      this.currentPageList = 1
      this.getAuditLog('', this.logPageSize, this.currentPageList)
    },
    getAuditLog (type, logPageSize, pageList) {
      this.loading = true
      const payload = {
        username: this.searchType === 'username' ? this.keyword : '',
        projectName: this.searchType === 'product_name' ? this.keyword : '',
        status: this.searchType === 'status' ? Number(this.keyword) : 0,
        function: this.searchType === 'function' ? this.keyword : '',
        per_page: logPageSize,
        page: pageList
      }
      getAuditLogAPI(payload).then((res) => {
        this.results = []
        this.loading = false
        this.totalLog = Number(res.headers['x-total'])
        this.results = res.data
        if (type !== 'init') {
          this.$message({
            message: this.$t('sysSetting.auditLog.searchCompleted'),
            type: 'success'
          })
        }
      }, () => {
        this.loading = false
      })
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
      this.payloadDialogVisiable = true
      this.currentLog.time = this.$utils.convertTimestamp(request.created_at)
      this.currentLog.username = request.username
      this.currentLog.function = request.function
      if (request.request_body) {
        this.currentLog.request_body = JSON.parse(request.request_body)
      } else {
        this.currentLog.request_body = ''
      }
    },
    handleSizeChange (val) {
      this.logPageSize = val
      this.getAuditLog('init', this.logPageSize, this.currentPageList)
    },
    handleCurrentChange (val) {
      this.currentPageList = val
      this.getAuditLog('init', this.logPageSize, this.currentPageList)
    }
  },
  components: {
    VueJsonPretty
  },
  created () {
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: this.$t(`sidebarMenu.auditLog`), url: '' }] })
    this.getAuditLog('init', this.logPageSize, this.currentPageList)
  }
}
</script>

<style lang="less">
.setting-auditlog-container {
  position: relative;
  flex: 1;
  height: 100%;
  padding: 15px 30px;
  overflow: auto;
  font-size: 13px;

  .section {
    margin-bottom: 56px;

    .operation {
      margin-bottom: 15px;

      .type {
        display: inline-block;
        width: 140px;
      }

      .keyword {
        display: inline-block;
        width: 400px;
      }
    }

    .log-table-pagination {
      margin-top: 15px;
    }
  }
}
</style>
