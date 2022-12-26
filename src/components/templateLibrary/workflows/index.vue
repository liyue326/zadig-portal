<template>
  <div class="workflow-template-container">
    <div class="wrap">
      <el-tabs v-model="activeTab" type="card" @tab-click="changeTab" class="workflow-type-tab">
        <el-tab-pane :label="$t(`workflow.customWorkflow`)" name="custom"></el-tab-pane>
        <el-tab-pane :label="$t(`workflow.releaseWorkflow`)" name="release"></el-tab-pane>
        <div v-if="workflowTemplates.length > 0">
          <div v-for="item in workflowTemplates" :key="item.name">
            <Item :modelInfo="item" :type="activeTab" @success="getWorkflowTemplates(activeTab)" />
          </div>
        </div>
        <div v-else class="empty">
          <img src="@assets/icons/illustration/workflow.svg" alt />
          <p>暂无可展示的工作流模板</p>
        </div>
      </el-tabs>
    </div>
  </div>
</template>

<script>
import Item from './item.vue'
import { getWorkflowTemplateListAPI } from '@api'

export default {
  data () {
    return {
      activeTab: 'custom',
      workflowTemplates: []
    }
  },
  components: { Item },
  methods: {
    changeTab () {
      this.getWorkflowTemplates(this.activeTab)
    },
    getWorkflowTemplates (val) {
      const type = val === 'custom' ? '' : 'release'
      getWorkflowTemplateListAPI(type, true).then(res => {
        this.workflowTemplates = res
      })
    }
  },
  created () {
    this.activeTab = this.$route.query.type || 'custom'
    this.getWorkflowTemplates(this.activeTab)
  }
}
</script>

<style lang="less" scoped>
.workflow-template-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  margin-top: 16px;
  padding: 0 10px;
  overflow: hidden;

  .wrap {
    width: 100%;
    height: 100%;
    overflow: auto;

    /deep/ .workflow-type-tab {
      .el-tabs__header {
        .el-tabs__nav-wrap {
          .el-tabs__item.is-active {
            background: #fff;
            border-bottom-color: #06f;
          }
        }
      }
    }

    .empty {
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
}
</style>
