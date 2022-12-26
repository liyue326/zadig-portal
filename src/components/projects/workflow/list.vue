<template>
  <div class="workflow-list" ref="workflow-list">
    <div
      v-loading="workflowListLoading"
      class="pipeline-loading"
      :element-loading-text="$t(`global.loading`)"
      element-loading-spinner="iconfont iconfont-loading icongongzuoliucheng"
    >
      <ul class="workflow-ul">
        <div class="project-header">
          <div class="header-start">
            <div class="container">
              <div class="function-container">
                <div class="btn-container">
                  <button type="button" :class="{'active':showFavorite}" @click="showFavorite=!showFavorite" class="display-btn">
                    <i class="el-icon-star-on favorite"></i>
                  </button>
                  <el-dropdown @command="sortWorkflow" placement="bottom">
                    <button type="button" class="display-btn">
                      <i class="el-icon-sort sort"></i>
                    </button>
                    <el-dropdown-menu slot="dropdown">
                      <el-dropdown-item command="name-asc">{{$t(`workflow.ascendingByName`)}}</el-dropdown-item>
                      <el-dropdown-item command="name-desc">{{$t(`workflow.descendingByName`)}}</el-dropdown-item>
                      <el-dropdown-item command="time-asc">{{$t(`workflow.ascendingByCreationTime`)}}</el-dropdown-item>
                      <el-dropdown-item command="time-desc">{{$t(`workflow.descendingByCreationTime`)}}</el-dropdown-item>
                    </el-dropdown-menu>
                  </el-dropdown>
                  <div class="view-container">
                    <el-radio-group v-model="view" size="small">
                      <el-radio-button label>{{$t(`global.all`)}}</el-radio-button>
                      <el-radio-button v-for="(item,index) in viewList" :key="index" :label="item">{{item}}</el-radio-button>
                    </el-radio-group>
                    <div v-if="isProjectAdmin" class="view-operation">
                      <el-tooltip effect="dark" :content="$t(`workflow.addView`)" placement="top-start">
                        <el-button
                          icon="el-icon-plus"
                          type="primary"
                          @click="workflowViewOperation('add')"
                          class="add"
                          size="mini"
                          plain
                          circle
                        ></el-button>
                      </el-tooltip>
                      <el-tooltip v-if="view" effect="dark" :content="$t(`workflow.editView`)" placement="top-start">
                        <el-button
                          icon="el-icon-edit-outline"
                          type="primary"
                          size="mini"
                          @click="workflowViewOperation('edit')"
                          plain
                          circle
                        ></el-button>
                      </el-tooltip>
                      <el-tooltip v-if="view" effect="dark" :content="$t(`workflow.delView`)" placement="top-start">
                        <el-button icon="el-icon-minus" type="danger" size="mini" @click="removeWorkflowView" plain circle></el-button>
                      </el-tooltip>
                    </div>
                  </div>
                </div>
                <el-input
                  v-model="keyword"
                  :placeholder="$t(`workflow.searchWorkflow`)"
                  class="search-workflow"
                  prefix-icon="el-icon-search"
                  clearable
                ></el-input>
              </div>
            </div>
          </div>
        </div>
        <VirtualList
          v-if="availableWorkflows.length > 0"
          class="virtual-list-container"
          :data-key="'name'"
          :data-sources="availableWorkflows"
          :keeps="20"
          :estimate-size="82"
          :data-component="itemComponent"
        />
        <div v-if="availableWorkflows.length === 0 && !workflowListLoading" class="no-product">
          <img src="@assets/icons/illustration/workflow.svg" alt />
          <p>{{$t(`workflow.noWorkflow`)}}</p>
        </div>
      </ul>
    </div>

    <el-dialog :title="$t(`workflow.chooseWorkflowType`)" :visible.sync="showSelectWorkflowType" width="450px">
      <div class="type-content">
        <el-radio v-model="selectWorkflowType" label="product">{{$t(`workflow.productWorkflow`)}}</el-radio>
        <div class="type-desc">{{$t(`workflow.productWorkflowAbility`)}}</div>
        <el-radio v-model="selectWorkflowType" label="custom">
          {{$t(`workflow.customWorkflow`)}}
          <el-tag type="primary" size="mini" class="mg-l8" effect="plain">New</el-tag>
        </el-radio>
        <div class="type-desc">{{$t(`workflow.customWorkflowAbility`)}}</div>
        <el-radio v-model="selectWorkflowType" label="release" v-if="hasPlutus">
          {{$t(`workflow.releaseWorkflow`)}}
          <el-tag type="primary" size="mini" class="mg-l8" effect="plain">New</el-tag>
        </el-radio>
        <div class="type-desc" v-if="hasPlutus">{{$t(`workflow.releaseWorkflowAbility`)}}</div>
      </div>
      <div slot="footer">
        <el-button size="small" @click="showSelectWorkflowType = false">{{$t(`global.cancel`)}}</el-button>
        <el-button size="small" type="primary" @click="createWorkflow">{{$t(`global.confirm`)}}</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="$t(`workflow.runProductWorkflow`)" :visible.sync="showStartProductBuild" custom-class="run-workflow" width="60%">
      <RunProductWorkflow
        v-if="workflowToRun.name"
        :workflowName="workflowToRun.name"
        :displayName="workflowToRun.display_name"
        :workflowMeta="workflowToRun"
        :targetProject="workflowToRun.product_tmpl_name"
        @success="hideProductTaskDialog"
      />
    </el-dialog>
    <el-dialog
      :visible.sync="isShowRunCustomWorkflowDialog"
      :title="$t(`workflow.runWorkflow`)"
      custom-class="run-workflow"
      width="60%"
      class="dialog"
    >
      <RunCustomWorkflow
        v-if="workflowToRun.name"
        :workflowName="workflowToRun.name"
        :displayName="workflowToRun.display_name"
        :projectName="projectName"
        @success="hideAfterSuccess"
      />
    </el-dialog>
    <el-dialog
      :title="operateType==='add'?$t(`workflow.addView`): $t(`workflow.editView`)"
      :visible.sync="showWorkflowViewDialog"
      :close-on-click-modal="false"
    >
      <el-form :model="workflowViewForm" ref="workflowViewForm" label-position="left">
        <el-form-item
          :label="$t(`workflow.viewName`)"
          prop="name"
          :rules="{required: true, message: $t(`workflow.inputViewName`), trigger: ['blur', 'change']}"
        >
          <el-input v-model="workflowViewForm.name" :placeholder="$t(`workflow.viewName`)" clearable></el-input>
        </el-form-item>
        <el-form-item :label="$t(`workflow.selectWorkflow`)" prop="workflows">
          <div style="width: 100%; max-height: 450px; overflow-y: auto;">
            <el-checkbox
              v-model="item.enabled"
              :label="item"
              v-for="item in presetWorkflowInfo.workflows"
              :key="item.workflow_name"
              style="display: block;"
            >{{item.workflow_display_name}}</el-checkbox>
          </div>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button type="primary" size="small" @click="editView('workflowViewForm')">{{$t(`global.confirm`)}}</el-button>
        <el-button size="small" @click="cancelEditView('workflowViewForm')">{{$t(`global.cancel`)}}</el-button>
      </span>
    </el-dialog>
    <el-dialog
      :title="$t(`workflow.selectTemplate`)"
      :visible.sync="showWorkflowTemplateDialog"
      :close-on-click-modal="false"
      class="model-dialog"
      width="60%"
    >
      <el-card shadow="hover" @mouseover.native="currentTemplate=''">
        <div class="card" style="height: 30px; line-height: 30px;">
          <div>
            <i class="el-icon-plus"></i>
            {{$t(`workflow.addEmptyWorkflow`)}}
          </div>
          <div v-if="!currentTemplate">
            <router-link
              class="card-btn"
              :to="`/v1/projects/detail/${projectName}/pipelines/${selectWorkflowType}/create?projectName=${projectName}`"
            >{{$t(`workflow.use`)}}</router-link>
          </div>
        </div>
      </el-card>
      <div>
        <div class="title" v-if="selectWorkflowType==='release'">{{$t(`workflow.releaseWorkflowTemplate`)}}</div>
        <div class="title" v-if="selectWorkflowType==='custom'">{{$t(`workflow.customWorkflowTemplate`)}}</div>
        <el-card
          shadow="hover"
          v-for="(item) in customWorkflowTemplates"
          :key="item.id"
          class="mg-b8"
          @mouseover.native="currentTemplate=item.template_name"
        >
          <div class="card">
            <div class="card-content">
              <section>
                <div class="name">
                  <el-tooltip effect="dark" :content="item.template_name" placement="top">
                    <span>{{ item.template_name }}</span>
                  </el-tooltip>
                </div>
                <div class="desc">{{item.description}}</div>
              </section>
              <section class="stages">
                <CusTags :values="item.stages" noLimit />
              </section>
            </div>
            <div v-if="currentTemplate===item.template_name">
              <router-link
                class="card-btn"
                :to="`/v1/projects/detail/${projectName}/pipelines/${selectWorkflowType}/create?projectName=${projectName}&id=${item.id}`"
              >{{$t(`workflow.use`)}}</router-link>
            </div>
          </div>
        </el-card>
      </div>
      <div>
        <div class="title">{{$t(`workflow.builtInTemplate`)}}</div>
        <el-card
          shadow="hover"
          v-for="(item) in buildInWorkflowTemplates"
          :key="item.id"
          class="mg-b8"
          @mouseover.native="currentTemplate=item.template_name"
        >
          <div class="card">
            <div class="card-content">
              <section>
                <div class="name">
                  <el-tooltip effect="dark" :content="item.template_name" placement="top">
                    <span>{{ item.template_name }}</span>
                  </el-tooltip>
                </div>
                <el-tooltip effect="dark" :content="item.description" placement="top">
                  <div class="desc">{{item.description}}</div>
                </el-tooltip>
              </section>
              <section class="stages">
                <CusTags :values="item.stages" noLimit />
              </section>
            </div>
            <div v-if="currentTemplate === item.template_name">
              <router-link
                class="card-btn"
                :to="`/v1/projects/detail/${projectName}/pipelines/${selectWorkflowType}/create?projectName=${projectName}&id=${item.id}`"
              >{{$t(`workflow.use`)}}</router-link>
            </div>
          </div>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import VirtualListItem from './list/virtualListItem'
