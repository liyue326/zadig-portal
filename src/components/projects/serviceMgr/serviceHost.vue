<template>
  <div class="tab">
    <div class="policy">
      <el-button type="primary" size="small" @click="showPolicyDrawer = true" plain>{{$t('services.common.policySection')}}</el-button>
    </div>
    <el-tabs type="card" :value="envName" @tab-click="tabChange">
      <el-tab-pane v-for="item in envNameList" :key="item.envName" :label="item.envName" :name="item.envName"></el-tab-pane>
    </el-tabs>
    <ServiceBuild v-if="envName" :envName="envName" :serviceName="serviceName" class="serviceBuild" />
    <el-drawer :title="$t('services.common.policySection')" custom-class="policy-drawer" :visible.sync="showPolicyDrawer" direction="rtl" size="600px" destroy-on-close>
      <Policy @closeDrawer="showPolicyDrawer=false" />
    </el-drawer>
  </div>
</template>
<script>
import ServiceBuild from '@/components/projects/common/hosting/serviceBuild'
import Policy from './k8s/container/policy.vue'

import { listProductAPI } from '@/api'
export default {
  name: 'service_host',
  components: {
    ServiceBuild,
    Policy
  },
  data () {
    return {
      envName: '',
      serviceName: null,
      envNameList: [],
      showPolicyDrawer: false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    tabChange (tab) {
      this.envName = tab.name
    },
    async getEnvNameList () {
      const envNameList = await listProductAPI(this.projectName)
      envNameList.forEach(element => {
        element.envName = element.name
      })
      this.envNameList = envNameList
    }
  },
  async created () {
    this.serviceName = this.$route.query.serviceName
    await this.getEnvNameList()
    if (this.$route.query.envName) {
      this.envName = this.$route.query.envName
    } else if (this.envNameList.length) {
      this.envName = this.envNameList[0].envName
    }
  }
}
</script>
<style lang="less" scoped>
.tab {
  margin: 10px 10px 40px;

  .policy {
    text-align: right;

    /deep/.el-button {
      writing-mode: vertical-rl;
      margin-bottom: -12px;
      padding: 12px 5px;
      white-space: initial;
    }
  }

  .serviceBuild {
    height: calc(~'100vh - 220px');
  }

  /deep/.policy-drawer {
    .el-drawer__header {
      margin-bottom: 12px;
    }

    .el-drawer__body {
      box-sizing: border-box;
      padding: 0 10px 20px;
    }
  }
}
</style>
