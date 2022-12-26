<template>
  <el-dialog class="form" :title="$t('project.rbac.addMember')" width="550px" :visible.sync="addUserFormVisible">
    <el-form :model="form" ref="form" :rules="formRules" label-position="left" label-width="100px">
      <el-form-item :label="$t('project.rbac.username')" prop="uids">
        <el-select class="select" v-model="form.uids" filterable multiple remote :remote-method="remoteMethod" :loading="userSearchLoading" size="small" :placeholder="$t('project.rbac.inputUsernameToSearch')">
          <el-option :label="$t('project.rbac.allUsers')" value="*">
            <span>{{$t('project.rbac.allUsers')}}</span>
          </el-option>
          <el-option
            v-for="user in users"
            :key="user.uid"
            :label="user.name ? `${user.name}(${user.account})` : user.account"
            :value="user.uid"
          >
            <span v-if="user.identity_type">
              <i class="iconfont" :class="'icon'+user.identity_type"></i>
              <span>{{user.name ? `${user.name}(${user.account})` : user.account}}</span>
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('project.rbac.roleName')" prop="name">
        <el-select class="select" v-model="form.name" filterable size="small" :placeholder="$t('project.rbac.inputRoleNameToSearch')">
          <el-option
            v-for="item in rolesFiltered"
            :key="item.name"
            :label="item.name"
            :value="item.name"
          >{{item.name}} {{item.isPublic ?$t('project.rbac.systemBuiltIn'): ''}}</el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button size="small" @click="addUserFormVisible = false">{{$t(`global.cancel`)}}</el-button>
      <el-button size="small" @click="submit()" type="primary">{{$t(`global.confirm`)}}</el-button>
    </div>
  </el-dialog>
</template>
<script>
import { usersAPI, addRoleBindingsAPI } from '@/api'
export default {
  name: 'addRoleBind',
  props: {
    projectName: String,
    rolesFiltered: Array,
    getMembers: Function
  },
  data () {
    return {
      addUserFormVisible: false,
      userSearchLoading: false,
      users: [],
      form: {
        uids: [],
        name: 'read-project-only'
      }
    }
  },
  computed: {
    formRules () {
      return {
        uids: [
          {
            type: 'array',
            required: true,
            message: this.$t('project.rbac.selectUser'),
            trigger: 'change'
          }
        ],
        name: [
          {
            type: 'string',
            required: true,
            message: this.$t('project.rbac.selectRole'),
            trigger: 'change'
          }
        ]
      }
    }
  },
  methods: {
    submit () {
      this.$refs.form.validate(valid => {
        if (valid) {
          this.addMember()
        }
      })
    },
    getUsers () {
      const projectName = this.projectName
      const payload = {
        page: 1,
        per_page: 200
      }
      usersAPI(payload, projectName).then(res => {
        this.users = res.users
      })
    },
    remoteMethod (query) {
      const projectName = this.projectName
      if (query !== '') {
        this.userSearchLoading = true
        const payload = {
          name: query
        }
        usersAPI(payload, projectName).then(res => {
          this.userSearchLoading = false
          this.users = res.users
        })
      } else {
        this.getUsers()
      }
    },
    async addMember () {
      const { uids, name } = this.form
      const role = this.rolesFiltered.find(item => item.name === name)
      const payload = []
      uids.forEach(uid => {
        payload.push({
          uid: uid,
          role: name,
          preset: role.isPublic ? role.isPublic : false,
          type: 'custom'
        })
      })
      const res = await addRoleBindingsAPI(
        payload,
        this.projectName
      ).catch(error => cosnole.log(error))
      if (res) {
        this.$message({
          message: '添加成员成功',
          type: 'success'
        })
        await this.getMembers()
        this.addUserFormVisible = false
        this.$refs.form.resetFields()
      }
    }
  },
  created () {
    this.getUsers()
    if (this.$route.query.addRole) {
      setTimeout(() => {
        this.addUserFormVisible = true
        this.$router.replace({ query: {} })
      }, 180) // To slow down the visual changes too fast
    }
  }
}
</script>
<style lang="less" scoped>
.form {
  .el-form-item {
    &:last-child {
      margin-bottom: 0;
    }

    .select {
      width: 100%;
    }
  }
}
</style>
