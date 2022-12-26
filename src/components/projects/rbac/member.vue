<template>
  <div>
    <el-alert type="info" :closable="false" :description="$t('project.rbac.membersManagementTip')"></el-alert>
    <div class="btn-container">
      <el-button plain size="small" type="primary" @click="$refs.addRoleBind.addUserFormVisible = true">{{$t('project.rbac.addMember')}}</el-button>
    </div>

    <el-table v-loading="loading" row-key="id" :data="members" style="width: 100%;" class="users-container">
      <el-table-column :label="$t('project.rbac.projectMember')">
        <template slot-scope="scope">
          <div class="name-listing-details">
            <!-- Logo -->
            <div class="avator">
               <span class="iconfont iconvery-user"></span>
            </div>
            <!-- Details -->
            <div class="name-listing-description">
              <h3 v-if="scope.row.uid === '*'" class="name-listing-title">{{$t('project.rbac.projectMember')}}</h3>
              <h3
                v-else
                class="name-listing-title"
              >{{ scope.row.username ? `${scope.row.username}(${scope.row.account})`: scope.row.account }}</h3>
              <!-- Name Listing Footer -->
              <div class="name-listing-footer">
                <ul>
                  <li v-if="scope.row.identity_type">
                    <i class="iconfont" :class="'icon'+scope.row.identity_type"></i>
                    {{identityTypeMap[scope.row.identity_type]}}
                  </li>
                  <li v-if="scope.row.email">
                    <i class="el-icon-message"></i>
                    <a :href="`mailto:${scope.row.email}`">{{scope.row.email}}</a>
                  </li>
                  <li v-if="scope.row.phone">
                    <i class="el-icon-mobile"></i>
                    <a :href="`tel:${scope.row.phone}`">{{scope.row.phone}}</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('project.rbac.role')">
        <template slot-scope="{ row }">
          <div v-if="row.uid === '*'">
            {{ row.role }}
            <span v-if="row.type === 'system'">{{$t('project.rbac.systemBuiltIn')}}</span>
          </div>
          <div v-else>
            <div class="role-content" v-show="!row.editRole">
              <div :class="{'role-content-left': row.roles.length}">
                <div v-for="(role, index) in row.roles" :key="index">
                  <span>{{ role.role }}</span>
                  <span v-if="role.type === 'system'">{{$t('project.rbac.systemBuiltIn')}}</span>
                </div>
              </div>
              <div>
                <i class="role-icon el-icon-edit-outline" @click="row.editRole = true"></i>
              </div>
            </div>
            <div class="role-content" v-show="row.editRole">
              <div class="role-content-left">
                <el-select v-model="row.updatedRoles" :placeholder="$t('project.rbac.selectRole')" size="small" multiple>
                  <el-option
                    v-for="(item, index) in rolesFiltered"
                    :key="index"
                    :label="item.name"
                    :value="item.name"
                  >{{item.name}} {{item.isPublic ?$t('project.rbac.systemBuiltIn'): ''}}</el-option>
                </el-select>
              </div>
              <div>
                <i
                  class="role-icon role-close el-icon-circle-close"
                  @click="row.editRole = false;row.updatedRoles=row.roles.map(role => role.role);"
                ></i>
                <i class="role-icon el-icon-circle-check" @click="updateRoles(row)"></i>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('project.rbac.policy')">
        <template slot-scope="{ row }">
          <div v-if="row.uid === '*'" :class="{'show-gray': row.hasSystemPolicy}">
            {{ row.policy || '-' }}
            <span v-if="row.hasSystemPolicy">{{$t('project.rbac.systemBuiltIn')}}</span>
          </div>
          <div v-else>
            <div v-if="!row.policies.length">-</div>
            <div v-for="(policy, index) in row.policies" :key="index" :class="{'show-gray': policy.type === 'system'}">
              <span>{{ policy.policy }}</span>
              <span v-if="policy.type === 'system'">{{$t('project.rbac.systemBuiltIn')}}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t(`global.operation`)" width="100px">
        <template slot-scope="{ row }">
          <el-tooltip effect="dark" :content="$t('project.rbac.removePolicyTooltip')" placement="top">
            <span>
              <el-button v-if="row.hasSystemPolicy" size="mini" type="info" plain disabled>{{$t('project.rbac.remove')}}</el-button>
            </span>
          </el-tooltip>
          <el-tooltip effect="dark" :content="$t('project.rbac.removeReadOnlyTooltip')" placement="top">
            <span>
              <el-button v-if="row.readOnly" size="mini" type="info" plain disabled>{{$t('project.rbac.remove')}}</el-button>
            </span>
          </el-tooltip>
          <el-button v-if="!row.hasSystemPolicy && !row.readOnly" size="mini" type="danger" @click="handleDelete(row)" plain>{{$t('project.rbac.remove')}}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <AddRoleBind :projectName="projectName" :getMembers="getRoleBindings" :rolesFiltered="rolesFiltered" ref="addRoleBind" />
  </div>
