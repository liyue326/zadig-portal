<template>
  <div class="mobile-workflow-build-rows">
    <div v-for="(item,index) in zadigBuild" :key="index" style="margin-bottom: 4px; padding: 4px; border: 1px solid #ebedf0; border-radius: 4px;">
      <el-table :data="item.build.repos" empty-text="无">
        <el-table-column :label="`服务 ${item.name} 的代码库`">
          <template slot-scope="scope">
            <el-row>
              <template v-if="!scope.row.use_default">
                <el-col :span="7">
                  <div class="repo-name-container">
                    <el-tooltip class="item" effect="dark" :content="scope.row.repo_name" placement="top">
                      <span :class="{'repo-name': true}">{{$utils.tailCut(scope.row.repo_name,20) }}</span>
                    </el-tooltip>
                  </div>
                </el-col>
                </template>
              </el-row>
              <el-row>
                <el-col :span="11">
                  <el-select
                    v-model="scope.row.branchOrTag"
                    remote
                    :remote-method="(query)=>{searchRepoInfo(scope.row,query)}"
                    @clear="searchRepoInfo(scope.row,'')"
                    filterable
                    clearable
                    size="small"
                    value-key="id"
                    :placeholder="scope.row.source==='other'?'请输入分支或标签':'请选择分支或标签'"
                    @change="changeBranchOrTag(scope.row)"
                  >
                    <el-option-group v-for="group in scope.row.branchAndTagList" :key="group.label" :label="group.label">
                      <el-option v-for="(item, index) in group.options" :key="index" :label="item.name" :value="item"></el-option>
                    </el-option-group>
                  </el-select>
                </el-col>
                <el-col :span="12" :offset="1" v-if="scope.row.source!=='other'">
                  <el-select
                    v-if="!$utils.isEmpty(scope.row.branchPRsMap)"
                    v-model.number="scope.row[scope.row.prNumberPropName]"
                    size="small"
                    placeholder="请选择 PR"
                    filterable
                    clearable
                    :disabled="scope.row.branchOrTag && scope.row.branchOrTag.type === 'tag'"
                  >
                    <el-tooltip
                      v-for="item in scope.row.branchPRsMap[scope.row.branchOrTag ? scope.row.branchOrTag.name : '']"
                      :key="item[scope.row.prNumberPropName]"
                      placement="left"
                      popper-class="gray-popper"
                    >
                      <div slot="content">
                        {{`创建人: ${$utils.tailCut(item.authorUsername,10)}`}}
                        <br />
                        {{`时间: ${$utils.convertTimestamp(item.createdAt)}`}}
                        <br />
                        {{`源分支: ${item.sourceBranch}`}}
                        <br />
                        {{`目标分支: ${item.targetBranch}`}}
                      </div>
                      <el-option :label="`#${item[scope.row.prNumberPropName]} ${$utils.tailCut(item.title,30)}`" :value="item[scope.row.prNumberPropName]"></el-option>
                    </el-tooltip>
                  </el-select>
                  <el-tooltip v-else content="PR 不存在，支持手动输入 PR 号" placement="top" popper-class="gray-popper">
                    <el-input
                      v-model.number="scope.row[scope.row.prNumberPropName]"
                      class="short-input"
                      size="small"
                      placeholder="请填写 PR 号"
                      :disabled="scope.row.branchOrTag && scope.row.branchOrTag.type === 'tag'"
                    ></el-input>
                  </el-tooltip>
                </el-col>

                <el-col :span="1">
                  <el-tooltip v-if="scope.row.errorMsg" class="item" effect="dark" :content="scope.row.errorMsg" placement="top">
                    <i class="el-icon-question repo-warning"></i>
                  </el-tooltip>
                </el-col>

            </el-row>
          </template>
        </el-table-column>
      </el-table>
      <div v-for="deploy of item.deploy" :key="`${deploy.env}|${deploy.type}`" style="margin: 4px 0;">
        <span style="color: #4a4a4a; font-size: 12px;">服务部署</span>
        <el-checkbox v-if="deploy.type === 'k8s'|| deploy.type === 'helm'" v-model="deploy.picked">
          <i v-if="deploy.type === 'k8s'" style="font-size: 14px;" class="iconfont iconrongqifuwu"></i>
          <i v-if="deploy.type === 'helm'" style="font-size: 14px;"  class="iconfont iconhelmrepo"></i>
          {{ deploy.env }}
        </el-checkbox>
        <template v-else-if="deploy.type === 'pm'">
          <i style="font-size: 14px;" class="iconfont iconwuliji"></i>
          {{ deploy.env }}
        </template>
      </div>
    </div>

    <el-table :data="jenkinsBuild" v-if="jenkinsBuild.length > 0" empty-text="无" class="service-deploy-table">
      <el-table-column prop="name" label="服务" width="100px">
        <div slot-scope="scope">{{$utils.showServiceName(scope.row.name)}}</div>
      </el-table-column>
      <el-table-column label="Jenkins Job Name">
        <div slot-scope="scope">{{scope.row.jenkins_build_args.job_name}}</div>
      </el-table-column>
      <el-table-column width="100px" label="变量">
        <template slot-scope="scope">
          <el-popover placement="left" width="450" trigger="click">
            <!-- jenkins构建 -->
            <el-table :data="scope.row.jenkins_build_args.jenkins_build_params" :row-style="rowStyle">
              <el-table-column property="name" label="name"></el-table-column>
              <el-table-column label="Value">
                <template slot-scope="{ row }">
                  <el-select style="width: 100%;" v-if="row.type==='choice'" v-model="row.value" placeholder="默认值" size="small">
                    <el-option v-for="option in row.choice_option" :key="option" :label="option" :value="option"></el-option>
                  </el-select>
                  <div v-else>
                    <el-input size="small" v-model="row.value" placeholder="请输入 value"></el-input>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            <el-button style="padding: 5px 0;" slot="reference" type="text">设置</el-button>
          </el-popover>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
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
  components: {},
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
        value.forEach(item => {
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
      let reposQuery = []
      if (build.source === 'codehub') {
        reposQuery = [
          {
            source: build.source,
            repo_owner: build.repo_owner,
            repo: build.repo_name,
            default_branch: build.branch,
            project_uuid: build.project_uuid,
            repo_uuid: build.repo_uuid,
            repo_id: build.repo_id,
            codehost_id: build.codehost_id,
            key: query
          }
        ]
      } else {
        reposQuery = [
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
      }
      const payload = { infos: reposQuery }
      // b = branch, p = pr, t = tag
      const res = await getAllBranchInfoAPI(payload)
      const branches = build.branchAndTagList.find(
        item => item.label === 'Branches'
      )
      const tags = build.branchAndTagList.find(item => item.label === 'Tags')
      if (build.source === 'other' && res.length === 0) {
        this.$set(res, 0, {
          branches:
            build.branchOrTag.type === 'branch' ? [build.branchOrTag] : [],
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
        branches.options.unshift({
          id: 'addBranch-' + query,
          name: query,
          type: 'branch'
        })
        tags.options.unshift({
          id: 'addTag-' + query,
          name: query,
          type: 'tag'
        })
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
@import '~@assets/css/common/mobile-build-row.less';
</style>
