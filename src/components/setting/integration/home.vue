<template>
  <div class="integration-home">
    <div class="tab-container">
      <el-tabs @tab-click="changeTab" type="card" style="height: 200px;" v-model="currentTab">
        <el-tab-pane name="account" :label="$t(`sysSetting.integration.accountsTab`)">
          <keep-alive>
            <Account v-if="currentTab === 'account'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="project" :label="$t(`sysSetting.integration.projectTab`)">
          <keep-alive>
            <Project v-if="currentTab === 'project'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="code" :label="$t(`sysSetting.integration.gitProvidersTab`)">
          <keep-alive>
            <Code v-if="currentTab === 'code'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane v-if="hasPlutus" name="config" :label="$t(`sysSetting.integration.configsTab`)">
          <keep-alive>
            <ConfigManage v-if="currentTab === 'config'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="jenkins" :label="$t(`sysSetting.integration.jenkinsTab`)">
          <keep-alive>
            <Jenkins v-if="currentTab === 'jenkins'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="sonar" :label="$t(`sysSetting.integration.sonarTab`)">
          <keep-alive>
            <Sonar v-if="currentTab === 'sonar'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="approval" :label="$t(`sysSetting.integration.approvalSystemTab`)" v-if="hasPlutus">
          <keep-alive>
            <Approval v-if="currentTab === 'approval'" />
          </keep-alive>
        </el-tab-pane>
        <el-tab-pane name="external" :label="$t(`sysSetting.integration.otherSystemTab`)">
          <keep-alive>
            <External v-if="currentTab === 'external'" />
          </keep-alive>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import Account from './account.vue'
import Project from './project.vue'
import Code from './code.vue'
import ConfigManage from './configManage.vue'
import Jenkins from './jenkins.vue'
import Sonar from './sonar.vue'
import External from './external.vue'
import Approval from './approval.vue'
import { mapState } from 'vuex'

export default {
  name: 'integration',
  components: {
    Account,
    Project,
    Code,
    ConfigManage,
    Jenkins,
    Sonar,
    External,
    Approval
  },
  data () {
    return {
      currentTab: 'account'
    }
  },
  methods: {
    showCurrentTab () {
      const currentTab = this.$route.query.currentTab
      if (currentTab) {
        this.currentTab = currentTab
      }
    },
    changeTab (detail) {
      this.$router.replace({
        path: '/v1/system/integration',
        query: { currentTab: detail.name }
      })
    }
  },
  computed: {
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    })
  },
  mounted () {
    bus.$emit('set-topbar-title', { title: this.$t(`sidebarMenu.integration`), breadcrumb: [] })
    this.showCurrentTab()
  }
}
</script>

<style lang="less" >
.integration-home {
  position: relative;
  flex: 1;
  height: 100%;
  padding: 15px 30px;
  overflow: auto;

  .sync-container {
    padding-top: 15px;
    padding-bottom: 15px;

    .switch-span {
      display: inline-block;
      height: 20px;
      margin-right: 5px;
      margin-left: 10px;
      font-weight: 500;
      font-size: 14px;
      line-height: 20px;
      vertical-align: middle;
      transition: color 0.5s;
    }
  }
}
</style>
