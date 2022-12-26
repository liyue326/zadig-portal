<template>
  <section class="job-plugin">
    <el-form label-position="left" label-width="100px" :model="job" ref="ruleForm" class="mg-t24 mg-b24">
      <el-form-item :label="$t(`workflow.jobName`)" prop="name" :rules="{required: true,validator:validateJobName, trigger: ['blur', 'change']}">
        <el-input v-model="job.name" size="small" style="width: 220px;"></el-input>
      </el-form-item>
      <section class="common-parcel-block">
        <span class="title">{{$t(`global.var`)}}</span>
        <el-table :data="job.spec.plugin.inputs" class="mg-t8">
          <el-table-column :label="$t(`global.key`)">
            <template slot-scope="scope">
              <el-tooltip class="item" effect="dark" :content="scope.row.description" placement="top-start">
                <span>{{scope.row.name}}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column :label="$t(`global.type`)">
            <template slot-scope="scope">
              <span>{{scope.row.type === 'string' ? $t(`global.string`):scope.row.type==='text'?$t(`global.multilineText`):$t(`global.enumerate`)}}</span>
              <i v-show="scope.row.type  === 'choice'" class="el-icon-edit edit-icon" @click="updateParams(scope.row)"></i>
            </template>
          </el-table-column>
          <el-table-column :label="$t(`global.value`)">
            <template slot-scope="scope">
              <el-select
                v-model="scope.row.value"
                v-if="scope.row.type === 'choice'&&scope.row.command !== 'other'"
                size="small"
                style="width: 220px;"
              >
                <el-option v-for="(item,index) in scope.row.choice_option" :key="index" :value="item" :label="item">{{item}}</el-option>
              </el-select>
              <el-input
                v-if="scope.row.type === 'text'&&scope.row.command !== 'other'"
                v-model="scope.row.value"
                size="small"
                type="textarea"
                :rows="2"
                style="width: 220px;"
              ></el-input>
              <el-input
                v-if="scope.row.type === 'string'&&scope.row.command !== 'other'"
                class="password"
                v-model="scope.row.value"
                size="small"
                :type="scope.row.is_credential ? 'passsword' : ''"
                :show-password="scope.row.is_credential ? true : false"
                style="width: 220px;"
              ></el-input>
              <el-select
                v-if="scope.row.command === 'other'"
                style="display: inline-block; width: 220px;"
                v-model="scope.row.value"
                placeholder="请选择"
                filterable
                ref="select"
                @focus="handleEnvChange(scope.row, scope.row.command)"
                size="small"
              >
                <el-option v-for="(item,index) in globalEnv" :key="index" :label="item" :value="item">{{item}}</el-option>
              </el-select>
              <EnvTypeSelect
                v-model="scope.row.command"
                isFixed
                isRuntime
                isOther
                style="display: inline-block;"
                @change="handleEnvTypeChange"
              />
            </template>
          </el-table-column>
          <el-table-column :label="$t(`workflow.sensitiveInformation`)">
            <template slot-scope="scope">
              <el-checkbox v-model="scope.row.is_credential" :disabled="scope.row.type === 'text'||scope.row.type === 'choice'"></el-checkbox>
            </template>
          </el-table-column>
        </el-table>
      </section>
      <div>
        <section>
          <div style="margin-bottom: 8px;">
            <el-button type="primary" size="small" plain @click="advanced_setting_modified = !advanced_setting_modified">
              {{$t(`project.createProjectComp.advancedConfigurations`)}}
              <i :class="[advanced_setting_modified ? 'el-icon-arrow-up' : 'el-icon-arrow-down']" style="margin-left: 8px;"></i>
            </el-button>
          </div>
          <AdvancedConfig
            v-if="advanced_setting_modified"
            ref="advancedConfigRef"
            class="common-parcel-block"
            :buildConfig="job.spec"
            :secondaryProp="`properties`"
            :validObj="validObj"
            @validateFailed="advanced_setting_modified = true"
            :shareStorage="workflowInfo.share_storages"
            hiddenCache
            hiddenVars
            isShowShareStorage
          ></AdvancedConfig>
        </section>
      </div>
    </el-form>
    <el-dialog :visible.sync="dialogVisible" title="枚举" width="600px" :close-on-click-modal="false" :show-close="false" append-to-body>
      <el-form ref="form" :model="currentVars" label-position="left" label-width="100px">
        <el-form-item label="变量名称">
          <el-input v-model="currentVars.name" disabled size="small"></el-input>
        </el-form-item>
        <el-form-item label="可选值">
          <el-input type="textarea" v-model="currentVars.choice_option" placeholder="可选值之间用英文 “,” 隔开" size="small" rows="4"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false" size="small">{{$t(`global.cancel`)}}</el-button>
        <el-button type="primary" @click="saveVariable" size="small">{{$t(`global.confirm`)}}</el-button>
      </div>
    </el-dialog>
  </section>
