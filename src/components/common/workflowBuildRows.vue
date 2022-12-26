<template>
  <div class="workflow-build-rows">
    <el-table :data="zadigBuild" v-if="zadigBuild.length > 0"
              empty-text="无"
              class="service-deploy-table">
      <el-table-column prop="name"
                       :label="$t(`project.services`)"
                       width="100px"
                       ></el-table-column>

      <el-table-column :label="$t(`global.repository`)"  >
        <template slot-scope="scope"  v-if="scope.row.build" >
          <el-row v-for="build of scope.row.build.repos"
                  class="build-row"
                  :key="build._id_">
            <template v-if="!build.use_default">
              <el-col :span="7">
                <div class="repo-name-container">
                  <el-tooltip class="item" effect="dark" :content="build.repo_name" placement="top">
                    <span :class="{'repo-name': true}"> {{$utils.tailCut(build.repo_name,20) }}</span>
                  </el-tooltip>
                </div>
              </el-col>
              <el-col :span="7" >
                <el-input v-if="build.source==='other'" v-model="build.branchOrTag.name" :placeholder="$t(`repository.prompt.inputBranchOrTag`)" size="small"></el-input>
                <el-select
                  v-else
                  v-model="build.branchOrTag"
                  remote
                  :remote-method="(query)=>{searchRepoInfo(build,query)}"
                  @clear="searchRepoInfo(build,'')"
                  filterable
                  clearable
                  size="small"
                  value-key="id"
                  :placeholder="$t(`repository.prompt.chooseBranchOrTag`)"
                  @change="changeBranchOrTag(build)"
                >
                  <el-option-group v-for="group in build.branchAndTagList" :key="group.label" :label="group.label">
                    <el-option v-for="(item, index) in group.options" :key="index" :label="item.name" :value="item">
                      <span v-if="item.id.startsWith('addTag')||item.id.startsWith('addBranch')">{{`${$t('repository.prompt.usePRorTagTemplate')}"${item.name}"`}}</span>
                      <span v-else>{{item.name}}</span>
                    </el-option>
                  </el-option-group>
                </el-select>
              </el-col>
              <el-col :span="7"
                      :offset="1" v-if="build.source!=='other'">
                <el-select v-if="!$utils.isEmpty(build.branchPRsMap)"
                            v-model="build.prs"
                            multiple
                            size="small"
                            :placeholder="$t(`repository.prompt.choosePR`)"
                            filterable
                            clearable
                            :disabled="build.branchOrTag && build.branchOrTag.type === 'tag'">

                  <el-tooltip v-for="item in build.branchPRsMap[build.branchOrTag ? build.branchOrTag.name : '']"
                              :key="item[build.prNumberPropName]"
                              placement="left"
                              popper-class="gray-popper">

                    <div slot="content">{{`${$t('repository.info.creatorTemplate')}${$utils.tailCut(item.authorUsername,10)}`}}
                      <br />{{`${$t('repository.info.creationTimeTemplate')}${$utils.convertTimestamp(item.createdAt)}`}}
                      <br />{{`${$t('repository.info.sourceBranchTemplate')}${item.sourceBranch}`}}
                      <br />{{`${$t('repository.info.targetBranchTemplate')}${item.targetBranch}`}}
                    </div>
                    <el-option :label="`#${item[build.prNumberPropName]} ${item.title}`"
                                :value="item[build.prNumberPropName]">
                    </el-option>
                  </el-tooltip>
                </el-select>
                <el-tooltip v-else
                            :content="$t(`repository.prompt.prDoesNotExist`)"
                            placement="top"
                            popper-class="gray-popper">
                  <el-input v-model="build.prs"
                            class="short-input"
                            size="small"
                            :placeholder="$t(`repository.prompt.inputPR`)"
                            :disabled="build.branchOrTag && build.branchOrTag.type === 'tag'"></el-input>
                </el-tooltip>
              </el-col>

              <el-col :span="1">
                <el-tooltip v-if="build.errorMsg"
                            class="item"
                            effect="dark"
                            :content="build.errorMsg"
                            placement="top">
                  <i class="el-icon-question repo-warning"></i>
                </el-tooltip>
              </el-col>

            </template>
          </el-row>
        </template>
      </el-table-column>
      <el-table-column   width="250px">
        <template slot="header">
          {{$t(`status.deploy`)}}
          <DeployIcons/>
        </template>
        <template slot-scope="scope">
          <div v-for="deploy of scope.row.deploy"
               :key="`${deploy.env}|${deploy.type}`">
            <el-checkbox v-if="deploy.type === 'k8s'|| deploy.type === 'helm'"
                         v-model="deploy.picked"
                         size="small">
              <i v-if="deploy.type === 'k8s'"
                 class="iconfont iconrongqifuwu"></i>
              <i v-if="deploy.type === 'helm'"
                 class="iconfont iconhelmrepo"></i>
              {{ deploy.env }}
            </el-checkbox>
            <template v-else-if="deploy.type === 'pm'">
              <i class="iconfont iconwuliji"></i>
              {{ deploy.env }}
            </template>

          </div>
        </template>
      </el-table-column>
      <el-table-column width="100px"
                       :label="$t(`global.var`)">
        <template slot-scope="scope">
          <el-popover placement="left"
                      width="450"
                      trigger="click">
            <!-- 非jenkins构建 -->
            <el-table :data="scope.row.envs" v-if="!scope.row.jenkins_build_args">
              <el-table-column property="key"
                               label="Key"></el-table-column>
              <el-table-column label="Value">
                <template slot-scope="{ row }">
                   <el-select
                      style="width: 100%;"
                      v-if="row.type==='choice'"
                      v-model="row.value"
                      placeholder="默认值"
                      size="small"
                    >
                      <el-option v-for="option in row.choice_option" :key="option" :label="option" :value="option"></el-option>
                    </el-select>
                  <el-input v-else
                            size="small"
                            v-model="row.value"
                            placeholder="请输入 value"></el-input>
                </template>
              </el-table-column>
            </el-table>
            <!-- jenkins构建 -->
            <el-table :data="scope.row.jenkins_build_args.jenkins_build_params" v-if="scope.row.jenkins_build_args">
              <el-table-column property="name"
                               label="name"></el-table-column>
              <el-table-column label="Value">
                <template slot-scope="scope">
                  <el-input size="small"
                            v-model="scope.row.value"
                            placeholder="请输入 value"></el-input>
                </template>
              </el-table-column>
            </el-table>
            <el-button style="padding: 5px 0;"
                       slot="reference"
                       type="text">{{$t(`global.setting`)}}</el-button>
          </el-popover>
        </template>
      </el-table-column>
    </el-table>
    <el-table :data="jenkinsBuild" v-if="jenkinsBuild.length > 0"
              empty-text="无"
              class="service-deploy-table">
      <el-table-column prop="name"
                       :label="$t(`project.services`)"
                       width="100px"
                       >
        <div slot-scope="scope">
          {{$utils.showServiceName(scope.row.name)}}
        </div>
      </el-table-column>
      <el-table-column
                       label="Jenkins Job Name"
                       >
          <div slot-scope="scope">
            {{scope.row.jenkins_build_args.job_name}}
          </div>
      </el-table-column>

      <el-table-column   width="250px">
        <template slot="header">
          {{$t(`status.deploy`)}}
          <deploy-icons></deploy-icons>
        </template>
        <template slot-scope="scope">
          <div v-for="deploy of scope.row.deploy"
               :key="`${deploy.env}|${deploy.type}`">
            <el-checkbox v-if="deploy.type === 'k8s'|| deploy.type === 'helm'"
                         v-model="deploy.picked"
                         size="small">
              <i v-if="deploy.type === 'k8s'"
                 class="iconfont iconrongqifuwu"></i>
              <i v-if="deploy.type === 'helm'"
                 class="iconfont iconhelmrepo"></i>
              {{ deploy.env }}
            </el-checkbox>
            <template v-else-if="deploy.type === 'pm'">
              <i class="iconfont iconwuliji"></i>
              {{ deploy.env }}
            </template>

          </div>
        </template>
      </el-table-column>
      <el-table-column width="100px"
                       :label="$t(`global.var`)">
        <template slot-scope="scope">
          <el-popover placement="left"
                      width="450"
                      trigger="click">
            <!-- jenkins构建 -->
            <el-table :data="scope.row.jenkins_build_args.jenkins_build_params" :row-style="rowStyle">
              <el-table-column property="name"
                               label="name">
                               </el-table-column>
              <el-table-column label="Value">
                <template slot-scope="{ row }">
                   <el-select
                      style="width: 100%;"
                      v-if="row.type==='choice'"
                      v-model="row.value"
                      placeholder="默认值"
                      size="small"
                    >
                      <el-option v-for="option in row.choice_option" :key="option" :label="option" :value="option"></el-option>
                    </el-select>
                    <div v-else>
                      <el-input
                            size="small"
                            v-model="row.value"
                            placeholder="请输入 value"></el-input>
                    </div>
                </template>
              </el-table-column>
            </el-table>
            <el-button style="padding: 5px 0;"
                       slot="reference"
                       type="text">{{$t(`global.setting`)}}</el-button>
          </el-popover>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import DeployIcons from './deployIcons'
