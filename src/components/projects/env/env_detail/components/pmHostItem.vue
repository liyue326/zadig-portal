<template>
  <div class="host-select">
    <el-input placeholder="搜索主机名称或主机 IP" v-model="keyword" size="small" class="search" @input="getHosts">
      <el-button slot="append" icon="el-icon-search"></el-button>
    </el-input>
    <el-table :data="allHost" @select="handleSelectionChange" @select-all="handleSelectionChange" ref="multipleTable">
      <el-table-column type="selection" width="55"></el-table-column>
      <el-table-column prop="name" label="主机名称"></el-table-column>
      <el-table-column prop="ip" label="主机 IP"></el-table-column>
      <el-table-column prop="label" label="标签" width="100" :filters="filtersList" :filter-method="filterTag" filter-placement="bottom-end">
        <template slot-scope="scope" v-if="scope.row.label">
          <el-tag size="small" disable-transitions>{{scope.row.label}}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>
import { getHostListAPI, getProjectHostListAPI } from '@api'

export default {
  name: 'pmHostItem',
  props: {
    currentPmServiceData: {
      type: Object,
      default: function () {
        return {}
      }
    },
    currentTab: {
      type: String,
      default: 'project'
    },
    editHostDialogVisible: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      serviceHosts: [],
      allHost: [],
      keyword: '',
      projectList: [],
      systemList: []
    }
  },
  computed: {
    filtersList: function () {
      const arr = []
      this.allHost.forEach(item => {
        const filter = {}
        if (item.label) {
          filter.text = item.label
          filter.value = item.label
          arr.push(filter)
        }
      })
      return arr
    }
  },
  created () {
    this.getHosts()
  },
  methods: {
    getHosts () {
      const key = this.$utils.rsaEncrypt()
      const keyword = this.keyword
      const projectName =
        this.currentTab === 'project'
          ? this.currentPmServiceData.product_name
          : ''
      if (this.currentTab === 'project') {
        getProjectHostListAPI(key, projectName, keyword).then(res => {
          this.allHost = [...res]
          this.projectList = [...res]
          this.updateRowSelection(this.serviceHosts)
        })
      } else {
        getHostListAPI(key, keyword).then(res => {
          this.allHost = [...res]
          this.systemList = [...res]
          this.updateRowSelection(this.serviceHosts)
        })
      }
    },
    updateRowSelection (ids) {
      ids.forEach(id => {
        this.allHost.forEach(host => {
          if (host.id === id) {
            this.$nextTick(() => {
              this.$refs.multipleTable.toggleRowSelection(host, true)
            })
          }
        })
      })
    },
    handleSelectionChange (section, row) {
      this.serviceHosts = section.map(item => item.id)
    },
    filterTag (value, row) {
      return row.label === value
    }
  },
  watch: {
    currentPmServiceData: {
      handler (val) {
        if (val.env_configs) {
          this.serviceHosts = []
          val.env_configs.forEach(item => {
            this.serviceHosts = this.serviceHosts.concat(
              item.host_ids,
              item.labels
            )
          })
        }
      },
      immediate: true
    },
    serviceHosts: {
      handler (val) {
        this.updateRowSelection(val)
      },
      immediate: true
    },
    currentTab () {
      this.getHosts()
    },
    editHostDialogVisible (newVal, oldVal) {
      if (!newVal) {
        this.allHost = []
      } else {
        this.getHosts()
      }
    }
  }
}
</script>
<style lang="less" scoped>
.host-select {
  .search {
    width: 300px;
    margin: 20px 0;
  }
}
</style>
