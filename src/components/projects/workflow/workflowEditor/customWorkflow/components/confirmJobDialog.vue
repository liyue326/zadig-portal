<template>
  <el-dialog title="确认保存当前任务配置？" :visible.sync="isShowCurJobDrawer" width="30%">
    <span slot="footer" class="dialog-footer">
      <el-button type="primary" @click="handleCurJobDrawer('confirm')" size="small">确认</el-button>
      <el-button @click="handleCurJobDrawer('abort')" size="small">放弃修改</el-button>
      <el-button @click="handleCurJobDrawer('cancel')" size="small">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'ConfirmDialog',
  data () {
    return {}
  },
  props: {
    isShowCurJobDrawer: {
      type: Boolean,
      default: false
    }
  },
  inject: ['handleCurJobDrawer'],
  methods: {}
}
</script>
