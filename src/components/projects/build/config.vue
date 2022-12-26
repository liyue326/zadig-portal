<template>
  <div
    v-loading="loading"
    :element-loading-text="$t(`global.loading`)"
    element-loading-spinner="iconfont iconfont-loading iconvery-build"
    class="buildConfig-container"
  >
    <section v-if="buildConfigs.length > 0" class="tab-container">
      <div class="build-search-container">
        <el-input v-model.lazy="searchBuildConfig" :placeholder="$t(`build.prompt.searchForBuild`)" class="search-test" autofocus prefix-icon="el-icon-search"></el-input>
      </div>
      <el-table :data="filteredBuildConfigs">
        <el-table-column :label="$t(`global.name`)" prop="name" min-width="180"></el-table-column>
        <el-table-column prop="services" :label="$t(`global.serviceModule`)" min-width="180">
          <template slot-scope="scope">
            <div class="service-container">
              <div v-if="scope.row.targets.length > 0" class="service-left">
                <div v-for="(item,index) in scope.row.targets" :key="index">
                  <el-tooltip effect="dark" :content="item.service_name" placement="top">
                    <span>{{ item.service_module }}</span>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t(`global.updateTime`)" width="180">
          <template slot-scope="scope">{{ $utils.convertTimestamp(scope.row.update_time) }}</template>
        </el-table-column>
        <el-table-column :label="$t(`build.updatedBy`)" prop="update_by" width="180"></el-table-column>
        <el-table-column :label="$t(`global.operation`)" width="180">
          <template slot-scope="scope">
            <router-link
              v-if="checkPermissionSyncMixin({projectName: projectName, action: 'edit_build'})"
              :to="`/v1/projects/detail/${scope.row.productName}/builds/detail/${scope.row.name}`"
            >
              <el-button type="primary" size="mini" plain>{{$t(`global.edit`)}}</el-button>
            </router-link>
            <el-tooltip v-else effect="dark" :content="$t('permission.lackPermission')" placement="top">
              <el-button type="primary" class="permission-disabled" size="mini" plain>{{$t(`global.edit`)}}</el-button>
            </el-tooltip>
            <el-button
              v-if="checkPermissionSyncMixin({projectName: projectName, action: 'delete_build'})"
              @click="removeBuildConfig(scope.row)"
              type="danger"
              size="mini"
              plain
            >{{$t(`global.delete`)}}</el-button>
            <el-tooltip v-else effect="dark" :content="$t('permission.lackPermission')" placement="top">
              <el-button type="primary" class="permission-disabled" size="mini" plain>{{$t(`global.delete`)}}</el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </section>
    <div v-if="buildConfigs.length === 0 && !loading" class="build-not-available">
      <img src="@assets/icons/illustration/build.svg" alt />
      <p>{{$t(`build.prompt.noExistingBuild`)}}</p>
    </div>
  </div>
</template>

<script>
import { getBuildConfigsAPI, deleteBuildConfigAPI } from '@api'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      buildConfigs: [],
      searchBuildConfig: '',
      searchInputVisible: false,
      loading: false
    }
  },
  methods: {
    removeBuildConfig (obj) {
      const projectName = this.projectName
      const str =
        obj.pipelines.length > 0
          ? this.$t(`build.prompt.deleteWithReference`, { reference: obj.pipelines, name: obj.name })
          : this.$t(`build.prompt.deleteWithoutReference`, { name: obj.name })
      this.$confirm(str, this.$t(`global.confirmation`), {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      }).then(() => {
        deleteBuildConfigAPI(obj.name, obj.version, projectName).then(() => {
          this.$message.success(this.$t(`build.prompt.buildDeleted`))
          this.getBuildConfig()
        })
      })
    },
    getBuildConfig () {
      const projectName = this.projectName
      this.loading = true
      getBuildConfigsAPI(projectName).then(res => {
        this.loading = false
        res.forEach(element => {
          element.targets = element.targets.map(t => {
            t.key = t.service_name + '/' + t.service_module
            return t
          })
        })
        this.buildConfigs = this.$utils.deepSortOn(res, 'name')
      })
    }
  },
  computed: {
    filteredBuildConfigs () {
      if (this.searchBuildConfig) {
        this.$router.replace({
          query: {
            name: this.searchBuildConfig
          }
        })
      }
      return this.$utils.filterObjectArrayByKey(
        'name',
        this.searchBuildConfig,
        this.buildConfigs
      )
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  created () {
    this.getBuildConfig()
    if (this.$route.query.name) {
      this.searchInputVisible = true
      this.searchBuildConfig = this.$route.query.name
    } else if (this.$route.query.add) {
      this.$router.replace(
        `/v1/projects/detail/${this.projectName}/builds/create`
      )
    }
    bus.$emit('set-topbar-title', {
      title: '',
      breadcrumb: [
        { title: this.$t(`subTopbarMenu.projects`), url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: this.$t('subTopbarMenu.builds'), url: '' }
      ]
    })
  }
}
</script>

<style lang="less" scoped>
.buildConfig-container {
  position: relative;
  flex: 1;
  height: 100%;
  padding: 15px 20px;
  overflow: auto;

  .build-not-available {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    justify-content: center;

    img {
      width: 400px;
      height: 300px;
      padding: 45px 45px;
    }

    p {
      color: #606266;
      font-size: 15px;
    }
  }

  .build-search-container {
    height: 40px;
    margin-bottom: 10px;
    text-align: right;

    .search-test {
      width: 400px;
    }
  }

  .service-container {
    display: flex;
    align-items: center;

    .service-left {
      width: 180px;
    }
  }
}
</style>
