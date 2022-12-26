<template>
  <el-dialog custom-class="edit-form-dialog" :title="(opeForm.id ? '编辑': '添加') + '配置管理系统'" :visible.sync="dialogVisible">
    <el-alert style="margin-bottom: 10px;" v-if="checkRes === 'fail'" :title="errorMessage" type="error" :closable="false" show-icon></el-alert>
    <el-form :model="opeForm" ref="opeForm" :rules="formRules" class="form" label-position="left" label-width="100px">
      <el-form-item label="系统类型">
        <el-select v-model="opeForm.type" @change="validate('checkConnection')">
          <el-option v-for="type in typeList" :key="type.value" :label="type.label" :value="type.value">
            <i class="config-icon iconfont" :class="[type.icon]"></i>
            <span>{{ type.label }}</span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="访问地址" prop="server_address">
        <el-input
          v-model="opeForm.server_address"
          :placeholder="`${opeForm.type.replace(/^\S/, s => s.toUpperCase())} 访问地址`"
          @change="validate('checkConnection')"
        ></el-input>
      </el-form-item>
      <el-form-item v-if="opeForm.type === 'apollo'" label="API Token" prop="auth_config.token">
        <el-input
          v-model="opeForm.auth_config.token"
          :suffix-icon="showCheckIcon"
          show-password
          type="password"
          placeholder="Apollo API Token"
          @change="validate('checkConnection')"
        ></el-input>
      </el-form-item>
      <div v-else-if="opeForm.type === 'nacos'">
        <el-form-item label="用户名" prop="auth_config.user_name">
          <el-input v-model="opeForm.auth_config.user_name" placeholder="Nacos 用户名" @change="validate('checkConnection')"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="auth_config.password">
          <el-input
            v-model="opeForm.auth_config.password"
            placeholder="Nacos 密码"
            show-password
            type="password"
            :suffix-icon="showCheckIcon"
            @change="validate('checkConnection')"
          ></el-input>
        </el-form-item>
      </div>
    </el-form>
    <div slot="footer">
      <el-button @click="dialogVisible = false" size="small">{{$t(`global.cancel`)}}</el-button>
      <el-button type="primary" :disabled="checkRes!=='pass'" @click="validate('save')" size="small">{{$t(`global.confirm`)}}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import {
  createConfigManageAPI,
  updateConfigManageAPI,
  checkConfigConnectionAPI
} from '@api'
import { cloneDeep } from 'lodash'

const configInfo = {
  type: 'apollo', // apollo/nacos
  server_address: '',
  auth_config: {
    token: '', // for apollo
    user_name: '', // for nacos
    password: ''
  }
}
export default {
  props: {
    getConfigList: Function
  },
  data () {
    this.typeList = [
      {
        icon: 'iconapollo',
        label: 'Apollo',
        value: 'apollo'
      },
      {
        icon: 'iconnacos',
        label: 'Nacos',
        value: 'nacos'
      }
    ]
    return {
      formRules: {
        server_address: [
          {
            required: true,
            message: '访问地址不能为空',
            trigger: ['blur', 'change']
          },
          {
            pattern: /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/,
            message: '请输入正确的访问地址',
            trigger: ['blur', 'change']
          }
        ],
        'auth_config.token': [
          { required: true, message: 'Token 不能为空', trigger: 'blur' }
        ],
        'auth_config.user_name': [
          { required: true, message: '用户名不能为空', trigger: 'blur' }
        ],
        'auth_config.password': [
          { required: true, message: '密码不能为空', trigger: 'blur' }
        ]
      },
      dialogVisible: false,
      opeForm: cloneDeep(configInfo),

      errorMessage: '',
      checkRes: ''
    }
  },
  computed: {
    showCheckIcon () {
      if (this.checkRes === 'pass') {
        return 'el-icon-success'
      } else if (this.checkRes === 'fail') {
        return 'el-icon-error'
      } else {
        return ''
      }
    }
  },
  watch: {
    dialogVisible (value) {
      if (!value) {
        this.$refs.opeForm.resetFields()
        this.checkRes = null
        this.opeForm = cloneDeep(configInfo)
      }
    }
  },
  methods: {
    openDialog (ope, data) {
      if (ope === 'add') {
        this.opeForm = cloneDeep(configInfo)
      } else {
        this.opeForm = cloneDeep(data)
      }
      this.dialogVisible = true
    },
    async checkConnection () {
      const res = await checkConfigConnectionAPI(this.opeForm).catch(error => {
        this.checkRes = 'fail'
        this.errorMessage = error.response.data.message
      })
      if (res && res.message === 'success') {
        this.checkRes = 'pass'
      }
    },
    async save () {
      const res = await (this.opeForm.id
        ? updateConfigManageAPI(this.opeForm.id, this.opeForm)
        : createConfigManageAPI(this.opeForm)
      ).catch(error => console.log(error))
      if (res && res.message === 'success') {
        this.$message.success(this.opeForm.id ? '保存成功' : '新增成功')
        this.dialogVisible = false
        this.getConfigList()
      }
    },
    validate (ope) {
      this.$refs.opeForm.validate().then(() => {
        this[ope]()
      })
    }
  }
}
</script>

<style lang="less" scoped>
/deep/ .edit-form-dialog {
  width: 550px;

  .el-dialog__header {
    padding: 15px;
    text-align: center;
    border-bottom: 1px solid #e4e4e4;

    .el-dialog__close {
      font-size: 10px;
    }
  }

  .el-dialog__body {
    padding: 30px 20px;
    color: #606266;
    font-size: 14px;

    .el-form-item {
      margin-bottom: 15px;
    }

    .el-icon-error,
    .el-icon-success {
      margin-left: 10px;
      font-size: 14px;
    }

    .el-icon-error {
      color: @danger;
    }

    .el-icon-success {
      color: @success;
    }
  }

  .el-select {
    width: 100%;
  }

  .el-input {
    display: inline-block;
  }
}

.config-icon {
  display: inline-block;
  width: 25px;

  &.iconnacos {
    font-size: 12px;
  }
}
</style>
