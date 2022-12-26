<template>
  <div class="test-advanced-config-container">
    <el-form class="secondary-form" :model="testConfig" ref="advancedRef" label-width="120px" label-position="left">
      <div class="primary-title">
        {{$t(`testing.details.advancedSettings.exportReport.title`)}}
        <el-button
          v-if="testConfig.artifact_paths.length===0"
          @click="add"
          type="primary"
          size="small"
          class="mg-l36"
          plain
        >{{$t(`global.add`)}}</el-button>
      </div>
      <el-form-item class="label-icon" v-if="isShowTestReport || testConfig.artifact_paths.length>0">
        <template slot="label">
          <span>{{$t(`testing.details.advancedSettings.exportReport.filePath`)}}</span>
          <el-tooltip effect="dark" placement="top">
            <div slot="content">{{$t(`testing.details.advancedSettings.exportReport.filePathExplanation`)}}</div>
            <i class="el-icon-question"></i>
          </el-tooltip>
        </template>
        <template>
          <div v-for="(path,index) in testConfig.artifact_paths" :key="index">
            <el-input size="small" v-model="testConfig.artifact_paths[index]" :placeholder="$t(`testing.details.advancedSettings.exportReport.filePath`)" class="export-input">
              <template slot="prepend">$WORKSPACE/</template>
            </el-input>
            <el-button
              @click="deleteArtifactPath(index)"
              type="danger"
              size="small"
              icon="el-icon-minus"
              plain
              circle
            ></el-button>
            <el-button
              v-if="index===testConfig.artifact_paths.length-1"
              @click="addArtifactPath(index)"
              type="primary"
              size="small"
              icon="el-icon-plus"
              plain
              circle
            ></el-button>
          </div>
        </template>
      </el-form-item>

      <BuildAdvancedConfig
        :buildConfig="testConfig"
        :secondaryProp="`pre_test`"
        :validObj="validObj"
        :isCreate="!isEdit"
        @validateFailed="$emit('validateFailed')" />

      <div class="primary-title not-first-child">{{$t(`testing.details.advancedSettings.hooksAndNotification.title`)}}</div>
      <div class="trigger">
        <el-form-item>
          <template slot="label">{{$t(`testing.details.advancedSettings.hooksAndNotification.webhookTitle`)}}</template>
          <el-button @click="addTrigger" type="primary" size="small" plain>{{$t(`global.add`)}}</el-button>
        </el-form-item>
        <TestTrigger
          ref="trigger"
          :projectName="projectName"
          :testName="isEdit ? name : testConfig.name"
          :webhook="testConfig.hook_ctl"
          :avaliableRepos="testConfig.repos"
          :class="{ 'margin-bottom': testConfig.hook_ctl.items.length }" />
      </div>
      <div class="timer">
        <el-form-item>
          <template slot="label">{{$t(`testing.details.advancedSettings.hooksAndNotification.timerTitle`)}}</template>
          <el-button @click="addTimer" type="primary" size="small" plain>{{$t(`global.add`)}}</el-button>
        </el-form-item>
        <TestTimer
          ref="timer"
          timerType="test"
          :projectName="projectName"
          :testName="isEdit ? name : testConfig.name"
          :schedules="testConfig.schedules"
          :class="[testConfig.schedules.items.length === 0 ? 'hidden-table' : 'margin-bottom']"
        />
      </div>

      <div class="notify">
        <el-form-item>
          <template slot="label">{{$t(`testing.details.advancedSettings.hooksAndNotification.notificationTitle`)}}</template>
          <el-button @click="addNotify" type="primary" size="small" plain >{{$t(`global.add`)}}</el-button>
        </el-form-item>
        <Notify
          ref="notifyComp"
          :editMode="isEdit"
          @canAdd="getValid"
          :notify="testConfig.notify_ctls"
          :showTitle="false"
          :fromWorkflow="false"
          class="notify-content"
        />
      </div>
    </el-form>
  </div>
</template>

<script>
import BuildAdvancedConfig from '@/components/projects/build/advancedConfig.vue'
import TestTrigger from '@/components/common/testTrigger.vue'
import Notify from '@/components/projects/workflow/workflowEditor/productWorkflow/modules/notify.vue'
export default {
  props: {
    testConfig: Object,
    allCodeHosts: Array,
    validObj: Object
  },
  data () {
    return {
      isValid: false,
      isShowTestReport: false
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    name () {
      return this.$route.params.test_name
    },
    isEdit () {
      return !!this.name
    }
  },
  methods: {
    getValid (val) {
      this.isValid = val
    },
    validate () {
      return Promise.all([
        this.$refs.advancedRef.validate(), Promise.resolve(this.isValid)
      ])
    },
    addTrigger () {
      this.testConfig.repos.forEach(repo => {
        this.allCodeHosts.forEach(codehost => {
          if (repo.codehost_id === codehost.id) {
            repo.source = codehost.type
          }
        })
      })
      this.$refs.trigger.addWebhookBtn()
    },
    addTimer () {
      this.$refs.timer.addTimerBtn()
    },
    addArtifactPath (index) {
      this.testConfig.artifact_paths.push('')
    },
    deleteArtifactPath (index) {
      this.testConfig.artifact_paths.splice(index, 1)
    },
    addNotify () {
      this.$refs.notifyComp.addNotifyItem()
    },
    add () {
      if (this.testConfig.artifact_paths.length === 0) {
        this.addArtifactPath(0)
        this.isShowTestReport = true
      } else {
        this.isShowTestReport = true
      }
    }
  },
  components: {
    BuildAdvancedConfig,
    TestTrigger,
    Notify
  }
}
</script>

<style lang="less" scoped>
.test-advanced-config-container {
  /deep/.el-form.secondary-form {
    .export-input {
      margin-right: 10px;

      &.el-input {
        width: calc(~'100% - 100px');
        min-width: 400px;
      }
    }
  }

  .hidden-table {
    /deep/.el-table {
      display: none;
    }
  }

  .margin-bottom {
    margin-bottom: 10px;
  }

  .notify {
    /deep/.el-card.notify-content {
      border-color: @borderGray;
      box-shadow: 0 0 0;

      .el-card__body {
        padding: 10px 20px;

        .notify-container {
          margin: 16px 0;
        }
      }
    }
  }
}
</style>
