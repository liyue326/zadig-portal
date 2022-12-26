<template>
  <div class="build-console">
    <header class="mg-b8">
      <el-col :span="6">
        <span class="type">更新 K8s YAML:</span>
        <el-tooltip effect="dark" placement="top" :content="jobInfo.name">
          <span>{{$utils.tailCut(jobInfo.name, 20)}}</span>
        </el-tooltip>
      </el-col>
      <el-col :span="2">
        <a :class="buildOverallColor" href="#buildv4-log">{{jobInfo.status?$t(`workflowTaskStatus.${jobInfo.status}`):$t(`workflowTaskStatus.notRunning`)}}</a>
      </el-col>
      <el-col :span="2">
        <span>{{$utils.timeFormat(jobInfo.end_time - jobInfo.start_time)}}</span>
      </el-col>
      <el-col :span="1" class="close">
        <span @click="$emit('showFooter',false)">
          <i class="el-icon-close"></i>
        </span>
      </el-col>
    </header>
    <main>
      <div class="error-wrapper mg-t8 mg-b8">
        <el-alert v-if="jobInfo.error" :title="$t(`global.errorMsg`)" :description="jobInfo.error" type="error" :close-text="$t(`global.ok`)"></el-alert>
      </div>
      <div class="mg-b16 text-weight">更新内容</div>
      <div v-for="(item,index) in jobInfo.spec.patch_items" :key="index" style="width: 60%;" class="mg-t16 mg-b48">
        <div class="flex">
          <span>{{item.resource_kind}}/{{item.resource_name}}</span>
          <span @click="showDetail(item)" style="color: #c0c4cc; cursor: pointer;">详情</span>
        </div>
        <div class="error-wrapper mg-t8 mg-b8">
          <el-alert v-if="item.error" :title="$t(`global.errorMsg`)" :description="item.error" type="error" :close-text="$t(`global.ok`)"></el-alert>
        </div>
        <el-table :data="item.params">
          <el-table-column :label="$t(`global.key`)" prop="name"></el-table-column>
          <el-table-column :label="$t(`global.value`)" prop="value"></el-table-column>
        </el-table>
      </div>
    </main>
    <el-dialog :visible.sync="isShowDetail" title="详情" width="600px" :close-on-click-modal="false">
      <div class="flex mg-b8">
        <span>{{curItem.resource_kind}}/{{curItem.resource_name}}</span>
        <span class="text-weight">{{curItem.patch_strategy}}</span>
      </div>
      <codemirror
        class="codemirror"
        ref="yamlEditor"
        v-model="curItem.patch_content"
        style="min-height: 200px; border: 1px solid #ddd;"
        :options="curItem.patch_strategy==='json' ? editorJsonOptions:editorOptions"
      ></codemirror>
      <div slot="footer">
        <el-button @click="isShowDetail = false" size="small">{{$t(`global.confirm`)}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { editorOptions, editorJsonOptions } from '@/components/templateLibrary/workflows/config.js'

export default {
  data () {
    return {
      editorOptions,
      editorJsonOptions,
      isShowDetail: false,
      curItem: {}
    }
  },
  props: {
    jobInfo: {
      type: Object,
      default: () => ({})
    },

    projectName: {
      type: String,
      default: ''
    },
    taskId: {
      type: [String, Number],
      default: 1
    },
    workflowName: {
      type: String,
      default: ''
    }
  },

  computed: {
    buildOverallStatus () {
      return this.$utils.calcOverallBuildStatus(this.jobInfo, {})
    },
    buildOverallStatusZh () {
      return this.$t(`workflowTaskStatus.${this.buildOverallStatus}`)
    },
    buildOverallColor () {
      return this.$translate.calcTaskStatusColor(this.buildOverallStatus)
    }
  },
  methods: {
    showDetail (item) {
      this.isShowDetail = true
      this.curItem = item
    }
  }
}
</script>
<style lang="less" scoped>
@themeColor: #0066ff;

.build-console {
  position: relative;
  height: 100%;
  font-size: 14px;
  background: #fff;
  box-shadow: 1px 1px 14px rgba(0, 0, 0, 0.1);

  header {
    height: 42px;
    padding: 0 24px;
    line-height: 42px;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;

    .type {
      margin-right: 8px;
      font-weight: 500;
    }

    .close {
      float: right;
      font-size: 16px;
      cursor: pointer;
    }

    .status {
      color: #888;
    }
  }

  main {
    max-height: 70%;
    padding: 0 24px;
    overflow: auto;

    .text-weight {
      font-weight: 500;
    }

    /deep/.el-table th.el-table__cell {
      background: #eaeaea;
    }
  }

  .flex {
    display: flex;
    justify-content: space-between;
  }
}
</style>
