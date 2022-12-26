<template>
  <div class="mobile-workflow-test-rows">
    <div
      v-for="(item,index) in runnerTests"
      :key="index"
      style="margin-bottom: 4px; padding: 4px; border: 1px solid #ebedf0; border-radius: 4px;"
    >
      <el-table :data="item.builds" empty-text="无" class="test-table">
        <el-table-column :label="`测试 ${item.test_module_name} 的代码库`">
          <template slot-scope="scope">
            <el-row>
              <template v-if="!scope.row.use_default">
                <el-col :span="24">
                  <div class="repo-name-container">
                    <el-tooltip class="item" effect="dark" :content="scope.row.repo_name" placement="top">
                      <span :class="{'repo-name': true}">{{$utils.tailCut(scope.row.repo_name,20) }}</span>
                    </el-tooltip>
                  </div>
                </el-col>
              </template>
            </el-row>
            <el-row>
              <el-col :span="12">
                <el-select
                  v-if="scope.row.branchNames && scope.row.branchNames.length > 0"
                  v-model="scope.row.branch"
                  filterable
                  allow-create
                  clearable
                  size="small"
                  :placeholder="$t(`repository.prompt.chooseBranch`)"
                >
                  <el-option v-for="branch of scope.row.branchNames" :key="branch" :label="branch" :value="branch"></el-option>
                </el-select>
                <el-tooltip v-else :content="$t(`repository.prompt.getBranchErrorInputBranch`)" placement="top" popper-class="gray-popper">
                  <el-input v-model="scope.row.branch" class="short-input" size="small" :placeholder="$t(`repository.prompt.inputBranch`)"></el-input>
                </el-tooltip>
              </el-col>

              <el-col :span="11" :offset="1">
                <el-select
                  v-if="!$utils.isEmpty(scope.row.branchPRsMap)"
                  v-model="scope.row.prs"
                  multiple
                  size="small"
                  :placeholder="$t(`repository.prompt.choosePR`)"
                  filterable
                  clearable
                >
                  <el-tooltip
                    v-for="item in scope.row.branchPRsMap[scope.row.branch]"
                    :key="item[scope.row.prNumberPropName]"
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
                    <el-option :label="`#${item[scope.row.prNumberPropName]} ${$utils.tailCut(item.title,30)}`" :value="item[scope.row.prNumberPropName]"></el-option>
                  </el-tooltip>
                </el-select>
                <el-tooltip v-else :content="$t(`repository.prompt.prDoesNotExist`)" placement="top" popper-class="gray-popper">
                  <el-input v-model="scope.row.prs" class="short-input" size="small" :placeholder="$t(`repository.prompt.inputPR`)"></el-input>
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
    </div>
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
@import '~@assets/css/common/mobile-build-row.less';
</style>
