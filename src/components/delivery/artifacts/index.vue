<template>
  <div
    v-loading="loading"
    class="artifacts-container"
    :element-loading-text="$t(`global.loading`)"
    element-loading-spinner="iconfont iconfont-loading iconvery-delitracking"
  >
    <div class="operation">
      <el-select style="width: 160px; margin-right: 16px;" size="medium" v-model="filterKey" @change="changeKey" :placeholder="$t('deliveryCenter.selectFilterType')">
        <el-option :label="$t(`global.serviceName`)" width="180px" value="name"></el-option>
        <el-option :label="$t('deliveryCenter.artifactType')" width="80px" value="type"></el-option>
        <el-option :label="$t('deliveryCenter.imageName')" value="image_tag"></el-option>
        <el-option :label="$t('deliveryCenter.repoName')" value="repo_name"></el-option>
      </el-select>

      <el-select
        style="width: 160px; margin-right: 16px;"
        size="medium"
        v-if="filterKey==='type'"
        v-model="filterKeyword"
        @change="searchKeyword()"
        clearable
        :placeholder="$t('deliveryCenter.selectArtifactType')"
      >
        <el-option v-for="(item,index) in availableItems['type']" :key="index" :label="item" :value="item"></el-option>
      </el-select>
      <template v-else-if="filterKey==='repo_name'">
        <el-input
          size="medium"
          style="width: 160px; margin-right: 16px;"
          v-model="filterRepoName"
          clearable
          @clear="clearRepoName"
          @input="searchKeyword()"
          :placeholder="$t('deliveryCenter.inputRepoName')"
        ></el-input>
        <el-input
          size="medium"
          style="width: 160px; margin-right: 16px;"
          v-model="filterBranch"
          clearable
          @clear="clearBranch"
          @input="searchKeyword()"
          :placeholder="$t('deliveryCenter.inputRepoBranch')"
        ></el-input>
      </template>
      <el-input
        size="medium"
        v-else
        style="width: 160px;"
        suffix-icon="el-icon-search"
        v-model="filterKeyword"
        clearable
        @clear="clearKeyword"
        @input="searchKeyword()"
        :placeholder="$t('deliveryCenter.inputKeyword')"
      ></el-input>
    </div>
    <el-table :data="filteredArtifacts" v-show="artifacts.length > 0" style="width: 100%;">
      <el-table-column :label="$t(`global.name`)">
        <template slot-scope="scope">
          <el-tooltip :content="scope.row.image" placement="top" effect="dark">
            <router-link class="artifact-link" :to="`/v1/delivery/artifacts/detail/${scope.row.id}?name=${scope.row.name}`">
              <span v-if="scope.row.type==='image'">{{scope.row.name+':'+scope.row.image_tag}}</span>
              <span v-else-if="scope.row.type==='file'">{{$utils.showServiceName(scope.row.name)}}</span>
            </router-link>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column width="120px" :label="$t('deliveryCenter.artifactType')">
        <template slot-scope="scope">
          <span>{{scope.row.type}}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t(`global.repository`)" width="380px">
        <template slot-scope="scope">
          <ul v-if="scope.row.commits &&  scope.row.commits.length >0" class="repo">
            <el-popover
              v-for="(cm,index) in scope.row.commits"
              :key="index"
              popper-class="commit-popper"
              placement="top"
              :title="$t('deliveryCenter.commitMessage')"
              width="400"
              trigger="hover"
            >
              <h4>{{cm.commit_message}}</h4>
              <el-tag v-if="cm.branch" size="mini" effect="light">{{cm.branch}}</el-tag>
              <el-tag v-if="cm.pr" size="mini" type="info" effect="light">{{'#'+cm.pr}}</el-tag>
              <el-tag v-if="cm.commit_id" type="info" size="mini" class="commit">{{$utils.tailCut(cm.commit_id,10,' ')}}</el-tag>
              <span v-if="cm.author_name" class="commit">{{"by "+cm.author_name}}</span>
              <li slot="reference">{{cm.repo_owner+'/'+cm.repo_name+'/'+cm.branch}}</li>
            </el-popover>
          </ul>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('deliveryCenter.imageSize')" width="120px">
        <template slot-scope="scope">
          <span v-if="scope.row.type==='image' && scope.row.image_size">{{$utils.formatBytes(scope.row.image_size)}}</span>
          <span v-else-if="scope.row.type==='file'||!scope.row.image_size">-</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('deliveryCenter.creationTime')" width="150px">
        <template slot-scope="scope">
          <span>{{ $utils.convertTimestamp(scope.row.created_time)}}</span>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination" v-show="artifacts.length > 0">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :page-sizes="[20,50, 100,150, 200]"
        :page-size="perPage"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalResult"
      ></el-pagination>
    </div>
    <div v-if="artifacts.length === 0 && !loading" class="no-artifacts">
      <img src="@assets/icons/illustration/deliveryCenter.svg" alt />
      <p>{{$t('deliveryCenter.noArtifact')}}</p>
    </div>
  </div>
</template>

