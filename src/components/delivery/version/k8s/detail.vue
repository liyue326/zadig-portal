<template>
  <div v-loading="loading" class="version-detail-container">
    <el-dialog :visible.sync="exportModal.visible" width="65%" :title="$t('deliveryCenter.viewServiceConfiguration')" class="export-dialog">
      <span v-if="exportModal.textObjects.length === 0" class="nothing">{{ $t('global.emptyText')}}</span>
      <template v-else>
        <div v-for="(obj, i) of exportModal.textObjects" :key="obj.originalText" class="config-viewer">
          <div>
            <div :class="{'op-row': true, expanded: obj.expanded}">
              <el-button @click="toggleYAML(obj)" type="text" icon="el-icon-caret-bottom">{{ obj.expanded ? $t('global.collapse') : $t('global.expand') }}</el-button>
              <el-button @click="copyYAML(obj, i)" type="primary" plain size="small" class="at-right">{{$t(`global.copy`)}}</el-button>
            </div>
            <Editor
              v-show="obj.expanded"
              :value="obj.readableText"
              :options="exportModal.editorOption"
              @init="editorInit($event, obj)"
              lang="yaml"
              theme="tomorrow_night"
              width="100%"
              height="800"
            />
          </div>
        </div>
      </template>
    </el-dialog>
    <el-dialog
      :title="`版本发布 ${workflowToRun.version}`"
      :visible.sync="runWorkflowFromVersionDialogVisible"
      custom-class="run-workflow"
      width="60%"
    >
      <div>
        <RunWorkflowFromVersion
          v-if="workflowToRun.workflowName"
          :workflowName="workflowToRun.workflowName"
          :projectName="workflowToRun.projectName"
          :displayName="workflowToRun.displayName"
          :imageConfigs="imagesAndConfigs"
        />
      </div>
    </el-dialog>
    <el-tabs type="border-card">
      <el-tab-pane :label="$t('deliveryCenter.versionInfo')">
        <div class="el-card box-card task-process is-always-shadow">
          <div class="el-card__header">
            <div class="clearfix">
              <span>{{$t('global.basicInfo')}}</span>
            </div>
          </div>
          <div class="el-card__body">
            <div class="text item">
              <div class="el-row">
                <div class="el-col el-col-6">
                  <div class="item-title">{{$t('deliveryCenter.versionName')}}</div>
                </div>
                <div class="el-col el-col-6">
                  <div class="item-desc">{{currentVersionDetail.versionInfo.version}}</div>
                </div>
                <div class="el-col el-col-6">
                  <div class="item-title">{{$t('deliveryCenter.originProject')}}</div>
                </div>
                <div class="el-col el-col-6">
                  <div class="item-desc">
                    <span>{{currentVersionDetail.versionInfo.productName}}</span>
                  </div>
                </div>
              </div>
              <div class="el-row">
                <div class="el-col el-col-6">
                  <div class="item-title"> {{$t('project.workflows')}}</div>
                </div>
                <div class="el-col el-col-6">
                  <div class="item-desc">
                    <span v-if="currentVersionDetail.versionInfo.taskId" class="link">
                      <router-link
                        :to="`/v1/projects/detail/${currentVersionDetail.versionInfo.productName}/pipelines/multi/${currentVersionDetail.versionInfo.workflowName}/${currentVersionDetail.versionInfo.taskId}?display_name=${currentVersionDetail.versionInfo.workflowDisplayName}`"
                      >
                        {{currentVersionDetail.versionInfo.workflowDisplayName + '#'
                        +currentVersionDetail.versionInfo.taskId}}
                      </router-link>
                    </span>
                  </div>
                </div>
                <div class="el-col el-col-6">
                  <div class="item-title">{{$t('global.desc')}}</div>
                </div>
                <div class="el-col el-col-6">
                  <div class="item-desc">{{currentVersionDetail.versionInfo.desc}}</div>
                </div>
              </div>
              <div class="el-row">
                <div class="el-col el-col-6">
                  <div class="item-title">{{$t('global.creator')}}</div>
                </div>
                <div class="el-col el-col-6">
                  <div class="item-desc">{{currentVersionDetail.versionInfo.createdBy}}</div>
                </div>
                <div class="el-col el-col-6">
                  <div class="item-title"> {{$t('deliveryCenter.creationTime')}}</div>
                </div>
                <div class="el-col el-col-6">
                  <div class="item-desc">{{$utils.convertTimestamp(currentVersionDetail.versionInfo.created_at)}}</div>
                </div>
              </div>
              <div class="el-row">
                <div class="el-col el-col-6">
                  <div class="item-title"> {{$t('deliveryCenter.versionTag')}}</div>
                </div>
                <div class="el-col el-col-6">
                  <div class="item-desc">
                    <span v-for="(label,index) in currentVersionDetail.versionInfo.labels" :key="index" style="margin-right: 3px;">
                      <el-tag size="small">{{label}}</el-tag>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="el-card box-card task-process is-always-shadow">
          <div class="el-card__header">
            <div class="clearfix">
              <span>{{$t('deliveryCenter.deliveryContent')}}</span>
            </div>
          </div>
          <div v-if="jiraIssues.length > 0" class="el-card__body">
            <div class="text item">
              <div class="section-head">{{$t('deliveryCenter.jiraInfo')}}</div>
              <el-table :data="jiraIssues" style="width: 100%;">
                <el-table-column :label="$t(`global.serviceName`)">
                  <template slot-scope="scope">{{scope.row.service_name}}</template>
                </el-table-column>

                <el-table-column :label="$t('deliveryCenter.jiraIssues')">
                  <template slot-scope="scope">
                    <el-popover
                      v-for="(issue,index) in scope.row.issues"
                      :key="index"
                      trigger="hover"
                      placement="top"
                      popper-class="issue-popper"
                    >
                      <p>{{$t('deliveryCenter.issueReporter')}}: {{issue.reporter?issue.reporter:'*'}}</p>
                      <p>{{$t('deliveryCenter.issueAssignee')}}: {{issue.assignee?issue.assignee:'*'}}</p>
                      <p>{{$t('deliveryCenter.issuePriority')}}: {{issue.priority?issue.priority:'*'}}</p>
                      <span slot="reference" class="issue-name-wrapper text-center">
                        <a :href="issue.url" target="_blank">{{`${issue.key} ${issue.summary}`}}</a>
                      </span>
                    </el-popover>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
          <div v-if="imagesAndConfigs.length > 0" class="el-card__body">
            <div class="text item">
              <div class="section-head">{{$t('deliveryCenter.imageAndServiceConfiguration')}}</div>
              <el-table :data="imagesAndConfigs" style="width: 100%;">
                <el-table-column :label="$t('deliveryCenter.serviceAndServiceModule')">
                  <template slot-scope="scope">{{$utils.showServiceName(scope.row.containerName)}}</template>
                </el-table-column>
                <el-table-column :label="$t('deliveryCenter.imageName')">
                  <template slot-scope="scope">
                    <router-link :to="`/v1/delivery/artifacts?image=${scope.row.registryName}`">
                      <span class="img-link">{{scope.row.registryName}}</span>
                    </router-link>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('deliveryCenter.serviceConfiguration')" width="130px">
                  <template slot-scope="scope">
                    <el-button type="text" @click="showConfig(scope.row.yamlContents)">{{$t('global.view')}}</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <div v-if="packages.length > 0" class="el-card__body">
            <div class="text item">
              <div class="section-head">{{$t('deliveryCenter.packageInfo')}}</div>
              <el-table :data="packages" style="width: 100%;">
                <el-table-column :label="$t(`global.serviceName`)">
                  <template slot-scope="scope">{{scope.row.serviceName}}</template>
                </el-table-column>
                <el-table-column :label="$t('deliveryCenter.packageFileName')">
                  <template slot-scope="scope">{{scope.row.packageFile}}</template>
                </el-table-column>
              </el-table>
            </div>
          </div>
          <div v-if="orderedServices.length > 0" class="el-card__body">
            <div class="text item">
              <div class="section-head">{{$t('deliveryCenter.serviceStartupSequence')}}</div>
              <el-table :data="orderedServices" style="width: 100%;">
                <el-table-column :label="$t('deliveryCenter.startupSequence')">
                  <template slot-scope="scope">{{scope.$index}}</template>
                </el-table-column>
                <el-table-column :label="$t(`global.serviceName`)">
                  <template slot-scope="scope">{{scope.row.join(' , ')}}</template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane v-if="showArtifactDeployBtn" disabled>
        <el-button
          v-if="checkPermissionSyncMixin({projectName: projectName, action: 'run_workflow',isBtn: true})"
          icon="el-icon-upload2"
          @click="runWorkflowFromVersion"
          slot="label"
          size="mini"
          type="text"
        >{{$t('deliveryCenter.releaseCurrentVersion')}}</el-button>
        <template v-else slot="label">
          <div>
            <el-tooltip effect="dark" :content="$t('permission.lackPermission')" placement="top">
              <el-button size="mini" type="text" icon="el-icon-upload2" class="permission-disable">{{$t('deliveryCenter.releaseCurrentVersion')}}</el-button>
            </el-tooltip>
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { getVersionListAPI } from '@api'
import { uniqBy } from 'lodash'
import Editor from 'vue2-ace-bind'
import RunWorkflowFromVersion from '../container/runWorkflow.vue'
export default {
  data () {
    return {
      workflowToRun: {
        workflowName: '',
        projectName: '',
        displayName: '',
        version: ''
      },
      loading: false,
      runWorkflowFromVersionDialogVisible: false,
      currentVersionDetail: {
        versionInfo: {},
        buildInfo: [],
        deployInfo: [],
        testInfo: [],
        securityStatsInfo: []
      },
      imagesAndConfigs: [],
      codeLists: [],
      testLists: [],
      jiraIssues: [],
      systemTests: [],
      performanceTests: [],
      orderedServices: [],
      packages: [],
      exportModal: {
        textObjects: [],
        visible: false,
        loading: false,
        editorOption: {
          showLineNumbers: true,
          showFoldWidgets: true,
          showGutter: true,
          displayIndentGuides: true,
          showPrintMargin: false,
          readOnly: true,
          tabSize: 2,
          maxLines: Infinity
        }
      },
      window: window
    }
  },
  methods: {
    runWorkflowFromVersion () {
      this.runWorkflowFromVersionDialogVisible = true
      this.workflowToRun.projectName = this.currentVersionDetail.versionInfo.productName
      this.workflowToRun.version = this.currentVersionDetail.versionInfo.version
      this.workflowToRun.workflowName = this.currentVersionDetail.versionInfo.workflowName
      this.workflowToRun.displayName = this.currentVersionDetail.versionInfo.workflowDisplayName
    },
    getVersionDetail () {
      const versionId = this.versionId
      const projectName = this.projectName
      getVersionListAPI('', projectName, '').then(res => {
        const currentVersionDetail = res.find(
          item => item.versionInfo.id === versionId
        )
        this.transformData(currentVersionDetail)
        this.$set(this, 'currentVersionDetail', currentVersionDetail)
      })
    },
    transformData (current_version_info) {
      if (current_version_info.distributeInfo) {
        current_version_info.distributeInfo.forEach(distribute => {
          current_version_info.deployInfo.forEach(deploy => {
            if (distribute.serviceName === deploy.containerName) {
              distribute.yamlContents = deploy.yamlContents
            }
          })
        })
        current_version_info.distributeInfo.forEach(distribute => {
          if (distribute.distributeType === 'file') {
            this.packages.push({
              serviceName: distribute.serviceName,
              packageFile: distribute.packageFile
            })
          }
        })
      }
      if (current_version_info.deployInfo) {
        current_version_info.deployInfo.forEach(artifactDeploy => {
          const serviceName = artifactDeploy.serviceName.includes('_') ? artifactDeploy.serviceName.split('_')[0] : artifactDeploy.serviceName
          const containerName = artifactDeploy.containerName.includes('_') ? artifactDeploy.containerName.split('_')[0] : artifactDeploy.containerName
          this.imagesAndConfigs.push({
            serviceName: serviceName,
            containerName: containerName,
            registryName: artifactDeploy.image,
            yamlContents: artifactDeploy.yamlContents,
            registryId: artifactDeploy.registry_id
          })
        })
      }

      if (current_version_info.buildInfo) {
        current_version_info.buildInfo.forEach(build => {
          // Code list
          this.codeLists = this.codeLists.concat(build.commits)
          // Jira issues
          if (build.issues.length > 0) {
            this.jiraIssues.push({
              service_name: build.serviceName,
              issues: build.issues
            })
          }
        })
      }

      if (current_version_info.testInfo) {
        current_version_info.testInfo.forEach(test => {
          // Test list
          this.testLists = this.testLists.concat(test.testReports)
        })
      }
      this.codeLists = uniqBy(this.codeLists, 'repo_name')

      this.testLists.forEach(element => {
        if (element.testSuite) {
          element.testSuite.testName = element.testName
          element.testSuite.workflowName = element.workflowName
          element.testSuite.taskId = element.taskId
          element.testSuite.testResultPath = element.testResultPath
          this.systemTests.push(element.testSuite)
        } else if (element.performanceTestSuite.length > 0) {
          element.performanceTestSuite[0].testName = element.testName
          element.performanceTestSuite[0].workflowName = element.workflowName
          element.performanceTestSuite[0].taskId = element.taskId
          element.performanceTestSuite[0].testResultPath =
            element.testResultPath
          this.performanceTests.push(element.performanceTestSuite[0])
        }
      })

      // orderedServices
      if (current_version_info.deployInfo.length > 0) {
        this.orderedServices =
          current_version_info.deployInfo[0].orderedServices
      }
    },
    showConfig (data) {
      this.exportModal.visible = true
      this.exportModal.textObjects = []
      this.exportModal.textObjects = this.$utils
        .mapToArray(data, 'key')
        .map(txt => ({
          originalText: txt,
          readableText: txt.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
          expanded: true,
          editor: null
        }))
    },
    editorInit (e, obj) {
      obj.editor = e
    },
    copyYAML (obj, i) {
      const e = obj.editor
      e.setValue(obj.originalText)
      e.focus()
      e.selectAll()
      if (document.execCommand('copy')) {
        this.$message.success('复制成功')
      } else {
        this.$message.error('复制失败')
      }
      e.setValue(obj.readableText)
    },
    toggleYAML (obj) {
      obj.expanded = !obj.expanded
    },
    copyAllYAML () {
      const textArea = document.createElement('textarea')
      textArea.value = this.exportModal.textObjects
        .map(obj => obj.originalText)
        .join('\n\n---\n\n')
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      if (document.execCommand('copy')) {
        this.$message.success('复制成功')
      } else {
        this.$message.error('复制失败')
      }

      document.body.removeChild(textArea)
    }
  },
  computed: {
    versionId () {
      return this.$route.params.id
    },
    showArtifactDeployBtn () {
      // Compatible with historical data: buildInfo exists and is empty
      if (
        this.currentVersionDetail.deployInfo.length !== 0 &&
        (!this.currentVersionDetail.buildInfo ||
          this.currentVersionDetail.buildInfo.length === 0)
      ) {
        return true
      } else {
        return false
      }
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  created () {
    this.getVersionDetail()
  },
  components: {
    Editor,
    RunWorkflowFromVersion
  }
}
</script>

<style lang="less">
.issue-popper {
  display: inline-block;
  font-size: 14px;

  p {
    margin: 0.5em 0;
  }

  .issue-url {
    color: @themeColor;
    cursor: pointer;
  }
}

.version-detail-container {
  position: relative;
  flex: 1;
  padding: 24px 24px;
  overflow: auto;

  .el-table td,
  .el-table th {
    padding: 5px 0;
  }

  .img-link {
    color: @themeColor;
  }

  .text {
    font-size: 13px;
  }

  .item {
    padding: 10px 0;
    padding-left: 1px;

    .icon-color {
      color: #9ea3a9;
      cursor: pointer;

      &:hover {
        color: @themeColor;
      }
    }

    .icon-color-cancel {
      color: #ff4949;
      cursor: pointer;
    }

    .status {
      line-height: 24px;
    }
  }

  .clearfix::before,
  .clearfix::after {
    display: table;
    content: '';
  }

  .clearfix {
    span {
      color: #999;
      font-size: 16px;
      line-height: 20px;
    }
  }

  .clearfix::after {
    clear: both;
  }

  .el-tabs {
    .el-tabs__header {
      .el-tabs__nav {
        width: 100%;

        .el-tabs__item {
          &.is-disabled {
            float: right;

            span {
              color: @themeColor;
              cursor: pointer;
            }

            .permission-disable {
              i,
              span {
                color: #ccc;
                cursor: pointer;
              }
            }
          }
        }
      }
    }
  }

  .box-card {
    background-color: #fff;

    .item-title {
      color: #8d9199;
    }

    .item-desc {
      .start-build,
      .edit-pipeline {
        color: @themeColor;
        font-size: 13px;
        cursor: pointer;
      }
    }

    .color-passed {
      color: #6ac73c;
      font-weight: 500;
    }

    .color-failed {
      color: #ff1949;
      font-weight: 500;
    }

    .color-cancelled {
      color: #909399;
      font-weight: 500;
    }

    .color-timeout {
      color: #e6a23c;
      font-weight: 500;
    }

    .color-running {
      color: @themeColor;
      font-weight: 500;
    }

    .color-created {
      color: #cdb62c;
      font-weight: 500;
    }

    .color-notrunning {
      color: #303133;
      font-weight: 500;
    }

    .issue-tag {
      margin-right: 5px;
      margin-bottom: 5px;
      cursor: pointer;
    }

    .deploy_env {
      color: @themeColor;
    }

    .error-color {
      color: #fa6464;
    }

    .show-log {
      font-size: 1.33rem;
      cursor: pointer;

      &:hover {
        color: @themeColor;
      }
    }

    .show-test-result {
      color: @themeColor;
      cursor: pointer;
    }

    .show-log-title {
      line-height: 17px;
    }

    .operation {
      line-height: 16px;
    }
  }

  .box-card,
  .task-process {
    border: none;
    box-shadow: none;
  }

  .task-process {
    width: 100%;
  }

  .el-card__header {
    padding-top: 0;
    padding-bottom: 5px;
    padding-left: 0;
  }

  .el-card__body {
    padding: 2px 20px;
  }

  .el-row {
    margin-bottom: 15px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .link,
  .issue-name-wrapper {
    display: block;

    a {
      color: @themeColor;
      cursor: pointer;
    }
  }

  .section-head {
    width: 222px;
    height: 28px;
    margin-bottom: 15px;
    color: #666;
    font-size: 14px;
    line-height: 28px;
    border-bottom: 1px solid #eee;
  }

  a.item-desc {
    color: @themeColor;
    cursor: pointer;
  }

  .test-report-link {
    a {
      color: @themeColor;
    }
  }

  .export-dialog {
    .op-row {
      display: flex;
      margin-bottom: 5px;

      .el-icon-caret-bottom {
        transform: rotate(-90deg);
        transition: transform 0.3s ease-out;
      }

      .at-right {
        display: none;
        margin-left: auto;
      }

      &.expanded {
        .el-icon-caret-bottom {
          transform: rotate(0);
        }

        .at-right {
          display: inline;
        }
      }

      .el-button--small {
        height: 32px;
      }
    }

    .nothing {
      color: #000;
    }
  }

  .pointer {
    cursor: pointer;
  }
}
</style>
