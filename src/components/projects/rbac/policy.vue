<template>
  <div class="rbac-policy">
    <el-alert type="info" :closable="false" :description="$t('project.rbac.policyManagementTip')"></el-alert>
    <el-table :data="policies" style="width: 100%; margin-top: 15px;">
      <el-table-column prop="name" :label="$t('project.rbac.policyName')"></el-table-column>
      <el-table-column prop="description" :label="$t('project.rbac.policyDesc')"></el-table-column>
      <el-table-column prop="prop" :label="$t('project.rbac.policyModifiedTime')">
        <template slot-scope="{ row }">
          <span>{{ $utils.convertTimestamp(row.update_time) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t(`global.operation`)">
        <template slot-scope="{ $index }">
          <el-button type="primary" size="small" plain @click="viewPolicy($index)">{{$t('global.view')}}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <ViewPolicy :dialogFlag.sync="dialogFlag" :policyInfo="policyInfo" :policyMap="policyMap" />
  </div>
</template>

<script>
import bus from '@utils/eventBus'
import ViewPolicy from './viewPolicy.vue'
import { getAllPolicyAPI, queryPolicyDefinitionsAPI } from '@api'
export default {
  data () {
    return {
      policies: [],
      dialogFlag: false,
      policyInfo: {},
      policyMap: {}
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    async viewPolicy (index) {
      this.dialogFlag = true
      this.policyInfo = this.policies[index]
    },
    getAllPolicy () {
      getAllPolicyAPI(this.projectName).then(res => {
        this.policies = res || []
      })
    },
    async getPolicyDefinitions () {
      const res = await queryPolicyDefinitionsAPI(
        this.projectName
      ).catch(error => console.log(error))
      if (res) {
        const policyMap = {}
        res.forEach(re => {
          policyMap[re.resource] = re.alias
          re.rules.forEach(rule => {
            policyMap[rule.action] = rule.alias
          })
        })
        this.policyMap = policyMap
      }
    }
  },
  components: {
    ViewPolicy
  },
  created () {
    this.getAllPolicy()
    this.getPolicyDefinitions()
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: this.$t('project.rbac.permissionManagement'), url: '' },
        { title: this.$t('project.rbac.policyManagement'), url: '' }
      ]
    })
  }
}
</script>

<style lang="less" scoped>
.rbac-policy {
  background-color: inherit;
}
</style>
