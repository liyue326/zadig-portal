<template>
  <div>
    <el-alert type="info" :closable="false" description="项目角色管理，主要用于定义项目的角色"></el-alert>
    <div class="sync-container">
      <el-button plain size="small" @click="addRole" type="primary">添加角色</el-button>
    </div>

    <el-table v-loading="loading" row-key="id" :data="roles" style="width: 100%;">
      <el-table-column label="角色名称">
        <template slot-scope="scope">
          <span>{{scope.row.name}}</span>
        </template>
      </el-table-column>
      <el-table-column label="角色类型">
        <template slot-scope="scope">
          <span>{{scope.row.isPublic ? '公共角色': '私有角色'}}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template slot-scope="scope">
          <el-button @click="editrole(scope.row)" v-if="scope.row.name !== 'admin' || !scope.row.isPublic"  size="mini" type="primary" plain>编辑</el-button>
          <el-button @click="deleteRole(scope.row)"  v-if="scope.row.name !== 'admin' || !scope.row.isPublic"  size="mini" type="danger" plain>删除</el-button>
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
      const roles = await queryRoleAPI(projectName).catch(error => window.console.log(error))
      if (roles) {
        this.roles = roles
      }
      this.loading = false
    },
    async deleteRole (row) {
      const projectName = this.projectName
      this.$confirm('此角色的成员权限也会被删除，请谨慎操作', '确认删除此角色?', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        let res = null
        if (row.isPublic) {
          res = await deletePublicRoleAPI(row.name, projectName).catch(error => window.console.log(error))
        } else {
          res = await deleteRoleAPI(row.name, projectName).catch(error => window.console.log(error))
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
    bus.$emit(`set-topbar-title`, { title: '', breadcrumb: [{ title: '项目', url: '/v1/projects' }, { title: this.projectName, isProjectName: true, url: `/v1/projects/detail/${this.projectName}/detail` }, { title: '权限管理', url: '' }, { title: '角色管理', url: '' }] })
  }
}
</script>
<style lang="less" scoped>
.sync-container {
  margin-top: 15px;
  margin-bottom: 15px;
}
</style>