</template>
<script>
import bus from '@utils/eventBus'
import AddRoleBind from './addRoleBinding.vue'
import {
  queryRoleBindingsAPI,
  queryRoleAPI,
  queryPublicRoleAPI,
  deleteRoleBindingsAPI,
  updateMutiRolebindingsAPI
} from '@/api'

import { cloneDeep } from 'lodash'

export default {
  name: 'member',
  components: {
    AddRoleBind
  },
  props: {
    projectName: String
  },
  data () {
    this.cloneDeep = cloneDeep
    return {
      members: [],
      rolesFiltered: [],
      loading: false
    }
  },
  computed: {
    isPublic () {
      const project = this.$store.getters.projectList.find(
        project => project.name === this.projectName
      )
      return project ? project.public : false
    },
    identityTypeMap () {
      return {
        github: 'GitHub',
        system: this.$t('project.rbac.identityTypeSystem'),
        ldap: 'OpenLDAP',
        oauth: 'OAuth'
      }
    }
  },
  methods: {
    updateRoles (row, isDelete = false) {
      const payload = row.updatedRoles.map(role => {
        return {
          uid: row.uid,
          role: role,
          type: 'custom',
          preset: this.rolesFiltered.find(cuRole => cuRole.name === role).isPublic || false
        }
      })
      updateMutiRolebindingsAPI(this.projectName, row.uid, payload).then(() => {
        this.$message.success(isDelete ? '删除成功!' : '更新用户角色成功！')
        this.getRoleBindings()
        row.editRole = false
      })
    },
    async handleDelete (row) {
      this.$confirm(this.$t('project.rbac.confirmToDeleteMember'), this.$t(`global.confirm`), {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      }).then(() => {
        if (row.uid !== '*') {
          this.updateRoles(
            {
              uid: row.uid,
              updatedRoles: []
            },
            true
          )
        } else {
          deleteRoleBindingsAPI(row.name, this.projectName).then(() => {
            this.$message({
              message: '删除成功',
              type: 'success'
            })
            this.getRoleBindings()
          })
        }
      })
    },
    async getRoleBindings () {
      const res = await queryRoleBindingsAPI(this.projectName).catch(error =>
        console.log(error)
      )
      if (res) {
        const members = res
          .filter(member => member.uid !== '*')
          .map(member => {
            member.editRole = false
            member.updatedRoles = member.roles.map(role => role.role)
            member.hasSystemPolicy = member.policies.find(
              policy => policy.type === 'system'
            )
            return member
          })

        const allMember = res.find(member => member.uid === '*')
        if (allMember) {
          allMember.roles.forEach(role => {
            if (this.isPublic && role.role === 'read-only') {
              role.readOnly = true
            }
            members.push(role)
          })
          allMember.policies.forEach(policy => {
            if (policy.type === 'system') {
              policy.hasSystemPolicy = true
            }
            members.push(policy)
          })
        }
        this.members = members
      }
    },
    async getRole () {
      const roles = await queryRoleAPI(this.projectName).catch(error =>
        console.log(error)
      )
      const publicRoles = await queryPublicRoleAPI(
        this.projectName
      ).catch(error => console.log(error))
      if (roles && publicRoles) {
        this.rolesFiltered = roles
        publicRoles.forEach(item => {
          this.rolesFiltered.push({ ...item, isPublic: true })
        })
      }
    }
  },
  created () {
    this.getRoleBindings()
    this.getRole()
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
        { title: this.$t('project.rbac.membersManagement'), url: '' }
      ]
    })
  }
}
</script>
<style lang="less" scoped>
.btn-container {
  margin-top: 15px;
  margin-bottom: 15px;
}

.users-container {
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
      font-size: 24px;
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
          font-size: 13px;

          .iconfont {
            font-size: 14px;
          }
        }
      }
    }
  }

  .role-content {
    display: flex;
    align-items: center;

    .role-content-left {
      margin-right: 20px;
    }

    .role-icon {
      color: @themeColor;
      font-size: 16px;
      cursor: pointer;

      &.role-close {
        margin-right: 5px;
        color: #f56c6c;
      }
    }
  }

  .show-gray {
    color: #99a9bf;
  }
}
</style>
