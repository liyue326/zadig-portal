<template>
  <div>
    <el-alert type="warning" :closable="false">
      <template>
        主机资源用于主机服务资源配置
        <br />指定的主机端口用于主机 TCP 探活和 SSH 登录
        <br />详细配置可参考
        <el-link
          style="font-size: 14px; vertical-align: baseline;"
          type="primary"
          :href="`https://docs.koderover.com/zadig/settings/vm-management/`"
          :underline="false"
          target="_blank"
        >帮助文档</el-link>
      </template>
    </el-alert>
    <el-form ref="host" :rules="rules" label-width="120px" label-position="left" :model="host" class="host-form">
      <el-form-item label="主机名称" prop="name">
        <el-input size="small" v-model="host.name" placeholder="请输入主机名称"></el-input>
      </el-form-item>
      <el-form-item label="主机提供商" prop="provider">
        <el-select v-model="host.provider" style="width: 100%;" size="small" placeholder="请选择主机提供商">
          <el-option :value="1" label="阿里云">
            <i class="iconfont iconaliyun"></i>
            <span>阿里云</span>
          </el-option>
          <el-option :value="2" label="腾讯云">
            <i class="iconfont icontengxunyun"></i>
            <span>腾讯云</span>
          </el-option>
          <el-option :value="3" label="华为云">
            <i class="iconfont iconhuawei"></i>
            <span>华为云</span>
          </el-option>
          <el-option :value="4" label="Amazon">
            <i class="iconfont iconaws"></i>
            <span>Amazon</span>
          </el-option>
          <el-option :value="0" label="其他">
            <i class="iconfont iconwuliji"></i>
            <span>其他</span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="用户名" prop="user_name">
        <el-input size="small" v-model="host.user_name" placeholder="请输入用户名"></el-input>
      </el-form-item>
      <el-form-item label="主机地址" prop="ip">
        <el-row :gutter="10" style="margin-left: 0;" class="ip-host-row">
          <el-col :span="16" style="padding-left: 0;">
            <el-form-item prop="ip" required>
              <el-input size="small" v-model.trim="host.ip" placeholder="请输入主机地址"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="1" style="text-align: center;">:</el-col>
          <el-col :span="7">
            <el-form-item prop="port">
              <el-input size="small" v-model.number="host.port" placeholder="请输入端口"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form-item>
      <el-form-item label="标签" prop="label">
        <el-input size="small" v-model="host.label" placeholder="请输入标签"></el-input>
      </el-form-item>
      <el-form-item label="是否生产" prop="is_prod">
        <el-radio-group v-model="host.is_prod">
          <el-radio :label="true">是</el-radio>
          <el-radio :label="false">否</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="私钥" prop="private_key">
        <el-input size="small" type="textarea" v-model="host.private_key" placeholder="请输入私钥"></el-input>
      </el-form-item>
      <div>
        <el-button type="text" @click="showAdvanced = !showAdvanced">
          高级设置
          <i :class="[showAdvanced ? 'el-icon-arrow-down' : 'el-icon-arrow-right']"></i>
        </el-button>
      </div>
      <div v-show="showAdvanced" class="advanced-config-content">
        <div class="advanced-title">主机探活</div>
        <el-form-item label="协议">
          <el-select v-model="host.probe.probe_type" placeholder="选择协议" size="small">
            <el-option label="TCP" value="tcp"></el-option>
            <el-option label="HTTP" value="http"></el-option>
            <el-option label="HTTPS" value="https"></el-option>
          </el-select>
          <span v-if="host.probe.probe_type === 'tcp'">默认使用配置的主机地址作为探活地址</span>
        </el-form-item>
        <div v-show="host.probe.probe_type !== 'tcp'">
          <el-form-item label="端口" prop="probe.http_probe.port">
            <el-input v-model.number="host.probe.http_probe.port" size="small" placeholder="1 ~ 65535"></el-input>
          </el-form-item>
          <el-form-item label="路径">
            <el-input v-model="host.probe.http_probe.path" placeholder="example.com/healthz" size="small"></el-input>
          </el-form-item>
          <el-form-item label="请求头部">
            <el-button
              v-if="!host.probe.http_probe.http_headers.length"
              type="text"
              icon="el-icon-plus"
              @click="actionHttpHeaders('add')"
            >添加</el-button>
            <div v-for="(header, index) in host.probe.http_probe.http_headers" :key="index">
              <el-input v-model="header.name" size="small" placeholder="Header Name"></el-input>
              <el-input v-model="header.value" size="small" placeholder="Header Value"></el-input>
              <el-button type="text" icon="el-icon-minus" @click="actionHttpHeaders('delete', index)"></el-button>
              <el-button
                v-if="host.probe.http_probe.http_headers.length-1 === index"
                type="text"
                icon="el-icon-plus"
                @click="actionHttpHeaders('add')"
              ></el-button>
            </div>
          </el-form-item>
          <el-form-item label="响应超时" prop="probe.http_probe.timeout_second">
            <el-input v-model.number="host.probe.http_probe.timeout_second" size="small" style="margin-right: 5px;"></el-input>秒
          </el-form-item>
          <el-form-item label="主机在线条件">
            <div>
              <el-checkbox :value="true" disabled></el-checkbox>
              <span style="display: inline-block; margin-left: 5px;">返回码为 2xx</span>
            </div>
            <div>
              <el-checkbox
                v-model="host.probe.http_probe.response_flag"
                @change="(value) => { if(!value){host.probe.http_probe.response_success_flag = ''}}"
              ></el-checkbox>
              <span style="display: inline-block; margin-left: 5px;">响应结构体包含</span>
              <el-input
                v-model="host.probe.http_probe.response_success_flag"
                size="small"
                :disabled="!host.probe.http_probe.response_flag"
                placeholder="字符串"
              ></el-input>
            </div>
          </el-form-item>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script>
