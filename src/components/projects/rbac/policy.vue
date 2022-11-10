<template>
  <div class="rbac-policy">
    <el-alert type="info" :closable="false" description="用户与策略关联后，即可获得策略描述的权限"></el-alert>
    <el-table :data="policies" style="width: 100%; margin-top: 15px;">
      <el-table-column prop="name" label="策略名称"></el-table-column>
      <el-table-column prop="description" label="描述信息"></el-table-column>
      <el-table-column prop="prop" label="修改时间">
        <template slot-scope="{ row }">
          <span>{{ $utils.convertTimestamp(row.update_time) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template slot-scope="{ $index }">
          <el-button type="primary" size="small" plain @click="viewPolicy($index)">查看</el-button>
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
      ).catch(error => window.console.log(error))
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
        { title: '项目', url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: '权限管理', url: '' },
        { title: '策略管理', url: '' }
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
