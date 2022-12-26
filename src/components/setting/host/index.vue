<template>
  <div class="host">
    <ManageHost type="system" />
  </div>
</template>
<script>
import bus from '@utils/eventBus'
export default {
  name: 'SystemHost',
  created () {
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: this.$t(`sidebarMenu.hosts`), url: '' }] })
  }
}

</script>
<style lang="less" scoped>
.host {
  height: 100%;
  overflow: auto;
}
</style>
