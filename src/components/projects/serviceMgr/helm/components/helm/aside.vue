<template>
  <div class="helm-aside-container">
    <div class="service-aside-right--resizable"></div>
    <div class="aside__inner">
      <div class="aside-bar">
        <div class="tabs__wrap tabs__wrap_vertical">
          <div class="tabs__item" :class="{'selected': selected === 'var'}" @click="changeRoute('var')">
            <span class="step-name">{{$t('services.helm.imagesSection')}}</span>
          </div>
          <div class="tabs__item" :class="{'selected': selected === 'policy'}" @click="changeRoute('policy')">
            <span class="step-name">{{$t('services.common.policySection')}}</span>
          </div>
          <div class="tabs__item" :class="{'selected': selected === 'help'}" @click="changeRoute('help')">
            <span class="step-name">{{$t('services.common.helpSection')}}</span>
          </div>
        </div>
      </div>
      <div class="aside__content">
        <div v-if="selected === 'var'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.helm.imagesSection')}}</div>
          </header>
          <div class="service-aside-box__content">
            <h4>
              <span>
                <i class="iconfont iconfuwu"></i>
              </span> {{$t('services.common.detectedServiceModules')}}
              <el-tooltip effect="dark" placement="top">
                <div slot="content">{{$t('services.helm.detectedServiceModulesTooltip')}}</div>
                <span>
                  <i class="el-icon-question"></i>
                </span>
              </el-tooltip>
              <el-button type="text" size="small" @click="updateMatchRuleFlag = true" :disabled="!isProjectAdmin">{{$t('services.helm.updateMatchRules')}}</el-button>
            </h4>
            <el-table :data="serviceModules" stripe style="width: 100%;">
              <el-table-column prop="name" :label="$t('services.common.serviceModule')"></el-table-column>
              <el-table-column prop="image_name" :label="$t('services.common.serviceImageName')"></el-table-column>
              <el-table-column prop="image" :label="$t('services.common.serviceImageLabel')"></el-table-column>
              <el-table-column :label="$t('services.common.buildInfoAndOperation')">
                <template slot-scope="scope">
                  <div v-for="(buildName, index) in scope.row.build_names" :key="index">
                    <span class="build-name" @click="editBuild(scope.row.name, buildName)">{{ buildName }}</span>
                  </div>
                  <el-button v-hasPermi="{projectName: projectName, action: 'create_build',isBtn:true}" size="small" type="text" @click="addBuild(scope.row.name, scope.row.build_names)">{{$t('services.common.addServiceBuild')}}</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="service-aside-box__content">
            <h4>
              <span>
                <i class="iconfont iconfuwu"></i>
              </span> {{$t('services.helm.helmReleaseNameConfiguration')}}
            </h4>
            <div class="release-name-config">
              <span class="title">
                {{$t('services.helm.helmReleaseName')}}
                <el-tooltip effect="dark" placement="top">
                  <div slot="content">
                    <span>支持如下内置变量和常量：</span>
                    <br />
                    <span>
                      <span style="display: inline-block; width: 100px;">$Product$</span>项目名称
                    </span>
                    <br />
                    <span>
                      <span style="display: inline-block; width: 100px;">$Service$</span>服务名称
                    </span>
                    <br />
                    <span>
                      <span style="display: inline-block; width: 100px;">$Namespace$</span>命名空间
                    </span>
                    <br />
                    <span>
                      <span style="display: inline-block; width: 100px;">$EnvName$</span>环境名称
                    </span>
                    <br />
                  </div>
                  <span>
                    <i class="icon el-icon-question"></i>
                  </span>
                </el-tooltip>
              </span>
              <el-input
                size="mini"
                style="display: inline-block;"
                :value="currentService && currentService.release_naming"
                @input="handleInputChange"
                placeholder="请输入 Release 名称"
              ></el-input>
              <el-button size="mini" @click="renamingHelmRelease" :disabled="!isProjectAdmin" type="primary" plain>{{$t(`global.save`)}}</el-button>
            </div>
          </div>
        </div>
        <div v-else-if="selected === 'policy'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.common.policySection')}}</div>
          </header>
          <div class="service-aside-help__content">
            <Policy />
          </div>
        </div>
        <div v-else-if="selected === 'help'" class="service-aside--variables">
          <header class="service-aside-box__header">
            <div class="service-aside-box__title">{{$t('services.common.helpSection')}}</div>
          </header>
          <div class="service-aside-help__content">
            <Help />
          </div>
        </div>
      </div>
    </div>
    <MatchRule :value.sync="updateMatchRuleFlag" />
  </div>
