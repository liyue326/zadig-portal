<template>
  <div class="workflow-build-rows">
    <el-table :data="info" v-if="info.length > 0" empty-text="无">
      <el-table-column type="expand" width="50px" v-if="type!=='zadig-scanning'">
        <template slot-scope="props">
          <el-table :data="props.row.key_vals.filter(item=>item.isShow)" style="width: 70%; margin: 0 auto;" size="mini">
            <el-table-column :label="$t(`global.key`)">
              <template slot-scope="scope">{{scope.row.key}}</template>
            </el-table-column>
            <el-table-column :label="$t(`global.value`)">
              <template slot-scope="scope">
                <el-select v-model="scope.row.value" v-if="scope.row.type === 'choice'" size="small" :style="{ width: elSelectWidth}">
                  <el-option v-for="(item,index) in scope.row.choice_option" :key="index" :value="item" :label="item">{{item}}</el-option>
                </el-select>
                <el-input
                  class="password"
                  v-else
                  v-model="scope.row.value"
                  size="small"
                  :type="scope.row.is_credential ? 'passsword' : ''"
                  :show-password="scope.row.is_credential ? true : false"
                  :style="{ width: elSelectWidth}"
                ></el-input>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column prop="name" :label="$t(`global.testName`)" width="100px" v-if="type=='zadig-test'"></el-table-column>
      <el-table-column prop="name" :label="$t(`workflow.scanName`)" width="100px" v-if="type=='zadig-scanning'"></el-table-column>
      <el-table-column
        prop="service_module"
        :label="$t(`project.services`)"
        width="100px"
        v-if="type!=='zadig-test'&&type!=='zadig-scanning'"
      ></el-table-column>
      <el-table-column :label="$t(`global.repository`)">
        <template slot-scope="scope">
          <el-row v-for="build of scope.row.repos" class="build-row" :key="build.code_host_id">
            <template>
              <el-col :span="7">
                <div class="repo-name-container">
                  <el-tooltip class="item" effect="dark" :content="build.repo_name" placement="top">
                    <span :class="{'repo-name': true}">{{$utils.tailCut(build.repo_name,20) }}</span>
                  </el-tooltip>
                </div>
              </el-col>
              <div v-if="build.showTip">
                <el-col :span="7">
                  <span style="color: #909399; font-size: 12px; line-height: 33px;">{{$t(`workflow.executeWithChangedCode`)}}</span>
                </el-col>
              </div>
              <div v-else>
                <el-col :span="7">
                  <el-input v-if="build.source==='other'" v-model="build.branchOrTag.name" placeholder="请输入分支或标签" size="small"></el-input>
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
                <el-col :span="7" :offset="1" v-if="build.source!=='other'">
                  <el-select
                    v-if="!$utils.isEmpty(build.branchPRsMap)"
                    v-model="build.prs"
                    multiple
                    size="small"
                    :placeholder="$t(`repository.prompt.choosePR`)"
                    filterable
                    clearable
                    :style="{ width: elSelectWidth}"
                    :disabled="build.branchOrTag && build.branchOrTag.type === 'tag'"
                  >
                    <el-tooltip
                      v-for="item in build.branchPRsMap[build.branchOrTag ? build.branchOrTag.name : '']"
                      :key="item[build.prNumberPropName]"
                      placement="left"
                      popper-class="gray-popper"
                    >
                      <div slot="content">
                        {{`${$t('repository.info.creatorTemplate')}${$utils.tailCut(item.authorUsername,10)}`}}
                        <br />
                        {{`${$t('repository.info.creationTimeTemplate')}${$utils.convertTimestamp(item.createdAt)}`}}
                        <br />
                        {{`${$t('repository.info.sourceBranchTemplate')}${item.sourceBranch}`}}
                        <br />
                        {{`${$t('repository.info.targetBranchTemplate')}${item.targetBranch}`}}
                      </div>
                      <el-option :label="`#${item[build.prNumberPropName]} ${item.title}`" :value="item[build.prNumberPropName]"></el-option>
                    </el-tooltip>
                  </el-select>
                  <el-tooltip v-else :content="$t(`repository.prompt.prDoesNotExist`)" placement="top" popper-class="gray-popper">
                    <el-input
                      v-model="build.prs"
                      class="short-input"
                      size="small"
                      :style="{ width: elSelectWidth}"
                      :placeholder="$t(`repository.prompt.inputPR`)"
                      :disabled="build.branchOrTag && build.branchOrTag.type === 'tag'"
                    ></el-input>
                  </el-tooltip>
                </el-col>

                <el-col :span="1">
                  <el-tooltip v-if="build.errorMsg" class="item" effect="dark" :content="build.errorMsg" placement="top">
                    <i class="el-icon-question repo-warning"></i>
                  </el-tooltip>
                </el-col>
              </div>
            </template>
          </el-row>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import DeployIcons from './deployIcons'
import { getAllBranchInfoAPI } from '@api'
export default {
  props: {
    pickedTargets: {
      type: Array,
      required: true
    },
    type: {
      type: String,
      default: ''
    },
    elSelectWidth: {
      type: String,
      default: '220px'
    }
  },
  components: {
    DeployIcons
  },
  computed: {
    info () {
      return this.pickedTargets
    }
  },
  data () {
    return {}
  },
  methods: {
    async searchRepoInfo (build, query) {
      let reposQuery = []
      reposQuery = [
        {
          source: build.source,
          repo_owner: build.repo_owner,
          repo: build.repo_name,
          default_branch: build.branch,
          codehost_id: build.codehost_id,
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
        const queryBranchInResponse = branches.options.findIndex(element => {
          return element.name === query && element.type === 'branch'
        })
        const queryTagInResponse = tags.options.findIndex(element => {
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
    changeBranchOrTag (build) {
      if (build.branchOrTag) {
        build[build.prNumberPropName] = null
        if (build.branchOrTag.type === 'branch') {
          build.branch = build.branchOrTag.name
        }
        if (build.branchOrTag.type === 'tag') {
          build.tag = build.branchOrTag.name
        }
        // Todo: enhance this logic for pr
      }
    }
  },
  watch: {
    info: {
      handler (value) {
        value.forEach(item => {
          if (item.repos && item.repos.length > 0) {
            item.repos.forEach(build => {
              this.searchRepoInfo(build, '')
            })
          }
        })
      },
      immediate: true
    }
  }
}
</script>

<style lang="less" scoped>
@import '~@assets/css/common/build-row.less';

.workflow-build-rows {
  .password {
    /deep/.el-input__suffix {
      display: none !important;
    }
  }
}
</style>
