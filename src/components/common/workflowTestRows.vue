<template>
  <div class="workflow-build-rows">
    <el-table v-if="runnerTests.length > 0"
              :data="runnerTests"
              empty-text="无"
              class="test-table">
      <el-table-column prop="test_module_name"
                       label="测试"
                       width="100px"></el-table-column>

      <el-table-column :label="$t(`global.repository`)">
        <template slot-scope="scope">
          <el-row v-for="build of scope.row.builds"
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

              <el-col :span="7">
                <el-select v-if="build.branchNames && build.branchNames.length > 0"
                            v-model="build.branch"
                            filterable
                            allow-create
                            clearable
                            size="small"
                            :placeholder="$t(`repository.prompt.chooseBranch`)">
                  <el-option v-for="branch of build.branchNames"
                              :key="branch"
                              :label="branch"
                              :value="branch"></el-option>
                </el-select>
                <el-tooltip v-else
                            :content="$t(`repository.prompt.getBranchErrorInputBranch`)"
                            placement="top"
                            popper-class="gray-popper">
                  <el-input v-model="build.branch"
                            class="short-input"
                            size="small"
                            :placeholder="$t(`repository.prompt.inputBranch`)"></el-input>
                </el-tooltip>
              </el-col>

              <el-col :span="7"
                      :offset="1">
                <el-select v-if="!$utils.isEmpty(build.branchPRsMap)"
                            v-model="build.prs"
                            multiple
                            size="small"
                            :placeholder="$t(`repository.prompt.choosePR`)"
                            filterable
                            clearable>

                  <el-tooltip v-for="item in build.branchPRsMap[build.branch]"
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
                            :placeholder="$t(`repository.prompt.inputPR`)"></el-input>
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
      <el-table-column width="250px">
      </el-table-column>
      <el-table-column width="100px"
                       :label="$t(`global.var`)">
        <template slot-scope="scope">
          <el-popover placement="left"
                      width="450"
                      trigger="click">
            <el-table :data="scope.row.envs">
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
            <el-button style="padding: 5px 0;"
                       slot="reference"
                       type="text">设置</el-button>
          </el-popover>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  props: {
    runnerTests: {
      type: Array,
      required: true
    }
  }
}
</script>

<style lang="less">
@import '~@assets/css/common/build-row.less';
</style>
