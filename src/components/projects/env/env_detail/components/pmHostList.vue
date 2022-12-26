<template>
  <div class="host-select">
    <el-dialog title="选择主机资源" :visible.sync="editHostDialogVisible" width="50%" center>
      <div class="tab-container">
        <el-tabs v-model="currentTab" type="card">
          <el-tab-pane v-for="item in tabList" :name="item.name" :label="item.label" :key="item.name">
              <pmHostItem
                :ref="'hostItemRef'+ item.name"
                :currentPmServiceData="currentPmServiceData"
                :currentTab="currentTab"
                :editHostDialogVisible="editHostDialogVisible"
              />
          </el-tab-pane>
        </el-tabs>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="editHostDialogVisible = false">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" size="small" :disabled="currentPmServiceData.env_configs && currentPmServiceData.env_configs.length === 0" @click="bindHost">{{$t(`global.confirm`)}}</el-button>
      </span>
    </el-dialog>
  </div>
</template>
<script>
import { addHostToPmEnvAPI } from '@api'
import pmHostItem from './pmHostItem.vue'
export default {
  name: 'pmHostList',
  props: {
    currentPmServiceData: {
      type: Object,
      default: function () {
        return {}
      }
    }
  },
  data () {
    return {
      editHostDialogVisible: false,
      currentTab: 'project',
      tabList: [
        {
          label: '项目资源',
          name: 'project'
        },
        {
          label: '系统资源',
          name: 'system'
        }
      ],
      envConfigs: []
    }
  },
  components: { pmHostItem },

  methods: {
    bindHost () {
      const refs = this.$refs.hostItemRefproject.concat(this.$refs.hostItemRefsystem)
      const hostIds = []
      refs.forEach((item, index) => {
        if (index === 0) {
          item.allHost = item.projectList
        } else {
          item.allHost = item.systemList
        }
        item.allHost.forEach(host => {
          if (item.serviceHosts.indexOf(host.id) >= 0) {
            hostIds.push(host.id)
          }
        })
      })
      const projectName = this.currentPmServiceData.product_name
      let envConfigs = []
      envConfigs = [
        {
          env_name: this.currentPmServiceData.env_name,
          host_ids: hostIds
        }
      ]
      const payload = {
        product_name: this.currentPmServiceData.product_name,
        service_name: this.currentPmServiceData.service_name,
        env_name: this.currentPmServiceData.env_name,
        revision: this.currentPmServiceData.revision,
        env_configs: envConfigs
      }
      addHostToPmEnvAPI(projectName, payload).then(res => {
        this.$message({
          message: '主机资源修改成功',
          type: 'success'
        })
        this.$emit('success')
        this.editHostDialogVisible = false
      })
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
