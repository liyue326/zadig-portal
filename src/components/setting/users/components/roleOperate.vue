<template>
  <el-dialog
    :title=" isEdit ? this.$t('global.edit'):this.$t('global.add') "
    custom-class="create-user-dialog"
    :close-on-click-modal="false"
    :visible.sync="isShowDialogRoleVisible"
  >
    <el-form :model="form" @submit.native.prevent ref="roleForm" :rules="rules" label-position="left" label-width="125px" class="primary-form">
      <el-form-item :label="$t('sysSetting.users.roleName')" prop="name">
        <el-input size="small" v-model="form.name" :disabled="isEdit"></el-input>
      </el-form-item>
      <el-form-item :label="$t('sysSetting.users.roleDesc')" prop="account">
        <el-input size="small" v-model="form.desc"></el-input>
      </el-form-item>
      <el-form-item :label="$t('sysSetting.users.permissionList')" prop="permissions" label-width="125px">
        <div class="permissions-group" v-for="(group,group_index) in permissionGroups" :key="group_index">
          <el-checkbox
            :label="group.resource"
            :key="group.resource"
            :value="calculatePermissionGroupsCheckedState(group.rules)"
            @change="handlePermissionGroupChange(group.rules)"
            :indeterminate="isIndeterminate(group.resource,group.rules)"
          >{{group.alias}}</el-checkbox>
          <div class="sub-permissions">
            <el-checkbox-group v-model="form.permissions">
              <span  v-for="(subPermission,sub_index) in group.rules" :key="sub_index" >
                <span style="margin-left: 20px; font-size: 14px;" v-if="subPermission.parent">{{subPermission.parent}}</span>
                <el-checkbox
                  class="sub-permissions-checkbox"
                  :label="subPermission.uniqueAction"
                >{{(subPermission.parent|| subPermission.isChild) ? subPermission.alias.split('|')[1]:subPermission.alias}}</el-checkbox>
                <br v-if="subPermission.parent" />
              </span>
            </el-checkbox-group>
          </div>
        </div>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" size="small" @click="submit" class="start-create">{{$t(`global.confirm`)}}</el-button>
      <el-button plain native-type="submit" size="small" @click="isShowDialogRoleVisible = false">{{$t(`global.cancel`)}}</el-button>
    </div>
  </el-dialog>
</template>
<script>
import {
  getRolePolicyListAPI,
  addSystemRoleAPI,
  queryRoleDetailAPI,
  updateRoleAPI
} from '@api'
import { cloneDeep } from 'lodash'
import store from 'storejs'