import RunProductWorkflow from './common/runWorkflow.vue'
import RunCustomWorkflow from './common/runCustomWorkflow'
import VirtualList from 'vue-virtual-scroll-list'
import qs from 'qs'
import store from 'storejs'
import {
  getWorkflowDetailAPI,
  deleteProductWorkflowAPI,
  copyProductWorkflowAPI,
  getCustomWorkflowListAPI,
  getCustomWorkfloweTaskPresetAPI,
  deleteCustomWorkflowAPI,
  queryUserBindingsAPI,
  getViewPresetAPI,
  removeWorkflowViewAPI,
  getWorkflowViewListAPI,
  addWorkflowViewAPI,
  editWorkflowViewAPI,
  getWorkflowTemplateListAPI
} from '@api'
import bus from '@utils/eventBus'
import { mapGetters, mapState } from 'vuex'
import { orderBy } from 'lodash'

export default {
  name: 'workflow-list',
  data () {
    return {
      itemComponent: VirtualListItem,
      showStartProductBuild: false,
      workflowListLoading: false,
      showFavorite: false,
      workflowToRun: {},
      remain: 10,
      keyword: '',
      sortBy: 'name-asc',
      workflowsList: [],
      showSelectWorkflowType: false,
      selectWorkflowType: 'product',
      userBindings: [],
      isShowRunCustomWorkflowDialog: false,
      view: '',
      operateType: 'add',
      viewList: [],
      presetWorkflowInfo: {
        workflows: []
      },
      showWorkflowViewDialog: false,
      showWorkflowTemplateDialog: false,
      workflowViewForm: {
        name: '',
        project_name: '',
        workflows: []
      },
      workflowTemplates: [],
      currentTemplate: ''
    }
  },
  provide () {
    return {
      startProductWorkflowBuild: this.startProductWorkflowBuild,
      startCustomWorkflowBuild: this.startCustomWorkflowBuild,
      copyProductWorkflow: this.copyProductWorkflow,
      deleteProductWorkflow: this.deleteProductWorkflow,
      deleteCustomWorkflow: this.deleteCustomWorkflow,
      renameWorkflow: this.renameWorkflow
    }
  },
  computed: {
    ...mapGetters(['getOnboardingTemplates']),
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    }),
    projectName () {
      return this.$route.params.project_name
    },
    workflows () {
      return this.workflowsList.filter(pipeline => {
        return !this.getOnboardingTemplates.includes(pipeline.projectName)
      })
    },
    buildInWorkflowTemplates () {
      return this.workflowTemplates.filter(item => item.build_in)
    },
    customWorkflowTemplates () {
      return this.workflowTemplates.filter(item => !item.build_in)
    },
    availableWorkflows () {
      const filteredWorkflows = this.filteredWorkflows
      let sortedWorkflows = []
      const nameSorter = item => item.name.toLowerCase()
      const timeSorter = item => item.updateTime
      if (this.sortBy === 'name-asc') {
        sortedWorkflows = orderBy(filteredWorkflows, nameSorter, 'asc')
      } else if (this.sortBy === 'name-desc') {
        sortedWorkflows = orderBy(filteredWorkflows, nameSorter, 'desc')
      } else if (this.sortBy === 'time-asc') {
        sortedWorkflows = orderBy(filteredWorkflows, timeSorter, 'asc')
      } else if (this.sortBy === 'time-desc') {
        sortedWorkflows = orderBy(filteredWorkflows, timeSorter, 'desc')
      }
      if (this.showFavorite) {
        const favoriteWorkflows = this.$utils
          .cloneObj(sortedWorkflows)
          .filter(x => {
            return x.isFavorite
          })
        return favoriteWorkflows
      } else {
        const sortedByFavorite = this.$utils
          .cloneObj(sortedWorkflows)
          .sort(x => {
            return x.isFavorite ? -1 : 1
          })
        return sortedByFavorite
      }
    },
    filteredWorkflows () {
      const list = this.$utils.filterObjectArrayByKey(
        'display_name',
        this.keyword,
        this.workflows
      )
      return list
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
  watch: {
    keyword (val) {
      this.$router.replace({
        query: Object.assign(
          {},
          qs.parse(window.location.search, { ignoreQueryPrefix: true }),
          {
            name: val
          }
        )
      })
    },
    projectName (val) {
      if (val) {
        bus.$emit('set-topbar-title', {
          title: '',
          breadcrumb: [
            { title: this.$t(`global.project`), url: '/v1/projects' },
            {
              title: this.projectName,
              isProjectName: true,
              url: `/v1/projects/detail/${this.projectName}/detail`
            },
            { title: this.$t(`global.workflow`), url: '' }
          ]
        })
      }
    },
    $route (val) {
      if (val && !this.projectName) {
        this.getWorkflows()
      }
    },
    view () {
      this.getWorkflows(this.projectName)
    }
  },
  methods: {
    createWorkflow () {
      const type = this.selectWorkflowType
      let path = ''
      if (type === 'product') {
        path = '/workflows/product/create'
      } else if (type === 'custom') {
        if (this.hasPlutus) {
          this.showWorkflowTemplateDialog = true
          this.getWorkflowTemplateList()
          return
        } else {
          path = `/v1/projects/detail/${this.projectName}/pipelines/custom/create`
        }
      } else if (type === 'release') {
        if (this.hasPlutus) {
          this.showWorkflowTemplateDialog = true
          this.getWorkflowTemplateList()
          return
        } else {
          path = `/v1/projects/detail/${this.projectName}/pipelines/release/create`
        }
      }
      this.$router.push(
        `${path}?projectName=${this.projectName ? this.projectName : ''}`
      )
    },
    async getWorkflows (projectName) {
      this.workflowListLoading = true
      const workflowsList = await getCustomWorkflowListAPI(
        projectName,
        this.view
      ).catch(err => {
        console.log(err)
        return []
      })
      this.workflowListLoading = false
      this.workflowsList = workflowsList.workflow_list
    },
    deleteProductWorkflow (workflow) {
      const name = workflow.display_name
      const projectName = workflow.projectName
      if (workflow.base_refs && workflow.base_refs.length) {
        this.$alert(
          `工作流 ${name} 已在协作模式 ${workflow.base_refs.join(
            '、'
          )} 中被定义为基准工作流，如需删除请先修改协作模式！`,
          '删除工作流',
          {
            confirmButtonText: this.$t(`global.confirm`),
            type: 'warning'
          }
        )
        return
      }
      this.$prompt(this.$t(`workflow.confirmWorkflowName`), `${name}`, {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        confirmButtonClass: 'el-button el-button--danger',
        inputValidator: workflowName => {
          if (workflowName === name) {
            return true
          } else if (workflowName === '') {
            return this.$t(`workflow.inputWorkflowName`)
          } else {
            return this.$t(`workflow.nameMismatch`)
          }
        }
      }).then(({ value }) => {
        deleteProductWorkflowAPI(projectName, workflow.name).then(() => {
          this.getWorkflows(this.projectName)
          this.$message.success(this.$t(`workflow.delSuccess`))
        })
      })
    },
    deleteCustomWorkflow (workflow) {
      const name = workflow.display_name
      const projectName = workflow.projectName
      if (workflow.base_refs && workflow.base_refs.length) {
        this.$alert(
          `工作流 ${name} 已在协作模式 ${workflow.base_refs.join(
            '、'
          )} 中被定义为基准工作流，如需删除请先修改协作模式！`,
          '删除工作流',
          {
            confirmButtonText: this.$t(`global.confirm`),
            type: 'warning'
          }
        )
        return
      }
      this.$prompt(this.$t(`workflow.confirmWorkflowName`), `${name}`, {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        confirmButtonClass: 'el-button--danger',
        inputValidator: workflowName => {
          if (workflowName === name) {
            return true
          } else if (workflowName === '') {
            return this.$t(`workflow.inputWorkflowName`)
          } else {
            return this.$t(`workflow.nameMismatch`)
          }
        }
      })
        .then(({ value }) => {
          deleteCustomWorkflowAPI(workflow.name, projectName).then(res => {
            this.getWorkflows(this.projectName)
            this.$message.success(this.$t(`workflow.delSuccess`)`！`)
          })
        })
        .catch(() => {
          this.$message.info(this.$t(`workflow.cancelDel`))
        })
    },
    startProductWorkflowBuild (workflow) {
      this.workflowToRun = {}
      getWorkflowDetailAPI(workflow.projectName, workflow.name)
        .then(res => {
          this.showStartProductBuild = true
          this.workflowToRun = res
        })
        .catch(err => {
          this.showStartProductBuild = false
          console.log(err)
        })
    },
    startCustomWorkflowBuild (workflow) {
      this.workflowToRun = {}
      getCustomWorkfloweTaskPresetAPI(workflow.name, this.projectName)
        .then(res => {
          this.isShowRunCustomWorkflowDialog = true
          this.workflowToRun = res
        })
        .catch(() => {
          this.isShowRunCustomWorkflowDialog = false
        })
    },
    hideProductTaskDialog () {
      this.showStartProductBuild = false
    },
    hideAfterSuccess () {
      this.isShowRunCustomWorkflowDialog = false
    },
    copyProductWorkflow (workflow) {
      const oldName = workflow.name
      const projectName = workflow.projectName
      this.$prompt(
        this.$t(`workflow.newWorkflowName`),
        this.$t(`workflow.copyWorkflow`),
        {
          confirmButtonText: this.$t(`global.confirm`),
          cancelButtonText: this.$t(`global.cancel`),
          inputValidator: newName => {
            const pipeNames = []
            this.workflowsList.forEach(element => {
              pipeNames.push(element.name)
            })
            if (newName === '') {
              return this.$t(`workflow.inputWorkflowName`)
            } else if (pipeNames.includes(newName)) {
              return this.$t(`workflow.duplicateWorkflowName`)
            } else if (!/^[a-zA-Z0-9-]+$/.test(newName)) {
              return '名称只支持字母大小写和数字，特殊字符只支持中划线'
            } else {
              return true
            }
          }
        }
      )
        .then(({ value }) => {
          this.copyProductWorkflowReq(projectName, oldName, value)
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: this.$t(`workflow.cancelCopyWorkflow`)
          })
        })
    },
    copyProductWorkflowReq (projectName, oldName, newName) {
      copyProductWorkflowAPI(projectName, oldName, newName).then(() => {
        this.$message({
          message: this.$t(`workflow.copyWorkflowSuccess`),
          type: 'success'
        })
        this.getWorkflows(this.projectName)
        this.$router.push(
          `/workflows/product/edit/${newName}?projectName=${projectName}`
        )
      })
    },
    sortWorkflow (cm) {
      this.sortBy = cm
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
    },
    editView (formName) {
      this.$refs[formName].validate(valid => {
        if (valid) {
          const params = {
            name: this.workflowViewForm.name,
            project_name: this.projectName,
            workflows: this.presetWorkflowInfo.workflows
          }
          if (this.operateType === 'add') {
            addWorkflowViewAPI(params, this.projectName).then(res => {
              this.$message({
                message: this.$t(`workflow.addSuccess`),
                type: 'success'
              })
              this.getWorkflowViewList()
              this.$refs[formName].resetFields()
            })
          } else {
            params.id = this.presetWorkflowInfo.id
            editWorkflowViewAPI(params, this.projectName).then(res => {
              this.$message({
                message: this.$t(`workflow.updateSuccess`),
                type: 'success'
              })
              this.view = ''
              this.$refs[formName].resetFields()
              this.getWorkflows(this.projectName)
              this.getWorkflowViewList()
            })
          }
          this.showWorkflowViewDialog = false
        } else {
          return false
        }
      })
    },
    cancelEditView (formName) {
      this.$refs[formName].resetFields()
      this.showWorkflowViewDialog = false
    },
    getWorkflowViewList () {
      getWorkflowViewListAPI(this.projectName).then(res => {
        this.viewList = res
      })
    },
    getPresetViewWorkflow () {
      getViewPresetAPI(this.projectName, this.view).then(res => {
        this.presetWorkflowInfo = res
      })
    },
    workflowViewOperation (type) {
      this.showWorkflowViewDialog = true
      this.operateType = type
      if (this.operateType === 'edit') {
        this.workflowViewForm.name = this.view
      } else {
        this.workflowViewForm.name = ''
        this.view = ''
      }
      this.getPresetViewWorkflow()
    },
    removeWorkflowView () {
      this.$confirm(`确定要删除 ${this.view} 这个视图?`, '确认', {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      }).then(res => {
        removeWorkflowViewAPI(this.projectName, this.view).then(res => {
          this.$message({
            message: this.$t(`workflow.delScuuess`),
            type: 'success'
          })
          this.view = ''
          this.getWorkflowViewList()
        })
      })
    },
    getWorkflowTemplateList () {
      const type =
        this.selectWorkflowType === 'custom' ? '' : this.selectWorkflowType
      getWorkflowTemplateListAPI(type, false, this.projectName).then(res => {
        this.workflowTemplates = res
      })
    }
  },
  created () {
    this.$emit('injectComp', this)
    // Detecting change from VirtualListItem component event.
    this.$on('refreshWorkflow', projectName => {
      this.getWorkflows(projectName)
    })
    this.keyword = this.$route.query.name ? this.$route.query.name : ''
    if (this.projectName) {
      this.getWorkflows(this.projectName)
      bus.$emit('set-topbar-title', {
        title: '',
        breadcrumb: [
          { title: this.$t(`global.project`), url: '/v1/projects' },
          {
            title: this.projectName,
            isProjectName: true,
            url: `/v1/projects/detail/${this.projectName}/detail`
          },
          { title: this.$t(`global.workflow`), url: '' }
        ]
      })
    }
    this.getUserBinding(this.projectName)
    this.getWorkflowViewList()
  },
  components: {
    RunProductWorkflow,
    VirtualListItem,
    VirtualList,
    RunCustomWorkflow
  }
}
</script>

