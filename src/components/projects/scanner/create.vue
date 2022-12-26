<template>
  <div class="code-scanner-edit-container" v-loading="loading">
    <section class="common-parcel-block">
      <el-form
        ref="scannerFormRef"
        :model="scannerConfig"
        :rules="createRules"
        label-width="120px"
        class="primary-form"
        label-position="left"
        inline-message
      >
        <el-form-item :label="$t(`global.name`)" prop="name">
          <el-input v-model="scannerConfig.name" :placeholder="$t(`scanning.prompt.inputScanningName`)" autofocus size="small" :disabled="isEdit" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`scanning.details.description`)">
          <el-input v-model="scannerConfig.description" :placeholder="$t(`scanning.prompt.inputDescription`)" autofocus size="small" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item :label="$t(`scanning.details.scanner`)">
          <el-select v-model="scannerConfig.scanner_type" :placeholder="$t(`scanning.prompt.chooseScanner`)" size="small" @change="initDefaultImage">
            <el-option label="SonarQube" value="sonarQube"></el-option>
            <el-option :label="$t(`scanning.details.scannerTypeOther`)" value="other"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item :label="$t(`scanning.details.image`)" prop="image_id">
          <el-select v-model="scannerConfig.image_id" :placeholder="$t(`scanning.prompt.chooseImage`)" size="small">
            <el-option v-for="(sys,index) in systems" :key="index" :label="sys.label" :value="sys.id">{{sys.label}}</el-option>
            <el-option disabled value="NEWCUSTOM">
              <router-link to="/v1/system/imgs" class="env-link">
                <i class="el-icon-circle-plus-outline" style="margin-right: 3px;"></i>
                {{$t(`scanning.prompt.createImage`)}}
              </router-link>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="scannerConfig.installs.length===0" :label="$t(`scanning.details.packages`)">
          <el-button @click="addFirstApp()" type="primary" size="mini" plain>{{$t(`global.create`)}}</el-button>
        </el-form-item>
        <el-form-item
          v-else
          v-for="(app,appIndex) in scannerConfig.installs"
          :key="appIndex"
          :prop="`installs.${appIndex}.name`"
          :rules="{required: false, message: $t(`scanning.prompt.packageCannotBeEmpty`), trigger: 'blur'}"
          :label="appIndex === 0 ? $t(`scanning.details.packages`) : ''"
        >
          <el-select v-model="scannerConfig.installs[appIndex]" :placeholder="$t(`global.pleaseSelect`)" size="small" value-key="id" filterable>
            <el-option
              v-for="(app, index) in scannerConfig.installs[appIndex].name ? [scannerConfig.installs[appIndex]].concat(remainingApps) : remainingApps"
              :key="index"
              :label="`${app.name} ${app.version} `"
              :value="{'name':app.name,'version':app.version,'id':app.id}"
            ></el-option>
          </el-select>
          <span>
            <el-button v-if="scannerConfig.installs.length >= 1" @click="deleteApp(appIndex)" type="danger" size="mini" plain>{{$t(`global.delete`)}}</el-button>
            <el-button v-if="appIndex===scannerConfig.installs.length-1" @click="addApp(appIndex)" type="primary" size="mini" plain>{{$t(`global.create`)}}</el-button>
          </span>
        </el-form-item>
        <el-form-item :label="$t(`scanning.details.sonarAddress`)" v-if="scannerConfig.scanner_type === 'sonarQube'" prop="sonar_id">
          <el-select v-model="scannerConfig.sonar_id" :placeholder="$t(`scanning.prompt.selectSonarAddress`)" size="small">
            <el-option v-for="(item, index) in sonarList" :key="index" :label="item.server_address" :value="item.id"></el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 仅支持一个代码库 -->
      <div class="section">
        <RepoSelect
          ref="repoSelectRef"
          :config="scannerConfig"
          :validObj="validObj"
          class="scanner-secondary-form"
          showFirstLine
          showJustOne
        />
      </div>

      <section v-if="scannerConfig.scanner_type === 'sonarQube'">
        <div class="primary-title not-first-child">
          <span>{{$t(`scanning.details.preScanScript`)}}</span>
        </div>
        <div class="deploy-script">
          <Resize :resize="'both'">
            <Editor v-model="scannerConfig.pre_script"></Editor>
          </Resize>
        </div>
        <div class="primary-title not-first-child">
          <span>{{$t(`scanning.details.parameters`)}}</span>
          <el-tooltip effect="dark" :content="$t(`scanning.prompt.sonarParameterPopup`)" placement="right">
            <i class="el-icon-warning"></i>
          </el-tooltip>
        </div>
        <div class="deploy-script">
          <Resize :resize="'both'">
            <Editor v-model="scannerConfig.parameter"></Editor>
          </Resize>
        </div>
        <div class="primary-title not-first-child" v-if="hasPlutus">
          <span>{{$t(`scanning.details.qualityGate`)}}</span>
          <el-tooltip effect="dark" :content="$t(`scanning.prompt.qualityGatePopup`)" placement="top" class="mg-r8">
            <i class="el-icon-warning"></i>
          </el-tooltip>
          <el-switch v-model="scannerConfig.check_quality_gate"></el-switch>
        </div>
      </section>

      <section v-else-if="scannerConfig.scanner_type === 'other'">
        <div class="primary-title not-first-child">{{$t(`scanning.details.scanningScript`)}}</div>
        <div class="deploy-script">
          <Resize :resize="'both'">
            <Editor v-model="scannerConfig.script" />
          </Resize>
        </div>
      </section>
    </section>

    <section>
      <div style="margin-bottom: 8px;">
        <el-button
          type="primary"
          size="small"
          plain
          @click="scannerConfig.advanced_setting_modified = !scannerConfig.advanced_setting_modified"
        >
          {{$t(`scanning.advancedSettings.title`)}}
          <i :class="[scannerConfig.advanced_setting_modified ? 'el-icon-arrow-up' : 'el-icon-arrow-down']" style="margin-left: 8px;"></i>
        </el-button>
      </div>

      <AdvancedConfig
        v-show="scannerConfig.advanced_setting_modified"
        class="common-parcel-block test-advanced-config"
        ref="advancedConfigRef"
        :scannerConfig="scannerConfig"
        :allCodeHosts="allCodeHosts"
        :validObj="validObj"
        @validateFailed="scannerConfig.advanced_setting_modified = true" />
    </section>

    <footer class="create-footer">
      <router-link :to="`/v1/projects/detail/${projectName}/scanner`">
        <el-button style="margin-right: 15px;" type="primary" :disabled="saveLoading" plain>{{$t(`global.cancel`)}}</el-button>
      </router-link>
      <el-button
        v-hasPermi="{projectName: projectName, action: isEdit?'edit_scan':'create_scan',isBtn:true}"
        @click="saveScanner"
        type="primary"
        :loading="saveLoading"
      >{{ isEdit ? $t(`scanning.prompt.editConfirmation`) : $t(`scanning.prompt.createNow`) }}</el-button>
    </footer>
  </div>