</template>
<script>
import qs from 'qs'
import bus from '@utils/eventBus'
import { mapState } from 'vuex'
import Policy from '../../../k8s/container/policy.vue'
import Help from './help.vue'
import MatchRule from './matchRule.vue'
import { cloneDeep } from 'lodash'
import store from 'storejs'
import { renamingHelmReleaseAPI, queryUserBindingsAPI } from '@api'
export default {
  props: {
    changeExpandFileList: Function,
    isGuide: {
      default: false,
      type: Boolean
    }
  },
  data () {
    return {
      updateMatchRuleFlag: false,
      userBindings: []
    }
  },
  methods: {
    addBuild (name, build_names) {
      // no build: no suffix
      // build: the last number, take the maximum value + 1
      const buildNameIndex = build_names.length
        ? Math.max.apply(
          null,
          build_names.map(buildName => {
            const names = buildName.split('-')
            const last = names[names.length - 1]
            return isNaN(last) ? 1 : Number(last) + 1
          })
        )
        : 0
      const item = {
        id: name,
        type: 'components',
        componentsName: 'CommonBuild',
        label: '新增构建',
        name: name,
        isEdit: false,
        buildNameIndex
      }
      this.changeExpandFileList('add', item)
    },
    editBuild (name, buildName) {
      const item = {
        id: name,
        type: 'components',
        componentsName: 'CommonBuild',
        label: '修改构建',
        name: name,
        isEdit: true,
        buildName: buildName
      }
      this.changeExpandFileList('add', item)
    },
    handleInputChange (value) {
      const service = cloneDeep(this.currentService)
      service.release_naming = value
      this.$store.commit('CURRENT_SERVICE', service)
    },
    renamingHelmRelease () {
      const projectName = this.projectName
      const payload = {
        service_name: this.serviceName,
        naming: this.currentService.release_naming
      }
      this.$confirm(
        this.isGuide ? '确认修改 Helm Release 名称？' : '修改后服务会在已部署的环境中重建，请确认?',
        '修改 Helm Release 名称',
        {
          confirmButtonText: this.$t(`global.confirm`),
          cancelButtonText: this.$t(`global.cancel`),
          type: 'warning'
        }
      )
        .then(() => {
          renamingHelmReleaseAPI(projectName, payload).then(res => {
            this.$message({
              message: this.isGuide ? 'Helm Release 名称修改成功' : '服务正在重启，稍后请前往环境中确认',
              type: 'success'
            })
          })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消保存'
          })
        })
    },
    changeRoute (step) {
      this.$router.replace({
        query: Object.assign(
          {},
          qs.parse(window.location.search, { ignoreQueryPrefix: true }),
          {
            rightbar: step
          }
        )
      })
    },
    async getUserBinding (projectName) {
      const userInfo = store.get('userInfo')
      const userBindings = await queryUserBindingsAPI(
        userInfo.uid,
        projectName
      ).catch(error => console.log(error))
      if (userBindings) {
        this.userBindings = userBindings
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    ...mapState({
      serviceModules: state => state.serviceManage.serviceModules,
      currentService: state => state.serviceManage.currentService
    }),
    serviceName () {
      return this.$route.query.service_name
    },
    selected () {
      return this.$route.query.rightbar || 'var'
    },
    isProjectAdmin () {
      if (this.$utils.roleCheck('admin')) {
        return true
      } else if (this.userBindings.length > 0) {
        return this.userBindings.some(item => item.role === 'project-admin')
      } else {
        return false
      }
    }
  },
  mounted () {
    this.getUserBinding(this.projectName)
  },
  beforeDestroy () {
    bus.$off('save-var')
  },
  components: {
    Policy,
    Help,
    MatchRule
  }
}
</script>
<style lang="less">
.helm-aside-container {
  position: relative;
  display: flex;
  flex: 1;
  height: 100%;

  .kv-container {
    .el-table {
      .unused {
        background: #e6effb;
      }

      .present {
        background: #fff;
      }

      .new {
        background: oldlace;
      }
    }

    .el-table__row {
      .cell {
        span {
          font-weight: 400;
        }

        .operate {
          font-size: 1.12rem;

          .delete {
            color: #ff1949;
          }

          .edit {
            color: @themeColor;
          }
        }
      }
    }

    .render-value {
      display: block;
      max-width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .add-key-container {
      .el-form-item__label {
        display: none;
      }

      .el-form-item {
        margin-bottom: 15px;
      }
    }

    .add-kv-btn {
      margin-top: 10px;
    }
  }

  .service-aside-right--resizable {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 99;
    width: 5px;
    height: 100%;
    border-left: 1px solid transparent;
    transition: border-color ease-in-out 200ms;
  }

  .aside__inner {
    display: flex;
    flex: 1;
    flex-direction: row-reverse;
    box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);

    .aside__content {
      flex: 1;
      width: 200px;
      overflow-x: hidden;
      background-color: #fff;

      .service-aside--variables {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        height: 100%;

        .service-aside-box__header {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 35px;
          padding: 10px 7px 10px 20px;

          .service-aside-box__title {
            margin-right: 20px;
            margin-bottom: 0;
            color: #000;
            font-weight: bold;
            font-size: 16px;
            text-transform: uppercase;
          }
        }

        .service-aside-box__content {
          padding: 12px 16px;

          h4 {
            margin: 0;
            padding: 0;
            color: #909399;
            font-weight: 300;
          }

          .release-name-config {
            margin-top: 10px;
            margin-bottom: 10px;

            .icon {
              cursor: pointer;
            }

            .title {
              color: #606266;
              font-size: 13px;
            }

            .el-input {
              width: 60%;
            }
          }

          .el-table td,
          .el-table th {
            padding: 6px 0;
          }

          .build-name {
            display: inline-block;
            margin-top: 5px;
            color: @themeColor;
            font-size: 12px;
            line-height: 16px;
            cursor: pointer;

            &:hover {
              color: @themeBorderColor;
            }
          }
        }

        .service-aside-help__content {
          display: flex;
          flex: 1;
          flex-direction: column;
          height: 100%;
          padding: 0 20px 30px 20px;
          overflow-y: auto;
        }
      }

      .btn-container {
        padding: 0 10px 10px 10px;
        box-shadow: 0 4px 4px 0 rgba(0, 0, 0, 0.05);

        .save-btn {
          padding: 10px 17px;
          color: #fff;
          font-size: 13px;
          text-decoration: none;
          background-color: @themeColor;
          border: 1px solid @themeColor;
          cursor: pointer;
          transition: background-color 300ms, color 300ms, border 300ms;
        }
      }
    }

    .aside-bar {
      .tabs__wrap_vertical {
        flex-direction: column;
        width: 47px;
        height: 100%;
        background-color: #f5f5f5;
        border: none;

        .tabs__item {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: -1px;
          padding: 17px 30px;
          padding: 20px 17px;
          color: #4c4c4c;
          color: #000;
          font-size: 13px;
          text-transform: uppercase;
          text-orientation: mixed;
          background-color: transparent;
          background-color: #f5f5f5;
          border: none;
          border-top: 1px solid transparent;
          cursor: pointer;
          transition: background-color 150ms ease, color 150ms ease;

          &.selected {
            z-index: 1;
            background-color: #fff;
            border: none;
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
          }

          &:hover {
            z-index: 2;
            color: #000;
            background-color: #fff;
            border: none;
            box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
          }

          .step-name {
            font-weight: 500;
            font-size: 14px;
            writing-mode: vertical-rl;
          }
        }
      }

      .tabs__wrap {
        display: flex;
        justify-content: flex-start;
        height: 56px;
      }
    }
  }
}
</style>
