<template>
  <div class="folder-container">
    <el-tree
      ref="treeRef"
      :data="fileData"
      :props="defaultProps"
      @node-click="handleNodeClick"
      :default-expanded-keys="expandedKeys"
      node-key="fullPath"
      highlight-current
    >
      <span slot-scope="{data}">
        <i class="icon el-icon-document" v-if="!data.is_dir"></i>
        <i class="icon el-icon-folder" v-else></i>
        {{ data.name }}
        <span class="display-none" :class="{folder: data.is_chart}">
          <el-button icon="el-icon-close" v-hasPermi="{type: 'system', action: 'delete_template',isBtn:true}" @click.stop="deleteChart(data)" size="mini" type="text"></el-button>
          <el-button icon="el-icon-refresh" v-hasPermi="{type: 'system', action: 'edit_template',isBtn:true}" @click.stop="updateChart(data)" size="mini" type="text"></el-button>
        </span>
      </span>
    </el-tree>
  </div>
</template>

<script>
import { deleteChartTemplateAPI } from '@api'

export default {
  data () {
    return {
      defaultProps: {
        children: 'children',
        label: 'name'
      }
    }
  },
  props: {
    fileData: {
      require: true,
      type: Array,
      default: () => {
        return []
      }
    },
    expandedKeys: {
      require: true,
      type: Array,
      default: () => {
        return []
      }
    }
  },
  computed: {
    serviceName () {
      return this.$route.query.service_name || ''
    }
  },
  methods: {
    setFileSelected (key) {
      this.$nextTick(() => {
        this.$refs.treeRef.setCurrentKey(key)
      })
    },
    handleNodeClick (data) {
      this.$emit('clickFile', data)
    },
    deleteChart (data) {
      this.$confirm(this.$t(`templates.helmChart.confirmToDeleteTemplate`, { name: data.name }), this.$t(`templates.helmChart.confirm`), {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      })
        .then(() => {
          deleteChartTemplateAPI(data.name).then(() => {
            this.$message({
              type: 'success',
              message: this.$t(`templates.helmChart.successfullyDeleted`)
            })
            this.$emit('deleteChart', { deleteFlag: true, name: data.name })
          })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: this.$t(`templates.helmChart.cancelDeletingTemplate`)
          })
        })
    },
    updateChart (data) {
      this.$emit('refreshChart', data)
    }
  }
}
</script>

<style lang="less" scoped>
.folder-container {
  height: calc(~'100% - 65px');
  padding: 5px;
  overflow: auto;
  font-size: 13px;

  /deep/ .el-tree {
    background-color: transparent;

    .el-tree-node__content {
      .icon {
        color: @themeColor;
      }

      .display-none {
        display: none;
      }

      &:hover {
        .display-none.folder {
          display: inline-block;

          .icon {
            padding-left: 10px;
          }
        }
      }
    }
  }

  /deep/.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content {
    background-color: #06f3;
  }
}
</style>
