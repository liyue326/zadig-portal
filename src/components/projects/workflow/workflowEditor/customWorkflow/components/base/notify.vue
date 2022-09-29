<template>
  <div class="notify">
    <el-button type="primary" size="mini" icon="el-icon-plus" plain @click="editNotify('add')" class="mg-b24">添加</el-button>
    <div v-if="config.notify_ctls.length > 0">
      <el-row :gutter="20" class="title">
        <el-col :span="4"></el-col>
        <el-col :span="4">类型</el-col>
        <el-col :span="12">通知事件</el-col>
        <el-col :span="4"></el-col>
      </el-row>
      <el-row :gutter="20" class="content mg-t8" v-for="(item,index) in config.notify_ctls" :key="index">
        <el-col :span="4">
          <el-switch v-model="item.enabled" active-color="#13ce66"></el-switch>
        </el-col>
        <el-col :span="4">{{filterPlatform(item.webhook_type) }}</el-col>
        <el-col :span="12">
          <el-tooltip effect="dark" placement="top" :content="filterType(item.notify_type)">
            <span>{{ $utils.tailCut(filterType(item.notify_type),20)}}</span>
          </el-tooltip>
        </el-col>
        <el-col :span="4">
          <div class="operation">
            <span class="el-icon-edit mg-r8" @click="editNotify('edit',index,item)"></span>
            <span class="el-icon-delete" @click="delNotify(index,item.name)"></span>
          </div>
        </el-col>
      </el-row>
    </div>
    <el-dialog :title="operateType==='add'?'新建通知':'编辑通知'" :visible.sync="isShowDialog" append-to-body :close-on-click-modal="false">
      <NotifyOperate ref="notifyOperate" :notify="notify" />
      <div slot="footer">
        <el-button @click="isShowDialog = false" size="small">取 消</el-button>
        <el-button type="primary" @click="submit" size="small">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>
<script type="text/javascript">
import NotifyOperate from './notifyOperate'
import { cloneDeep } from 'lodash'
import { notifyType, notifyPlatform } from '../../config'

export default {
  data () {
    return {
      isShowDialog: false,
      notifyType,
      notifyPlatform,
      notifyList: [],
      notify: {},
      operateType: 'add'
    }
  },
  props: {
    config: {
      type: Object,
      default: () => ({})
    }
  },
  components: { NotifyOperate },
  methods: {
    editNotify (type, index, item) {
      this.curIndex = index
      this.operateType = type
      this.isShowDialog = true
      this.notify = cloneDeep(item) || { notify_type: [] }
    },
    delNotify (curIndex) {
      this.config.notify_ctls.splice(curIndex, 1)
    },
    filterPlatform (val) {
      const res = this.notifyPlatform.filter(item => {
        return item.label === val
      })
      return res[0].desc
    },
    filterType (val) {
      const arr = []
      this.notifyType.forEach(item => {
        if (val.indexOf(item.label) > -1) {
          arr.push(item.desc)
        }
      })
      return arr.toString()
    },
    getData () {
      return this.config.notify_ctls
    },
    submit () {
      this.$refs.notifyOperate.validate().then(res => {
        const data = this.$refs.notifyOperate.getData()
        data.enabled = true
        if (this.operateType === 'add') {
          this.config.notify_ctls.push(data)
        } else {
          this.$set(this.config.notify_ctls, this.curIndex, data)
        }
        this.isShowDialog = false
      })
    }
  }
}
</script>

<style lang="less" scoped>
.notify {
  .title {
    margin-bottom: 8px;
    color: @secondaryColor;
    font-weight: 500;
    font-size: 14px;
  }

  .content {
    display: flex;
    align-items: center;
    font-size: 14px;
  }

  .operation {
    cursor: pointer;

    .el-icon-edit {
      color: @themeColor;
      cursor: pointer;
    }

    .el-icon-delete {
      color: #ff1949;
      cursor: pointer;
    }
  }

  .el-col {
    border: 1px solid transparent;
  }
}
</style>