<style lang="less">
.workflow-list {
  position: relative;
  flex: 1;
  height: calc(~'100% - 60px');
  overflow-y: hidden;
  background-color: @globalBackgroundColor;

  ::-webkit-scrollbar-track {
    background-color: #f5f5f5;
    border-radius: 6px;
  }

  ::-webkit-scrollbar {
    width: 5px;
    background-color: #f5f5f5;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #b7b8b9;
    border-radius: 6px;
  }

  .pipeline-type-dialog {
    .choice,
    .desc {
      line-height: 32px;
    }

    .desc {
      padding-left: 24px;
      color: #999;
    }
  }

  .search-pipeline {
    display: inline-block;
    width: 100%;
    padding-top: 15px;

    .el-input {
      width: 200px;

      .el-input__inner {
        border-radius: 16px;
      }
    }

    .el-radio {
      margin-left: 15px;
    }
  }

  .view {
    display: flex;
    justify-content: space-between;
    margin: 16px 0;
  }

  .project-header {
    display: flex;
    align-items: stretch;
    justify-content: flex-start;

    .header-start {
      flex: 1;

      .container {
        margin: 0;
        padding: 16px 12px;
        font-size: 13px;

        .function-container {
          display: flex;
          flex-wrap: nowrap;
          align-items: center;
          justify-content: space-between;
          min-height: 30px;

          .btn-container {
            position: relative;
            display: flex;
            align-items: center;
            margin-right: 5px;

            .display-btn {
              margin-right: 5px;
              padding: 8px;
              color: @themeColor;
              font-size: 13px;
              text-decoration: none;
              background-color: #fff;
              border-color: #fff;
              border-style: none;
              border-radius: 4px;
              box-shadow: 0 4px 4px rgba(0, 0, 0, 0.05);
              cursor: pointer;

              .favorite,
              .sort {
                font-size: 20px;
              }

              &:hover {
                color: @themeLightColor;
                background-color: #fff;
                border-color: @themeLightColor;
              }

              &.active {
                color: #fff;
                background-color: @themeLightColor;
                border-color: @themeLightColor;
              }
            }

            .view-container {
              display: flex;
              margin-left: 15px;

              .view-operation {
                display: flex;
                align-items: center;
                margin-left: 15px;
              }
            }
          }

          .search-workflow {
            width: 400px;
          }
        }
      }
    }

    .header-end {
      .add-project-btn {
        width: 165px;
        height: 100%;
        padding: 10px 17px;
        color: #fff;
        font-size: 13px;
        text-decoration: none;
        background-color: @themeColor;
        border: 1px solid @themeColor;
        cursor: pointer;
      }
    }
  }

  .pipeline-loading {
    height: 100%;
    margin: 0 12px;
    overflow: hidden;

    .virtual-list-container {
      height: 100%;
      overflow-y: auto;
    }

    .no-product {
      display: flex;
      flex-direction: column;
      align-content: center;
      align-items: center;
      justify-content: center;

      img {
        width: 400px;
        height: 400px;
      }

      p {
        color: #606266;
        font-size: 15px;
      }
    }
  }

  .workflow-ul {
    display: flex;
    flex-direction: column;
    height: 100%;
    margin: 0;
    padding: 0;
    list-style: none;

    .start-build {
      color: #000;
    }

    .step-arrow {
      color: #06f;
    }
  }

  .run-workflow {
    .el-dialog__body {
      padding: 8px 10px;
      color: #606266;
      font-size: 14px;
    }
  }

  .type-content {
    line-height: 32px;

    .type-desc {
      margin-bottom: 22px;
      margin-left: 25px;
      color: #999;
    }
  }

  .model-dialog {
    .card {
      position: relative;
      height: 30px;

      &-content {
        display: flex;
        flex-flow: row nowrap;
        flex-grow: 1;
        align-items: center;
        font-size: 14px;
        cursor: pointer;

        .name {
          width: 10em;
          overflow: hidden;
          color: @themeColor;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .desc {
          width: 10em;
          margin-right: 40px;
          overflow: hidden;
          color: @fontLightGray;
          font-size: 12px;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }

      &-btn {
        position: absolute;
        top: -10px;
        right: -10px;
        width: 40px;
        height: 50px;
        color: #fff;
        font-size: 12px;
        line-height: 50px;
        text-align: center;
        background: @themeColor;
      }
    }

    .el-icon-plus {
      color: @themeColor;
    }

    .title {
      margin: 16px 0;
    }

    .el-card__body {
      padding: 10px;
    }
  }
}

.el-message-box__title {
  margin-right: 14px;
  word-break: break-all;
}
</style>