import { getAllBranchInfoAPI } from '@api'
export default {
  data () {
    return {
      zadigBuild: [],
      jenkinsBuild: []
    }
  },
  props: {
    pickedTargets: {
      type: Array,
      required: true
    }
  },
  components: {
    DeployIcons
  },
  watch: {
    pickedTargets: {
      handler (value) {
        this.zadigBuild = value.filter(item => !item.jenkins_build_args)
        this.jenkinsBuild = value.filter(item => item.jenkins_build_args)
      },
      immediate: true
    },
    zadigBuild: {
      handler (value) {
        value.forEach((item) => {
          item.build.repos.forEach(build => {
            // source:other  init options data
            if (build.source === 'other') {
              this.searchRepoInfo(build, '')
            } else {
              this.searchRepoInfo(build)
            }
          })
        })
      }
    }
  },
  methods: {
    changeBranchOrTag (build) {
      if (build.branchOrTag) {
        build[build.prNumberPropName] = null
      }
    },
    async searchRepoInfo (build, query) {
      const reposQuery = [
        {
          source: build.source,
          repo_owner: build.repo_owner,
          repo: build.repo_name,
          default_branch: build.branch,
          codehost_id: build.codehost_id,
          filter_regexp: build.filter_regexp,
          repo_namespace: build.repo_namespace,
          key: query
        }
      ]

      const payload = { infos: reposQuery }
      // b = branch, p = pr, t = tag
      const res = await getAllBranchInfoAPI(payload)
      const branches = build.branchAndTagList.find(
        item => item.label === 'Branches'
      )
      const tags = build.branchAndTagList.find(item => item.label === 'Tags')
      if (build.source === 'other' && res.length === 0) {
        this.$set(res, 0, {
          branches: build.branchOrTag.type === 'branch' ? [build.branchOrTag] : [],
          tags: build.branchOrTag.type === 'tag' ? [build.branchOrTag] : []
        })
        if (query) {
          this.$set(res, 0, {
            branches: [],
            tags: []
          })
        }
      }
      if (res && res.length > 0) {
        build.loading = false
        branches.options = res[0].branches.map(item => {
          return {
            id: 'branch-' + item.name,
            name: item.name,
            type: 'branch'
          }
        })
        tags.options = res[0].tags.map(item => {
          return {
            id: 'tag-' + item.name,
            name: item.name,
            type: 'tag'
          }
        })
      } else {
        branches.options = []
        tags.options = []
      }
      if (query) {
        const queryBranchInResponse = branches.options.findIndex((element) => {
          return element.name === query && element.type === 'branch'
        })
        const queryTagInResponse = tags.options.findIndex((element) => {
          return element.name === query && element.type === 'tag'
        })
        if (queryBranchInResponse === -1) {
          branches.options.unshift({
            id: 'addBranch-' + query,
            name: query,
            type: 'branch'
          })
        }
        if (queryTagInResponse === -1) {
          tags.options.unshift({
            id: 'addTag-' + query,
            name: query,
            type: 'tag'
          })
        }
      }
    },
    // 如果是勾选的不需要展示当前行 这里不处理数据  通过样式隐藏当前行
    rowStyle ({ row, rowIndex }) {
      if (row.name === 'IMAGE' && row.auto_generate) {
        return { visibility: 'collapse' }
      } else {
        return {}
      }
    }
  }
}
</script>

<style lang="less">
@import '~@assets/css/common/build-row.less';
</style>