import {
  createHostAPI,
  createProjectHostAPI,
  updateHostAPI,
  updateProjectHostAPI
} from '@api'
import { cloneDeep } from 'lodash'
const shellKeywords = [
  'alias',
  'bg',
  'bind',
  'break',
  'builtin',
  'caller',
  'case',
  'cd',
  'command',
  'compgen',
  'complete',
  'continue',
  'declare',
  'dirs',
  'disown',
  'echo',
  'enable',
  'eval',
  'exec',
  'exit',
  'export',
  'false',
  'fc',
  'fg',
  'for',
  'function',
  'getopts',
  'hash',
  'help',
  'history',
  'if',
  'then',
  'elif',
  'else',
  'jobs',
  'kill',
  'let',
  'local',
  'logout',
  'popd',
  'printf',
  'pushd',
  'pwd',
  'read',
  'readonly',
  'return',
  'select',
  'set',
  'shift',
  'shopt',
  'source',
  'suspend',
  'test',
  'time',
  'times',
  'trap',
  'true',
  'type',
  'typeset',
  'ulimit',
  'umask',
  'unalias',
  'unset',
  'until',
  'wait',
  'while'
]
export default {
  props: {
    host: {
      type: Object,
      default () {
        return {
          name: '',
          provider: null,
          label: '',
          ip: '',
          port: 22,
          is_prod: false,
          user_name: '',
          private_key: '',
          probe: {
            probe_type: 'tcp',
            http_probe: {
              path: '',
              port: 22, // 1~65535
              timeout_second: 1, // 1~10
              response_flag: false, // delete
              response_success_flag: '',
              http_headers: []
            }
          }
        }
      }
    }
  },
  data () {
    const validateKey = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入主机名称'))
      } else if (shellKeywords.includes(value)) {
        callback(new Error('主机名称不支持 bash 关键字'))
      } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
        callback(
          new Error(
            '主机名称仅支持英文字母、数字、下划线且首个字符不以数字开头'
          )
        )
      } else {
        callback()
      }
    }
    return {
      showAdvanced: false,
      rules: {
        name: [
          {
            type: 'string',
            required: true,
            trigger: 'change',
            validator: validateKey
          }
        ],
        provider: [
          { required: true, message: '请选择提供商', trigger: 'blur' }
        ],
        label: [
          {
            type: 'string',
            required: false,
            message: '请输入主机标签',
            trigger: 'change'
          }
        ],
        user_name: [
          {
            type: 'string',
            required: true,
            message: '请输入用户名'
          }
        ],
        ip: [
          {
            type: 'string',
            required: true,
            message: '请输入主机地址'
          }
        ],
        port: [
          {
            type: 'number',
            required: true,
            message: '请输入端口'
          }
        ],
        private_key: [
          {
            type: 'string',
            required: true,
            message: '请输入私钥'
          }
        ],
        'probe.http_probe.port': {
          required: true,
          validator: (rule, value, callback) => {
            if (!value) {
              callback(new Error('请输入端口'))
            } else if (isNaN(value) || value > 65535 || value < 1) {
              callback(new Error('端口范围 1 ~ 65535'))
            } else {
              callback()
            }
          }
        },
        'probe.http_probe.timeout_second': {
          required: true,
          validator: (rule, value, callback) => {
            if (!value) {
              callback(new Error('请输入超时时间'))
            } else if (isNaN(value) || value > 10 || value < 1) {
              callback(new Error('超时时间 1 ~ 10s'))
            } else {
              callback()
            }
          }
        }
      }
    }
  },
  methods: {
    actionHttpHeaders (action, index) {
      if (action === 'add') {
        this.host.probe.http_probe.http_headers.push({
          name: '',
          value: ''
        })
      } else if (action === 'delete') {
        this.host.probe.http_probe.http_headers.splice(index, 1)
      }
    },
    saveHost () {
      return this.$refs.host.validate().then(async () => {
        const payload = cloneDeep(this.host)
        payload.private_key = window.btoa(payload.private_key)
        const projectName = this.$route.params.project_name
        if (projectName) {
          payload.project_name = projectName
        }
        if (payload.probe.probe_type === 'tcp') {
          delete payload.probe.http_probe
        } else {
          delete payload.probe.http_probe.response_flag
        }
        let res = {}
        if (projectName) {
          res = await createProjectHostAPI(projectName, payload).catch(err => {
            console.log(err)
          })
        } else {
          res = await createHostAPI(payload).catch(err => {
            console.log(err)
          })
        }
        this.showAdvanced = false
        if (res) {
          this.$message({
            type: 'success',
            message: '新增主机信息成功'
          })
          this.resetFields()
        } else {
          return Promise.reject()
        }
      })
    },
    updateHost () {
      return this.$refs.host.validate().then(async () => {
        const id = this.host.id
        const payload = cloneDeep(this.host)
        const projectName = this.$route.params.project_name
        if (projectName) {
          payload.project_name = projectName
        }
        payload.private_key = window.btoa(payload.private_key)
        delete payload.origin_private_key
        if (payload.probe.probe_type === 'tcp') {
          delete payload.probe.http_probe
        } else {
          delete payload.probe.http_probe.response_flag
        }
        let res = {}
        if (projectName) {
          res = await updateProjectHostAPI(id, projectName, payload).catch(
            err => {
              console.log(err)
            }
          )
        } else {
          res = await updateHostAPI(id, payload).catch(err => {
            console.log(err)
          })
        }
        this.showAdvanced = false
        if (res) {
          this.$message({
            type: 'success',
            message: '更新主机信息成功'
          })
          this.resetFields()
        } else {
          return Promise.reject()
        }
      })
    },
    resetFields () {
      this.$refs.host.resetFields()
    }
  }
}
</script>

<style lang="less" scoped>
.host-form {
  padding: 30px 20px;

  .ip-host-row {
    .el-form-item {
      margin-bottom: 0;
    }
  }

  .advanced-config-content {
    .advanced-title {
      margin: 10px 0 8px;
      font-weight: 500;
    }

    /deep/.el-input {
      width: 40%;
    }

    /deep/.el-select {
      width: 40%;

      .el-input {
        width: 100%;
      }
    }
  }
}
</style>
