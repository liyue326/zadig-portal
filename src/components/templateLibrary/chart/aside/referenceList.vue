<template>
  <div class="module-use">
    <header>{{$t(`templates.helmChart.referenceList`)}}</header>
    <section>
      <el-table :data="chartReference" style="width: 100%;">
        <el-table-column prop="project_name" :label="$t(`global.project`)"></el-table-column>
        <el-table-column prop="service_name" :label="$t(`global.serviceName`)">
          <template slot-scope="scope">
            <router-link
              v-if="scope.row.service_name"
              :to="`/v1/projects/detail/${scope.row.project_name}/services?service_name=${scope.row.service_name}&rightbar=var`"
            >{{scope.row.service_name}}</router-link>
            <span v-else>{{$t(`templates.helmChart.noneVariable`)}}</span>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script>
import { getHelmTemplateReferenceAPI } from '@api'

export default {
  data () {
    return {
      chartReference: []
    }
  },
  computed: {
    serviceName () {
      return this.$route.query.service_name
    }
  },
  methods: {
    async getChartReference () {
      const serviceName = this.serviceName
      const res = await getHelmTemplateReferenceAPI(serviceName).catch(err => {
        console.log(err)
      })
      if (res) {
        this.chartReference = res
      }
    }
  },
  watch: {
    serviceName: {
      handler (val, old_val) {
        if (val) {
          this.getChartReference()
        }
      },
      immediate: false
    }
  },
  mounted () {
    this.getChartReference()
  }
}
</script>

<style lang="less" scoped>
.module-use {
  box-sizing: border-box;
  height: 100%;
  padding: 10px 20px 20px;
  background-color: #fff;

  header {
    padding: 20px 0;
    font-weight: 700;
    font-size: 16px;
    line-height: 1;
  }

  section {
    .desc {
      font-size: 14px;
      line-height: 2;
    }
  }
}
</style>
