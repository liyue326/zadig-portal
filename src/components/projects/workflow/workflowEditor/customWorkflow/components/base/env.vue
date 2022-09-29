<template>
  <div class="global-env">
    <el-form ref="buildEnvRef" :inline="true" :model="preEnvs" class="variable-form" label-position="top" label-width="80px">
      <el-row :gutter="2" class="th">
        <el-col :span="6" class="th-title">类型</el-col>
        <el-col :span="6" class="th-title">键</el-col>
        <el-col :span="6" class="th-title">值</el-col>
      </el-row>
      <el-button
        v-if="preEnvs.params && preEnvs.params.length===0"
        @click="addFirstBuildEnv()"
        type="primary"
        size="mini"
        plain
        class="mg-b16"
      >+ 添加</el-button>
      <el-row v-for="(app,build_env_index) in preEnvs.params" :key="build_env_index" :gutter="2">
        <el-col :span="6">
          <el-form-item class="display-flex">
            <el-select
              v-model="preEnvs.params[build_env_index].type"
              placeholder="类型"
              size="small"
              :class="{'partial-width': preEnvs.params[build_env_index].type === 'choice'}"
              style="margin-right: 6px;"
              @change="changeEnvType(build_env_index)"
            >
              <el-option label="字符串" value="string"></el-option>
              <el-option label="多行文本" value="text"></el-option>
              <el-option label="枚举" value="choice"></el-option>
            </el-select>
            <i
              v-show="preEnvs.params[build_env_index].type === 'choice'"
              class="el-icon-edit edit-icon"
              @click="updateParams(build_env_index)"
            ></i>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item
            :prop="'params.' + build_env_index + '.name'"
            :rules="{required: true, message: '键 不能为空', trigger: ['blur','change']}"
          >
            <el-input placeholder="键" v-model="preEnvs.params[build_env_index].name" size="small" @input="updateKeyParams(build_env_index)"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item
            :prop="'params.' + build_env_index + '.value'"
            :rules="{required: true, message: '值 不能为空', trigger: ['blur','change']}"
          >
            <el-select
              v-if="preEnvs.params[build_env_index].type==='choice'"
              v-model="preEnvs.params[build_env_index].value"
              placeholder="默认值"
              size="small"
              style="max-width: 176px;"
            >
              <el-option v-for="option in preEnvs.params[build_env_index].choice_option" :key="option" :label="option" :value="option"></el-option>
            </el-select>
            <el-input
              v-if="preEnvs.params[build_env_index].type==='string'"
              :disabled="preEnvs.params[build_env_index].auto_generate"
              placeholder="值"
              @input="updateKeyParams(build_env_index)"
              v-model="preEnvs.params[build_env_index].value"
              size="small"
            ></el-input>
            <el-input
              v-if="preEnvs.params[build_env_index].type==='text'"
              type="textarea"
              :disabled="preEnvs.params[build_env_index].auto_generate"
              placeholder="值"
              @input="updateKeyParams(build_env_index)"
              v-model="preEnvs.params[build_env_index].value"
              size="small"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="2">
          <el-form-item>
            <EnvTypeSelect v-model="preEnvs.params[build_env_index].command" isFixed isRuntime />
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item>
            <div class="app-operation">
              <el-button
                v-if="preEnvs.params.length >= 1"
                @click="deleteBuildEnv(build_env_index)"
                type="danger"
                size="mini"
                icon="el-icon-minus"
                circle
                plain
              ></el-button>
              <el-button
                v-if="build_env_index===preEnvs.params.length-1"
                @click="addBuildEnv()"
                type="primary"
                size="mini"
                icon="el-icon-plus"
                circle
                plain
              ></el-button>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <el-dialog :visible.sync="dialogVisible" title="枚举" width="600px" :close-on-click-modal="false" :show-close="false" append-to-body>
      <el-form ref="form" :model="currentVars" label-width="90px">
        <el-form-item label="变量名称">
          <el-input v-model="currentVars.name" size="small"></el-input>
        </el-form-item>
        <el-form-item label="可选值">
          <el-input type="textarea" v-model="currentVars.choice_option" placeholder="可选值之间用英文 “,” 隔开" size="small" rows="4"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false" size="small">取 消</el-button>
        <el-button type="primary" @click="saveVariable" size="small">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import EnvTypeSelect from '../envTypeSelect.vue'

