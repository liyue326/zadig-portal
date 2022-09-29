<template>
  <div class="stage-operate">
    <el-form
      :model="form"
      :rules="rules"
      ref="ruleForm"
      :label-width="formLabelWidth"
      size="small"
      @keydown.enter.native="$emit('submitEvent')"
      @submit.native.prevent
    >
      <el-form-item label="阶段名称" prop="name">
        <el-input v-model="form.name" size="small"></el-input>
      </el-form-item>
      <el-form-item label="并发执行" prop="parallel">
        <el-switch v-model="form.parallel" size="small"></el-switch>
      </el-form-item>
      <el-form-item label="前置步骤"></el-form-item>
      <el-form-item label="人工审核" prop="approval.enabled" v-if="form.approval">
        <el-switch v-model="form.approval.enabled" size="small"></el-switch>
      </el-form-item>
      <div v-if="form.approval.enabled">
        <el-form-item label="超时时间" prop="approval.timeout">
          <el-input v-model.number="form.approval.timeout" size="small" type="number" :min="0">
            <span slot="suffix">分钟</span>
          </el-input>
        </el-form-item>
        <el-form-item label="审核人">
          <el-select
            size="small"
            v-model="form.approval.approve_users"
            multiple
            filterable
            remote
            reserve-keyword
            placeholder="请输入关键词"
            :remote-method="getUserList"
            :loading="loading"
            value-key="user_id"
            style="width: 100%;"
          >
            <el-option v-for="user in userList" :key="user.user_id" :value="user" :label="user.user_name">
              <span v-if="user.identity_type">
                <i class="iconfont" :class="'icon'+user.identity_type"></i>
                <span>{{user.user_name ? `${user.user_name}(${user.account})` : user.account}}</span>
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="需要审核人数">
          <el-input v-model.number="form.approval.needed_approvers" type="number" :min="0" size="small"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.approval.description" placeholder="审核通过后才可继续执行" size="small"></el-input>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script>
import { getUsersAPI } from '@api'
import { cloneDeep } from 'lodash'

export default {
  name: 'StageOperate',
  data () {
    return {
      formLabelWidth: '135px',
      rules: {
        name: [
          {
            required: true,
            trigger: 'blur',
            validator: this.validateName,
            workflowInfo: this.workflowInfo
          }
        ]
      },
      userList: [],
      form: {
        name: '',
        parallel: true,
        approval: {
          enabled: false,
          approve_users: [],
          timeout: null,
          needed_approvers: null,
          description: ''
        },
        jobs: []
      },
      loading: false
    }
  },
  props: {
    stageInfo: {
      type: Object,
      default: () => ({})
    },
    type: {
      type: String,
      default: 'add'
    },
    workflowInfo: {
      type: Object,
      default: () => ({})
    }
  },
  created () {
    this.getUserList()
  },
  methods: {
    getUserList (val) {
      const payload = {
        page: 1,
        per_page: 20,
        name: val
      }
      this.loading = true
      getUsersAPI(payload).then(res => {
        this.userList = res.users.map(item => {
          const obj = {
            user_id: item.uid,
            user_name: item.name,
            account: item.account,
            identity_type: item.identity_type
          }
          return obj
        })
        this.loading = false
      })
    },
    validateName (rule, value, callback) {
      const stageNames = rule.workflowInfo.stages.map(stage => stage.name)
      if (!value) {
        callback(new Error('请填写阶段名称'))
      } else if (this.type === 'add' && stageNames.includes(value)) {
        callback(new Error('阶段名称不能重复'))
      } else {
        callback()
      }
    },
    validate () {
      return this.$refs.ruleForm.validate()
    },
    reset () {
      this.form = {
        name: '',
        parallel: true,
        approval: {
          enabled: false,
          approve_users: [],
          timeout: null,
          needed_approvers: null,
          description: ''
        },
        jobs: []
      }
    },
    getData () {
      return this.form
    }
  },
  watch: {
    stageInfo: {
      handler (val) {
        if (this.type === 'edit') {
          this.form = cloneDeep(val)
        }
      },
      immediate: true
    },
    type (newVal, oldVal) {
      if (newVal === 'add') {
        this.reset()
      }
    }
  }
}
</script>