<script>
import { getArtifactsAPI } from '@api'
import { debounce } from 'lodash'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      loading: true,
      perPage: 20,
      currentPageList: 1,
      totalResult: 0,
      artifacts: [],
      filterKeyword: '',
      filterRepoName: '',
      filterBranch: '',
      filterKey: 'name',
      filterValue: '',
      availableItems: {
        service_name: [],
        type: ['file', 'image'],
        image_name: [],
        repo_name: [],
        branch: []
      }
    }
  },
  methods: {
    getArtifacts (
      perPage,
      currentPageList,
      name,
      type,
      image,
      repoName,
      branch
    ) {
      this.loading = true
      this.availableItems = {
        service_name: [],
        type: ['file', 'image'],
        image_name: [],
        repo_name: [],
        branch: []
      }
      getArtifactsAPI(
        perPage,
        currentPageList,
        name,
        type,
        image,
        repoName,
        branch
      ).then(res => {
        this.loading = false
        this.totalResult = Number(res.headers['x-total'])
        res.data.forEach(element => {
          element.commits = []
          if (element.sortedActivities && element.sortedActivities.build) {
            element.sortedActivities.build.forEach(build => {
              if (build.commits) {
                element.commits = element.commits.concat(build.commits)
                build.commits.forEach(cm => {
                  if (this.availableItems.branch.indexOf(cm.branch) === -1) {
                    this.availableItems.branch.push(cm.branch)
                  }
                  if (
                    this.availableItems.repo_name.indexOf(cm.repo_name) === -1
                  ) {
                    this.availableItems.repo_name.push(cm.repo_name)
                  }
                })
              }
            })
          }
          if (this.availableItems.service_name.indexOf(element.name) === -1) {
            this.availableItems.service_name.push(element.name)
          }
          if (
            this.availableItems.image_name.indexOf(element.image_tag) === -1 &&
            element.type === 'image'
          ) {
            this.availableItems.image_name.push(element.image_tag)
          }
        })
        this.artifacts = res.data
      })
    },
    changeKey () {
      this.filterKeyword = ''
    },
    handleSizeChange (val) {
      this.perPage = val
      this.searchKeyword(this.perPage, this.currentPageList)
    },
    handleCurrentChange (val) {
      this.currentPageList = val
      this.searchKeyword(this.perPage, this.currentPageList)
    },
    searchKeyword: debounce(function (perPage = 20, currentPageList = 1) {
      if (this.filterKey === 'name') {
        this.getArtifacts(perPage, currentPageList, this.filterKeyword)
      } else if (this.filterKey === 'image_tag') {
        this.getArtifacts(
          perPage,
          currentPageList,
          '',
          'image',
          this.filterKeyword
        )
      } else if (this.filterKey === 'type') {
        this.getArtifacts(perPage, currentPageList, '', this.filterKeyword, '')
      } else if (this.filterKey === 'repo_name') {
        this.getArtifacts(
          perPage,
          currentPageList,
          '',
          '',
          '',
          this.filterRepoName,
          this.filterBranch
        )
      }
    }, 300),
    clearKeyword () {
      this.getArtifacts(20, 1)
    },
    clearRepoName () {
      this.getArtifacts(
        20,
        1,
        '',
        '',
        '',
        this.filterRepoName,
        this.filterBranch
      )
    },
    clearBranch () {
      this.getArtifacts(
        20,
        1,
        '',
        '',
        '',
        this.filterRepoName,
        this.filterBranch
      )
    }
  },
  computed: {
    filteredArtifacts () {
      if (this.filterValue) {
        if (this.filterKey === 'service_name') {
          return this.artifacts.filter(item => item.name === this.filterValue)
        } else if (this.filterKey === 'type') {
          return this.artifacts.filter(item => item.type === this.filterValue)
        } else if (this.filterKey === 'image_name') {
          return this.artifacts.filter(
            item => item.image_tag === this.filterValue
          )
        } else if (this.filterKey === 'repo_name') {
          const results = []
          this.artifacts.forEach(item => {
            item.commits.forEach(cm => {
              if (cm.repo_name === this.filterValue) {
                results.push(item)
              }
            })
          })
          return results
        } else if (this.filterKey === 'branch') {
          const results = []
          this.artifacts.forEach(item => {
            item.commits.forEach(cm => {
              if (cm.branch === this.filterValue) {
                results.push(item)
              }
            })
          })
          return results
        } else {
          return []
        }
      } else {
        return this.artifacts
      }
    }
  },
  created () {
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: this.$t('sidebarMenu.deliveryCenter'), url: `/v1/delivery` },
        { title: this.$t('deliveryCenter.artifactsTracking'), url: `` }
      ]
    })
    if (this.$route.query.image) {
      this.filterKey = 'image_tag'
      this.filterKeyword = this.$route.query.image.split('/')[2]
      this.getArtifacts(20, 1, '', 'image', this.filterKeyword)
    } else {
      this.getArtifacts(this.perPage, this.currentPageList)
    }
  }
}
</script>

<style lang="less">
.commit-popper {
  .el-popover__title {
    margin-bottom: 5px;
  }

  h4 {
    margin: 5px 0;
    font-weight: 300;
  }

  .commit {
    color: #586069 !important;
    font-size: 12px;
  }
}

.artifacts-container {
  position: relative;
  flex: 1;
  padding: 24px 24px;
  overflow: auto;

  .operation {
    margin-bottom: 16px;
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
  }

  .artifact-link {
    color: @themeColor;
  }

  .repo {
    li {
      cursor: pointer;
    }
  }

  .no-artifacts {
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    justify-content: center;

    img {
      width: 400px;
      height: 400px;
    }

    p {
      color: #606266;
      font-size: 15px;
    }
  }
}
</style>