const resources = {}
const initFormData = {
  name: '',
  desc: '',
  permissions: []
}
export default {
  name: 'RoleOperate',
  props: {
    title: {
      type: String,
      default: ''
    },
    currentRole: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data () {
    return {
      permission: [],
      isShowDialogRoleVisible: false,
      isEdit: false,
      permissionGroups: [],
      form: {
        name: '',
        desc: '',
        permissions: [],
        isPublic: false
      }
    }
  },
  computed: {
    rules () {
      const validateRoleName = (rule, value, callback) => {
        if (typeof value === 'undefined' || value === '') {
          callback(new Error(this.$t('sysSetting.users.inputRoleName')))
        } else {
          if (!/^[a-z0-9-]+$/.test(value)) {
            callback(new Error(this.$t('sysSetting.users.roleNameCheck')))
          } else {
            callback()
          }
        }
      }
      return {
        name: { required: true, trigger: 'change', validator: validateRoleName }
      }
    }
  },
  mounted () {
    this.getPolicyDefinitions()
  },
  methods: {
    initNewForm () {
      this.form = cloneDeep(initFormData)
    },
    async getRoleDetail (role) {
      let res = null
      res = await queryRoleDetailAPI(role.name, '*').catch(error =>
        console.log(error)
      )
      res.rules.forEach(item => {
        if (item.kind === 'resource') {
          item.verbs.forEach(action => {
            this.form.permissions.push(`${item.resources[0]}/${action}`)
          })
        }
      })
    },
    handlePermissionGroupChange (rules) {
      for (let i = 0; i < rules.length; i++) {
        if (this.form.permissions.includes(rules[i].uniqueAction)) {
          const index = this.form.permissions.indexOf(rules[i].uniqueAction)
          this.form.permissions.splice(index, 1)
        } else {
          const res = rules.map(item => item.uniqueAction)
          this.form.permissions = _.uniq(this.form.permissions.concat(res))
          return
        }
      }
    },
    calculatePermissionGroupsCheckedState (rules) {
      for (const rule of rules) {
        if (!this.form.permissions.includes(rule.uniqueAction)) {
          return false
        }
      }
      return true
    },
    isIndeterminate (resource, rules) {
      for (const rule of rules) {
        if (this.form.permissions.includes(rule.uniqueAction)) {
          resources[resource] = true
          return true
        }
      }
      resources[resource] = false

      return false
    },
    async getPolicyDefinitions () {
      const res = await getRolePolicyListAPI('system').catch(error =>
        console.log(error)
      )
      if (res) {
        res.forEach(group => {
          group.rules.forEach((item, index) => {
            item.uniqueAction = `${group.resource}/${item.action}`
            item.resource = group.resource
            item.parent = item.alias.includes('|')
              ? item.alias.split('|')[0]
              : null
            if (item.alias.includes(group.rules[index - 1] && group.rules[index - 1].parent)) {
              item.parent = ''
              item.isChild = true
            }
          })
        })
        this.permissionGroups = res
      }
    },
    async submit () {
      const res = await this.$refs.roleForm.validate()
      const resource = []
      Object.keys(resources).forEach(i => {
        if (resources[i]) {
          resource.push(i)
        }
      })

      const rules = []
      const permissions = this.form.permissions
      if (res) {
        const resourceMap = {}
        for (let index = 0; index < permissions.length; index++) {
          const element = permissions[index]
          const resource = element.split('/')[0]
          const action = element.split('/')[1]
          resourceMap[resource] = resourceMap[resource] || []
          resourceMap[resource].push(action)
        }
        for (const resource in resourceMap) {
          if (Object.hasOwnProperty.call(resourceMap, resource)) {
            const element = resourceMap[resource]
            rules.push({
              kind: 'resource',
              resources: [resource],
              verbs: element
            })
          }
        }
        if (this.isEdit) {
          let result = null
          const { name, desc } = this.form
          const params = {
            userID: store.get('userInfo').uid,
            rules: rules,
            projectName: '*',
            name,
            desc
          }
          result = await updateRoleAPI(params).catch(error =>
            console.log(error)
          )
          if (result) {
            this.$message.success(this.$t('sysSetting.users.updateRoleSuccess'))
            this.isShowDialogRoleVisible = false
            this.$emit('refreshUserList')
          }
        } else {
          const { name, desc } = this.form
          const result = await addSystemRoleAPI({
            name,
            desc,
            rules: rules
          }).catch(error => console.log(error))
          if (result) {
            this.$message.success(this.$t('sysSetting.users.addRoleSuccess'))
            this.isShowDialogRoleVisible = false
            this.$emit('refreshUserList')
          }
        }
      }
    }
  },
  watch: {
    isShowDialogRoleVisible: {
      handler: function (newVal, oldVal) {
        if (newVal && this.currentRole) {
          this.isEdit = true
          this.getRoleDetail(this.currentRole)
          this.form.name = this.currentRole.name
          this.form.desc = this.currentRole.desc
        } else {
          this.isEdit = false
          this.initNewForm()
        }
      },
      immediate: true
    }
  }
}
</script>
<style lang="less" scoped>
.permissions-group {
  .sub-permissions {
    .sub-permissions-checkbox {
      display: inline-block;
      margin-left: 25px;
    }
  }
}
</style>
