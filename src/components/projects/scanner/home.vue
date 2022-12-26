<template>
  <div
    v-loading="loading"
    :element-loading-text="$t(`global.loading`)"
    element-loading-spinner="iconfont iconfont-loading iconvery-scanner"
    class="code-scanner-list-container"
  >
    <div v-if="scannerList.length > 0" class="tab-container">
      <div class="scanner-container">
        <el-input v-model="selectKey" :placeholder="$t(`scanning.prompt.searchForScanning`)" class="search-scanner" prefix-icon="el-icon-search" clearable></el-input>
      </div>
      <ul class="scanner-content">
        <ScannerRow
          v-for="(scannerInfo, index) in selectedScannerList"
          :key="index"
          :scannerInfo="scannerInfo"
          :removeCodeScanner="removeCodeScanner"
          :runCodeScanner="runCodeScanner"
        />
      </ul>
    </div>
    <div v-if="scannerList.length === 0 && !loading" class="no-product">
      <img src="@assets/icons/illustration/test.svg" alt />
      <p>{{$t(`scanning.prompt.noScanning`)}}</p>
    </div>
    <RunScannerTask :dialogVisible.sync="runScanner" :scannerInfo="currentScannerInfo" :projectName="projectName" />
  </div>
</template>

<script>
import ScannerRow from './common/scannerRow.vue'
import RunScannerTask from './common/runScannerTask.vue'
import bus from '@utils/eventBus'
import { getCodeScannerListAPI, deleteCodeScannerAPI } from '@api'

export default {
  data () {
    return {
      scannerList: [],
      loading: false,
      runScanner: false,
      currentScannerInfo: {},
      selectKey: ''
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name || ''
    },
    selectedScannerList () {
      return this.scannerList.filter(test => test.name.includes(this.selectKey))
    }
  },
  methods: {
    fetchScannerList () {
      this.loading = true
      getCodeScannerListAPI(this.projectName).then(res => {
        this.loading = false
        this.scannerList = res
      })
    },
    runCodeScanner (scannerInfo) {
      this.currentScannerInfo = scannerInfo
      this.runScanner = true
    },
    removeCodeScanner ({ name, id }) {
      this.$confirm(this.$t(`scanning.prompt.deleteConfirmation`, { scanningName: name }), this.$t(`global.confirm`), {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      }).then(() => {
        deleteCodeScannerAPI(id, this.projectName).then(() => {
          this.$message.success(this.$t(`scanning.prompt.deleted`))
          this.fetchScannerList()
        })
      })
    }
  },
  created () {
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t(`subTopbarMenu.projects`), url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: this.$t(`subTopbarMenu.scannings`), url: '' }
      ]
    })
    this.fetchScannerList()
  },
  components: {
    ScannerRow,
    RunScannerTask
  }
}
</script>

<style lang="less" scoped>
.code-scanner-list-container {
  position: relative;
  flex: 1;
  height: 100%;
  overflow: auto;
  background-color: @globalBackgroundColor;

  .tab-container {
    height: calc(~'100% - 20px');

    .scanner-container {
      height: 40px;
      margin: 15px 20px;
      text-align: right;

      .search-scanner {
        width: 400px;
      }
    }

    .scanner-content {
      height: calc(~'100% - 70px');
      padding: 0 20px;
      overflow: auto;
    }
  }

  .no-product {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    justify-content: center;

    img {
      width: 400px;
      height: 400px;
    }

    p {
      color: #606266;
      font-size: 15px;
    }
  }
}
</style>
