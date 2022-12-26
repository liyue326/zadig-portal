<template>
  <div class="config-manage-container">
    <ConfigManage ref="opeConfig" :getConfigList="getConfigList" />
    <div class="tab-container">
      <el-alert type="info" :closable="false">
        支持集成 Nacos 和 Apollo 配置管理系统，详情可参考
        <el-link
          style="font-size: 14px; vertical-align: baseline;"
          type="primary"
          :href="`https://docs.koderover.com/zadig/settings/configsystem/apollo`"
          :underline="false"
          target="_blank"
        >{{$t(`global.helpDoc`)}}</el-link>
      </el-alert>

      <div class="sync-container">
        <el-button type="primary" size="small" @click="handleConfig('add')" plain>{{$t(`global.add`)}}</el-button>
      </div>
      <el-table :data="configList" style="width: 100%;">
        <el-table-column label="访问地址">
          <template slot-scope="{ row }">
            <i :class="['iconfont config-icon', row.type === 'apollo' ? 'iconapollo' : 'iconnacos']"></i>
            <span>{{ row.server_address }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最后更新">
          <template slot-scope="{ row }">{{$utils.convertTimestamp(row.update_time)}}</template>
        </el-table-column>
        <el-table-column :label="$t(`global.operation`)" width="160">
          <template slot-scope="{ row }">
            <el-button type="primary" size="mini" plain @click="handleConfig('edit', row)">{{$t(`global.edit`)}}</el-button>
            <el-button type="danger" size="mini" @click="handleConfigDelete(row)" plain>{{$t(`global.delete`)}}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import ConfigManage from './components/configManage.vue'
import { getConfigManagesAPI, deleteConfigManageAPI } from '@api'

export default {
  data () {
    return {
      configList: []
    }
  },
  methods: {
    handleConfig (ope, data) {
      this.$refs.opeConfig.openDialog(ope, data)
    },
    getConfigList () {
      getConfigManagesAPI().then(res => {
        this.configList = res
      })
    },
    handleConfigDelete (data) {
      this.$confirm(`确定要删除这个配置吗？`, '确认', {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      }).then(() => {
        deleteConfigManageAPI(data.id).then(res => {
          this.getConfigList()
          this.$message({
            message: '配置删除成功',
            type: 'success'
          })
        })
      })
    }
  },
  created () {
    this.getConfigList()
  },
  components: {
    ConfigManage
  }
}
</script>

<style lang="less" scoped>
.config-icon {
  display: inline-block;
  width: 25px;

  &.iconnacos {
    font-size: 12px;
  }
}
</style>