</template>

<script>
import Editor from 'vue2-ace-bind'
import Resize from '@/components/common/resize.vue'
import AdvancedConfig from './common/advancedConfig.vue'
import ValidateSubmit from '@utils/validateAsync'
import { mapState } from 'vuex'

import {
  getCodeSourceMaskedAPI,
  getImgListAPI,
  querySonarAPI,
  createCodeScannerAPI,
  updateCodeScannerAPI,
  getCodeScannerDetailAPI,
  getAllAppsAPI
} from '@api'

import bus from '@utils/eventBus'

import { cloneDeep, differenceBy } from 'lodash'

export default {
  data () {
    return {
      loading: false,
      validObj: new ValidateSubmit(),
      saveLoading: false,
      allCodeHosts: [],
      systems: [],
      sonarList: [],
      defaultSonarImageId: '',
      scannerConfig: {
        name: '',
        project_name: '',
        description: '',
        scanner_type: 'sonarQube',
        image_id: '', // scanner environment
        sonar_id: '',
        repos: [],
        installs: [],
        pre_script: '#!/bin/bash',
        check_quality_gate: false,
        parameter: '# Sonar Parameter\n', // sonar parameters
        script: '#!/bin/bash\nset -e', // for other type
        advanced_settings: {
          timeout: 60,
          cluster_id: '',
          res_req: 'low',
          res_req_spec: {
            cpu_limit: 1000,
            memory_limit: 512
          },
          hook_ctl: {
            enabled: true,
            items: []
          }
          // schedules: { // for timing trigger
          //   enabled: false,
          //   items: []
          // },
          // notify_ctl: {  // for notify
          //   enabled: false,
          //   weChat_webHook: '',
          //   notify_type: []
          // }
        },
        outputs: [],
        advanced_setting_modified: false
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    scannerId () {
      return this.$route.query.id
    },
    isEdit () {
      return !!this.scannerId
    },
    remainingApps () {
      return differenceBy(this.allApps, this.scannerConfig.installs, 'id')
    },
    createRules () {
      const validateName = (rule, value, callback) => {
        if (value === '') {
          callback(new Error(this.$t(`scanning.prompt.inputScanningName`)))
        } else {
          if (!/^[a-z0-9-]+$/.test(value)) {
            callback(new Error(this.$t(`scanning.prompt.scanningNamingConvention`)))
          } else {
            callback()
          }
        }
      }
      return {
        name: [
          {
            type: 'string',
            required: true,
            validator: validateName,
            trigger: ['blur', 'change']
          }
        ],
        image_id: {
          required: true,
          message: this.$t(`scanning.prompt.imageCannotBeEmpty`),
          trigger: ['blur', 'change']
        },
        sonar_id: {
          required: true,
          message: this.$t(`scanning.prompt.sonarAddressCannotBeEmpty`),
          trigger: ['blur', 'change']
        }
      }
    },
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    })
  },
  methods: {
    getAllApps () {
      if (this.systems.length === 0) {
        // be used on Dependent Packages
        getAllAppsAPI().then(res => {
          const apps = this.$utils.sortVersion(res, 'name', 'asc')
          this.allApps = apps.map(app => {
            return {
              name: app.name,
              version: app.version,
              id: app.name + app.version
            }
          })
        })
      }
    },
    addFirstApp () {
      this.scannerConfig.installs.push({
        name: '',
        version: '',
        id: ''
      })
    },
    addApp () {
      this.scannerConfig.installs.push({
        name: '',
        version: '',
        id: ''
      })
    },
    deleteApp (index) {
      this.scannerConfig.installs.splice(index, 1)
    },
    saveScanner () {
      this.validate().then(async () => {
        const payload = cloneDeep(this.scannerConfig)
        delete payload.advanced_setting_modified
        payload.advanced_settings.hook_ctl.items = payload.advanced_settings.hook_ctl.items.map(
          item => item.main_repo
        )
        payload.repos = payload.repos.map(repo => {
          return {
            codehost_id: repo.codehost_id,
            repo_name: repo.repo_name,
            repo_owner: repo.repo_owner,
            branch: repo.branch,
            source: repo.source,
            remote_name: repo.remote_name,
            submodules: repo.submodules,
            checkout_path: repo.checkout_path,
            repo_namespace: repo.repo_namespace
          }
        })
        this.saveLoading = true
        const res = await (this.isEdit
          ? updateCodeScannerAPI(this.scannerId, payload)
          : createCodeScannerAPI(payload)
        ).catch(error => {
          console.log(error)
        })
        this.saveLoading = false
        if (res) {
          this.$message.success(
            `${this.isEdit ? this.$t('scanning.prompt.updated', { name: payload.name }) : this.$t('scanning.prompt.created', { name: payload.name })}`
          )
          this.$router.push(`/v1/projects/detail/${this.projectName}/scanner`)
        }
      })
    },
    async validate () {
      const valid = []
      const res = await this.validObj.validateAll()
      if (!res[1]) {
        valid.push(Promise.reject())
      }
      valid.push(this.$refs.scannerFormRef.validate())
      return Promise.all(valid)
    },
    changeImage (key, value) {
      const imageSys = this.systems.find(item => {
        return item[key] === value
      })
      if (imageSys) {
        this.currentEnv.image_id = imageSys.id
        this.currentEnv.image_from = imageSys.image_from
        this.currentEnv.build_os = imageSys.value
      }
    },
    initDefaultImage (scannerType) {
      this.scannerConfig.image_id = scannerType === 'sonarQube' ? this.defaultSonarImageId : this.systems[0].id
    },
    getImageList (scannerType, initConfig = true) {
      getImgListAPI('', 'sonar').then(res => {
        this.systems = res
        const find = res.find(re => re.image_type === 'sonar')
        if (find) {
          this.defaultSonarImageId = find.id
        }
        if (initConfig && res.length) {
          this.initDefaultImage(scannerType)
        }
      })
    }
  },
  created () {
    this.loading = true
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t(`subTopbarMenu.projects`), url: `/v1/projects` },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}`
        },
        {
          title: this.$t(`subTopbarMenu.scannings`),
          url: `/v1/projects/detail/${this.projectName}/scanner`
        },
        {
          title: this.isEdit ? this.$route.params.scanner_name : this.$t(`global.create`),
          url: ''
        }
      ]
    })
    this.scannerConfig.project_name = this.projectName

    const key = this.$utils.rsaEncrypt()
    const projectName = this.projectName
    getCodeSourceMaskedAPI(key).then(response => {
      this.allCodeHosts = response
    })

    this.getImageList(this.scannerConfig.scanner_type, !this.isEdit)

    querySonarAPI(key, projectName).then(res => {
      this.sonarList = res
      if (!this.isEdit && res.length) {
        this.scannerConfig.sonar_id = res[0].id
      }
    })

    if (this.isEdit) {
      getCodeScannerDetailAPI(this.scannerId, this.projectName).then(res => {
        res.advanced_settings.hook_ctl.items = res.advanced_settings.hook_ctl.items.map(
          item => {
            return {
              main_repo: item
            }
          }
        )
        res.advanced_setting_modified = true
        this.scannerConfig = res
        this.getImageList(this.scannerConfig.scanner_type, !this.isEdit)
        this.loading = false
      })
    } else {
      this.loading = false
    }
    this.getAllApps()
  },
  components: {
    Editor,
    Resize,
    AdvancedConfig
  }
}
</script>

<style lang="less" scoped>
.code-scanner-edit-container {
  box-sizing: border-box;
  height: 100%;
  padding: 16px 40px 60px;
  overflow: auto;
  background: @globalBackgroundColor;

  /deep/.el-form.scanner-secondary-form {
    .el-form-item {
      margin-bottom: @ItemBottom;
    }

    .el-form-item__label {
      color: @secondaryColor;
      font-weight: @itemWeight;
    }
  }

  .create-footer {
    position: fixed;
    right: calc(~'50% - 200px');
    bottom: 0;
    z-index: 1;
    padding: 10px 10px 10px 10px;
  }
}
</style>
