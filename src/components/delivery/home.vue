<template>
  <div class="delivery-container">
    <SubTopbar/>
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
    bus.$emit('set-topbar-title', { title: this.$t('sidebarMenu.deliveryCenter'), breadcrumb: [] })
  }
}
</script>

<style lang="less" scoped>
.delivery-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: @globalBackgroundColor;
}
</style>