import { cloneDeep } from 'lodash'
export default {
  components: { EnvTypeSelect },
  props: {
    preEnvs: {
      type: Object,
      default: () => ({})
    },
    isTest: {
      type: Boolean,
      default: false
    },
    mini: {
      type: Boolean,
      default: false
    },
    validObj: {
      required: false,
      type: Object,
      default: null
    },
    fromServicePage: {
      type: Boolean,
      default: false
    },
    isJenkins: {
      type: Boolean,
      default: false
    },
    serviceName: {
      type: Array,
      default: () => [{ service_name: '' }]
    },
    fromWhere: {
      type: Object,
      default: () => {
        return {
          origin: 'build',
          title: '构建',
          vars: []
        }
      }
    }
  },
  data () {
    return {
      dialogVisible: false,
      currentVars: {},
      showBuildInEnvVar: false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    validate () {
      return this.$refs.buildEnvRef.validate()
    },
    getData () {
      return this.preEnvs.params
    },
    addFirstBuildEnv () {
      this.preEnvs.params.push({
        key: '',
        value: '',
        type: 'string',
        is_credential: false
      })
    },
    addBuildEnv () {
      this.validate().then(valid => {
        this.preEnvs.params.push({
          name: '',
          value: '',
          type: 'string',
          is_credential: false
        })
        this.$forceUpdate()
      })
    },
    deleteBuildEnv (index) {
      this.preEnvs.params.splice(index, 1)
    },
    changeEnvType (index) {
      const current = this.preEnvs.params[index]
      current.value = ''
      if (current.type === 'string' || current.type === 'text') {
        // current.is_credential = true
        this.updateKeyParams(index)
      } else {
        // current.is_credential = false
        this.updateParams(index)
      }
    },
    updateParams (index) {
      this.dialogVisible = true
      this.updateKeyParams(index)
    },
    updateKeyParams (index) {
      const current = this.preEnvs.params[index]
      this.currentVars = cloneDeep({
        index,
        ...current,
        choice_option: current.choice_option
          ? current.choice_option.join(',')
          : ''
      })
    },
    saveVariable () {
      this.dialogVisible = false
      const index = this.currentVars.index
      const env = this.preEnvs.params[index]
      const choice_option = this.currentVars.choice_option.split(',')
      env.choice_option = choice_option
      this.$set(env, 'name', this.currentVars.name)
      if (!choice_option.includes(env.value)) {
        env.value = ''
      }
    }
  },
  watch: {
    preEnvs: {
      handler (newValue, oldValue) {
        if (newValue) {
          newValue.params.forEach(e => {
            if (!e.type) {
              this.$set(e, 'type', 'string')
            }
          })
          this.$forceUpdate()
        }
      },
      deep: true
    }
  },
  created () {
    this.validObj &&
      this.validObj.addValidate({
        name: 'envVariable',
        valid: this.validate
      })
    const origin = this.fromWhere.origin
    if (origin === 'build') {
      this.fromWhere.vars = this.buildVars
    } else if (origin === 'test') {
      this.fromWhere.vars = this.testVars
    }
  }
}
</script>

<style lang="less" scoped>
@secondaryColor: #888888;
@primaryColor: #000;

.global-env {
  .th {
    margin-bottom: 16px;
    padding: 4px;
    font-weight: 500;
    background: #eaeaea;

    &-title {
      display: inline-block;
      color: @primaryColor;
      font-weight: 300;
      font-size: 14px;
      line-height: 28px;
    }
  }

  .display-flex {
    /deep/.el-form-item__content {
      display: flex;
      align-items: center;

      .el-select.partial-width {
        width: 80%;
      }
    }

    .edit-icon {
      color: @themeColor;
      cursor: pointer;
    }
  }

  /deep/.el-form-item {
    margin-bottom: 8px;
  }
}
</style>
