<template>
  <div class="create-external-container">
    <AddHostEnv ref="addHostEnv" />
    <div class="footer">
      <el-button type="primary" @click="$router.back()" size="medium" plain>取消</el-button>
      <el-button type="primary" v-hasPermi="{projectName: projectName, actions: ['create_environment','production:create_environment'],operator:'or',isBtn:true}" @click="save()" size="medium">立即创建</el-button>
    </div>
  </div>
</template>
<script>
import AddHostEnv from '../../common/hosting/addHostEnv.vue'
export default {
  name: 'creatHostEnv',
  components: {
    AddHostEnv
  },
  methods: {
    async save () {
      const status = await this.$refs.addHostEnv.validate()
      if (status) {
        const res = await this.$refs.addHostEnv.submit()
        if (res) {
          this.$router.push(
            `/v1/projects/detail/${this.$route.params.project_name}/envs/detail?envName=${this.$refs.addHostEnv.form.env_name}`
          )
        }
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  }
}
</script>
<style lang="less" scoped>
.create-external-container {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 16px 24px;
  overflow: auto;

  .footer {
    margin-top: 40px;
    margin-left: 35%;
  }
}
</style>
