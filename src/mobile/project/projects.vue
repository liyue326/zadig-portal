<template>
  <div class="mobile-project">
    <van-sticky>
      <van-nav-bar>
        <template #title>项目</template>
      </van-nav-bar>
    </van-sticky>

    <van-cell-group>
      <van-cell v-for="(project,index) in projects" :key="index" is-link :to="`/mobile/projects/detail/${project.name}`" size="large">
        <template #icon>
          <van-icon class-prefix="iconfont" :name="projectIconMap[project.deployType]" color="#0066ff" />
        </template>
        <template #title>
          <span class="project-name">{{project.alias?project.alias:project.name}}</span>
        </template>
        <template #label>
          <span>{{project.desc}}</span>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>
<script>
import { Sticky, NavBar, Empty, Cell, CellGroup, Icon } from 'vant'
import { orderBy } from 'lodash'
import { getProjectsAPI } from '@api'
export default {
  components: {
    [Sticky.name]: Sticky,
    [NavBar.name]: NavBar,
    [Empty.name]: Empty,
    [Cell.name]: Cell,
    [CellGroup.name]: CellGroup,
    [Icon.name]: Icon
  },
  data () {
    return {
      projects: [],
      projectIconMap: {
        k8s: 'iconfont iconk8s',
        helm: 'iconfont iconhelmrepo',
        external: 'iconfont iconvery-trustee',
        cloud_host: 'iconfont iconwuliji'
      }
    }
  },
  methods: {
    async getProjects () {
      const projects = await getProjectsAPI()
      this.projects = orderBy(
        projects.filter(project => {
          return !project.onboard
        }),
        'name'
      )
    }
  },
  mounted () {
    this.getProjects()
  }
}
</script>
<style lang="less" scoped>
.mobile-project {
  /deep/.van-cell__title {
    margin-left: 5px;

    .van-cell__label {
      font-size: 12px;
    }
  }
}
</style>