</template>

<script>
import ValidateSubmit from '@utils/validateAsync'
import AdvancedConfig from '@/components/projects/build/advancedConfig.vue'
import EnvTypeSelect from '../envTypeSelect.vue'
import { validateJobName } from '../../config.js'
import { cloneDeep } from 'lodash'
import jsyaml from 'js-yaml'
import { getWorkflowGlobalVarsAPI } from '@api'
export default {
  name: 'JobPlugin',
  data () {
    return {
      validateJobName,
      validObj: new ValidateSubmit(),
      advanced_setting_modified: false,
      dialogVisible: false,
      currentVars: [],
      curDialogInfo: {},
      allCodeHosts: [],
      globalEnv: []
    }
  },
  components: { AdvancedConfig, EnvTypeSelect },
  props: {
    job: {
      type: Object,
      default: () => ({})
    },
    workflowInfo: {
      type: Object,
      default: () => ({})
    },
    curStageIndex: {
      type: Number,
      default: 0
    },
    curJobIndex: {
      type: Number,
      default: 0
    }
  },
  created () {
    this.getGlobalEnv()
  },
  methods: {
    getGlobalEnv () {
      const params = cloneDeep(this.workflowInfo)
      const curJob = cloneDeep(this.job)
      curJob.name = Math.random()
      params.stages[this.curStageIndex].jobs[this.curJobIndex] = curJob
      getWorkflowGlobalVarsAPI(curJob.name, jsyaml.dump(params)).then(res => {
        this.globalEnv = res
      })
    },
    handleEnvChange (row, command) {
      row.value = ''
      if (command === 'other') {
        this.getGlobalEnv()
      }
    },
    handleEnvTypeChange (val) {
      if (val === 'other') {
        this.$nextTick(() => {
          this.$refs.select.toggleMenu()
        })
      }
    },
    updateParams (row) {
      this.dialogVisible = true
      this.curDialogInfo = row
      const current = row
      this.currentVars = cloneDeep({
        ...this.curDialogInfo,
        choice_option: current.choice_option
          ? current.choice_option.join(',')
          : ''
      })
    },
    saveVariable () {
      this.dialogVisible = false
      const choice_option = this.currentVars.choice_option.split(',')
      if (!choice_option.includes(this.currentVars.value)) {
        env.value = ''
      }
      this.curDialogInfo.choice_option = choice_option
    },

    validate () {
      return this.$refs.ruleForm.validate()
    },
    getData () {
      return this.job
    }
  }
}
</script>

<style lang="less" scoped>
.job-plugin {
  .common-parcel-block {
    padding: 0;

    .title {
      color: @primaryColor;
      font-weight: 300;
      font-size: 14px;
      line-height: 28px;
    }
  }

  .edit-icon {
    cursor: pointer;
  }

  .password {
    /deep/.el-input__suffix {
      display: none !important;
    }
  }
}
</style>
