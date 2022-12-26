<template>
  <div>
    <el-alert type="info" :closable="false" :description="$t('project.rbac.rolesManagementTip')"></el-alert>
    <div class="sync-container">
      <el-button plain size="small" @click="addRole" type="primary">{{$t('project.rbac.addRole')}}</el-button>
    </div>

    <el-table v-loading="loading" row-key="id" :data="roles" style="width: 100%;">
      <el-table-column :label="$t('project.rbac.roleName')">
        <template slot-scope="scope">
          <span>{{scope.row.name}}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('project.rbac.roleType')">
        <template slot-scope="scope">
          <span>{{scope.row.isPublic ? $t('project.rbac.publicRole'): $t('project.rbac.privateRole')}}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t(`global.operation`)">
        <template slot-scope="scope">
          <el-button @click="editrole(scope.row)" v-if="scope.row.name !== 'admin' || !scope.row.isPublic"  size="mini" type="primary" plain>{{$t(`global.edit`)}}</el-button>
          <el-button @click="deleteRole(scope.row)"  v-if="scope.row.name !== 'admin' || !scope.row.isPublic"  size="mini" type="danger" plain>{{$t(`global.delete`)}}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <AddRole :projectName="projectName" :currentRole="currentRole" :getRoles="getRoles" ref="addRole" />
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import AddRole from './addRole.vue'
import { queryRoleAPI, deleteRoleAPI, deletePublicRoleAPI } from '@/api'

export default {
  name: 'member',
  components: {
    AddRole
  },
  props: {
    projectName: String
  },
  data () {
    return {
      roles: [],
      loading: false,
      currentRole: null
    }
  },
  methods: {
    editrole (role) {
      this.currentRole = role
      this.$refs.addRole.dialogRoleAddFormVisible = true
    },
    addRole (role) {
      this.currentRole = null
      this.$refs.addRole.dialogRoleAddFormVisible = true
    },
    async getRoles () {
      this.loading = true
      const projectName = this.projectName
      const roles = await queryRoleAPI(projectName).catch(error => console.log(error))
      if (roles) {
        this.roles = roles
      }
      this.loading = false
    },
    async deleteRole (row) {
      const projectName = this.projectName
      this.$confirm(this.$t('project.rbac.deleteRoleTip'), this.$t('project.rbac.confirmToDeleteRole'), {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      }).then(async () => {
        let res = null
        if (row.isPublic) {
          res = await deletePublicRoleAPI(row.name, projectName).catch(error => console.log(error))
        } else {
          res = await deleteRoleAPI(row.name, projectName).catch(error => console.log(error))
        }
        if (res) {
          this.$message.success('删除成功')
          this.getRoles()
        }
      })
    }
  },
  created () {
    this.getRoles()
    bus.$emit(`set-topbar-title`,
      {
        title: '',
        breadcrumb:
        [
          { title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' },
          { title: this.projectName, isProjectName: true, url: `/v1/projects/detail/${this.projectName}/detail` },
          { title: this.$t('project.rbac.permissionManagement'), url: '' },
          { title: this.$t('project.rbac.rolesManagement'), url: '' }
        ]
      })
  }
}
</script>
<style lang="less" scoped>
.sync-container {
  margin-top: 15px;
  margin-bottom: 15px;
}
</style>
