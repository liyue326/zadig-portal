<template>
  <div>
    <el-dialog title="版本历史" :visible.sync="historyVisible" width="70%" class="config-history-dialog">
      <div style="margin-bottom: 16px;">
        <el-button @click="showDiff" type="primary" plain size="mini" icon="el-icon-view">比较所选版本</el-button>
      </div>

      <el-table v-loading="historyLoading" :data="histories" @selection-change="selectionChanged" ref="configHistoryTable">
        <el-table-column type="selection"></el-table-column>
        <el-table-column prop="version" label="版本"></el-table-column>
        <el-table-column prop="create_time" label="创建时间">
          <template slot-scope="scope">
            <span>{{moment(scope.row.create_time*1000).format('YYYY-MM-DD HH:mm')}}</span>
          </template>
        </el-table-column>
        <el-table-column prop="update_user_name" label="最后修改"></el-table-column>
        <el-table-column label="操作" width>
          <template slot-scope="scope">
            <el-button v-if="scope.$index!==0" v-hasPermi="{projectName: projectName, actions: ['production:config_environment', 'config_environment'], operator: 'or', isBtn: true }" @click="rollbackTo(scope.row)" icon="el-icon-refresh-left" size="mini">回滚</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog :title="diffTitle" :visible.sync="diffVisible" width="60%" class="log-diff-container">
      <div class="diff-content">
        <pre :style="{ width: maxWidth || '100%' }"><!--
       --><div v-for="(section, index) in configDiff" :key="index" :class="{ 'added': section.added, 'removed': section.removed }"><!--
         --><span v-if="section.added" class="code-line-prefix"> + </span><!--
         --><span v-if="section.removed" class="code-line-prefix"> - </span><!--
         --><span id="yaml-content">{{ section.value }}</span><!--
       --></div><!--
     --></pre>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import moment from 'moment'
import { getObjectHistoryVersionAPI } from '@api'
const jsdiff = require('diff')

export default {
  data () {
    return {
      moment,
      historyVisible: false,
      histories: [],
      selectedHistories: [],
      diffVisible: false,
      configDiff: [],

      srcConfigName: null,
      historyLoading: false,
      maxWidth: ''
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    envName () {
      return this.$route.params.env_name
    },
    orderedHistoriesDesc () {
      if (
        Array.isArray(this.selectedHistories) &&
        this.selectedHistories.length > 1
      ) {
        const arr = Array.from(this.selectedHistories)
        if (arr[1].id < arr[0].id) {
          arr.reverse()
        }
        return arr
      }
      return this.selectedHistories
    },
    diffTitle () {
      const candidates = this.selectedHistories
      if (Array.isArray(candidates) && candidates.length > 1) {
        return `${candidates[0].version} 相对于 ${candidates[1].version} 的 diff`
      }
      return '配置 diff（未勾选）'
    }
  },
  methods: {
    showDiff () {
      this.maxWidth = ''
      const candidates = this.selectedHistories
      if (candidates.length !== 2) {
        this.$message({
          message: '只能选择两个版本用于比较',
          type: 'warning'
        })
        return
      }

      this.diffVisible = true
      this.configDiff = jsdiff.diffLines(
        this.orderedHistoriesDesc[0].yaml_data
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t'),
        this.orderedHistoriesDesc[1].yaml_data
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
      )
      this.$nextTick(() => {
        const arr = document.querySelectorAll('.log-diff-container #yaml-content')
        let maxWidth = 0
        arr.forEach(ele => {
          maxWidth = Math.max(maxWidth, ele.offsetWidth)
        })
        this.maxWidth = maxWidth + 'px'
      })
    },
    selectionChanged (val) {
      if (val.length > 2) {
        this.$message({
          message: '只能选择两个版本用于比较',
          type: 'warning'
        })
        this.$refs.configHistoryTable.toggleRowSelection(val[val.length - 1])
        return false
      }

      this.selectedHistories = val
    },
    rollbackTo (row) {
      this.$emit('actionConfig', {
        actionType: 'edit',
        name: row.name,
        yamlData: row.yaml_data,
        services: row.services || [],
        showImport: false,
        readOnly: true
      })
    },
    async showVersionList (objectName, commonEnvCfgType, services) {
      this.historyVisible = true
      const params = {
        objectName,
        projectName: this.projectName,
        envName: this.envName,
        commonEnvCfgType
      }
      this.historyLoading = true
      const res = await getObjectHistoryVersionAPI(params).catch(err =>
        console.log(err)
      )

      if (res) {
        this.historyLoading = false
        this.histories = res.map((re, index) => {
          return {
            ...re,
            services,
            version: index === 0 ? '当前版本' : `版本 ${index}`
          }
        })
      }
    },
    closeHistoryDialog () {
      this.historyVisible = false
    }
  },
  watch: {
    historyVisible (nVal) {
      if (!nVal) {
        this.histories = []
      }
    }
  }
}
</script>

<style lang="less">
.config-history-dialog {
  .el-table-column--selection.is-leaf > .cell {
    display: none;
  }

  .el-dialog__body {
    padding: 20px;
  }
}

.log-diff-container {
  .diff-content {
    height: 500px;
    overflow-y: auto;

    .added {
      background-color: #b4e2b4;
    }

    .removed {
      background-color: #ffb6ba;
    }
  }
}
</style>
