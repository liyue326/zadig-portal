<template>
  <div class="roles-overview-container">
    <el-alert type="info" :closable="false">
      <template>{{$t('sysSetting.users.roleTip')}}</template>
    </el-alert>
    <div class="search-user">
      <el-row :gutter="10">
        <el-col :span="3">
          <el-button @click="roleOperate('add',null)" size="small" plain type="primary">{{$t('global.add')}}</el-button>
        </el-col>
      </el-row>
    </div>
    <div
      v-loading="loading"
      :element-loading-text="$t(`global.loading`)"
      element-loading-spinner="iconfont iconfont-loading icongeren"
      class="roles-container"
    >
      <el-table :data="roles">
        <el-table-column prop="name" :label="$t('sysSetting.users.roleName')"></el-table-column>
        <el-table-column prop="desc" :label="$t('sysSetting.users.roleDesc')"></el-table-column>
        <el-table-column :label="$t(`global.operation`)" width="280">
          <template slot-scope="scope">
            <el-button :disabled="scope.row.name === 'admin'" @click="roleOperate('edit',scope.row)" type="primary" size="mini" plain>{{$t(`global.edit`)}}</el-button>
            <el-button :disabled="scope.row.name === 'admin'" @click="deleteRole(scope.row)" type="danger" size="mini" plain>{{$t(`global.delete`)}}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <Operate-role
      ref="roleOperate"
      :currentRole="currentRole"
      @refreshUserList="getRoleList()"
    />
  </div>
</template>

<script>
import {
  getRoleListAPI,
  deleteSystemRoleAPI,
  checkRegistrationAPI
} from '@api'
import OperateRole from './components/roleOperate.vue'
export default {
  components: {
    OperateRole
  },
  data () {
    return {
      roles: [],
      addUser: {
        account: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        isAdmin: false
      },
      editUser: {
        account: ''
      },
      isShowDialogRoleVisible: false,
      dialogAddUserVisible: false,
      searchInputVisible: true,
      registrationStatus: false,
      loading: true,
      currentRole: {}
    }
  },
  methods: {
    roleOperate (type, row) {
      this.currentRole = row
      this.$refs.roleOperate.isShowDialogRoleVisible = true
    },
    editUserInfo (user) {
      this.editUser = user
      this.$refs.editUserInfo.isShowDialogRoleVisible = true
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (valid) {
          this.upsertRole()
        }
      })
    },
    async getRoleList (page_size = 0, page_index = 0, keyword = '') {
      this.loading = true
      const payload = {
        page: page_index,
        per_page: page_size,
        name: keyword
      }
      const res = await getRoleListAPI(payload).catch(error => {
        console.log(error)
        this.loading = false
      })
      if (res) {
        this.roles = res
      }
      this.loading = false
    },
    deleteRole (row) {
      this.$confirm(
        this.$t('sysSetting.users.deleteRoleTip'),
        this.$t('sysSetting.users.deleteRoleConfirm', { name: row.name }),
        {
          confirmButtonText: this.$t(`global.confirm`),
          cancelButtonText: this.$t(`global.cancel`),
          type: 'warning'
        }
      )
        .then(() => {
          deleteSystemRoleAPI(row.name).then(res => {
            this.$message({
              type: 'success',
              message: this.$t('sysSetting.users.roleHasBeenDeleted')
            })
            this.getRoleList()
          })
        })
        .catch(error => {
          console.log(error)
          this.$message({
            type: 'info',
            message: this.$t('sysSetting.users.cancelDelete')
          })
        })
    },
    checkRegistration () {
      checkRegistrationAPI().then(res => {
        this.registrationStatus = res.enabled
      })
    }
  },
  created () {
    this.getRoleList()
    this.checkRegistration()
  }
}
</script>

<style lang="less" scoped>
.roles-overview-container {
  position: relative;
  flex: 1;
  font-size: 13px;

  .roles-container {
    .origin {
      .type {
        font-size: 20px;
      }
    }

    .name-listing-details {
      top: 0;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      padding: 0;

      .avator span {
        position: relative;
        margin-right: 10px;
        color: @themeColor;
        font-size: 25px;
      }

      .name-listing-description {
        .name-listing-title {
          margin: 0;
          color: #333;
          font-weight: 300;
          font-size: 16px;
        }
      }

      .name-listing-footer {
        position: relative;
        padding: 0;
        background-color: transparent;
        border-radius: 0 0 4px 4px;

        ul {
          margin: 0;
          padding: 0;
          list-style: none;

          li {
            display: inline-block;
            margin-right: 8px;
            color: #777;
            font-size: 14px;

            .iconfont {
              font-size: 14px;
            }
          }
        }
      }
    }

    .user-table-pagination {
      margin-top: 25px;
    }
  }

  .search-user {
    margin-top: 10px;
    margin-bottom: 15px;

    .text-title {
      margin-right: 15px;
      color: rgba(0, 0, 0, 0.65);
    }

    .search-member {
      .el-input {
        width: calc(~'100% - 80px');
      }
    }
  }
}
</style>

<style lang="less">
.create-user-dialog {
  width: 600px;

  .el-dialog__header {
    padding: 15px;
    text-align: center;
    border-bottom: 1px solid #e4e4e4;

    .el-dialog__close {
      font-size: 10px;
    }
  }

  .el-dialog__body {
    padding: 30px 48px 0;

    .el-form.primary-form {
      .el-form-item {
        margin-bottom: 16px;
      }
    }
  }
}
</style>
