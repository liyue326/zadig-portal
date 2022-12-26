<template>
  <div class="template-library-container">
    <SubTopbar />
    <router-view></router-view>
  </div>
</template>

<script>
import bus from '@utils/eventBus'
import SubTopbar from './common/subTopbar'
export default {
  components: {
    SubTopbar
  },
  created () {
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [{ title: this.$t('project.templates'), url: '/v1/template' }]
    })
  }
}
</script>

<style lang="less" scoped>
.template-library-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: @globalBackgroundColor;
}
</style>
