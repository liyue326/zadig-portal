<template>
  <div class="repo-jump-container">
    <slot></slot>
    <el-tooltip :content="build.source==='gerrit' ?`暂不支持在该类型上查看 Release`:`在 ${build.source} 上查看 Release`" placement="top" effect="dark">
      <span v-if="build.tag && build.source!=='other'" class="link">
        <i v-if=" build.tag" class="iconfont icontag1 repo-icon"></i>
        <a
          v-if="build.source==='github'||build.source==='gitlab'"
          :href="`${build.address}/${build.repo_owner}/${build.repo_name}/tags/${build.tag}`"
          target="_blank"
        >{{build.tag }}</a>
        <a
          v-else-if="build.source==='gitee'||build.source==='gitee-enterprise'"
          :href="`${build.address}/${build.repo_owner}/${build.repo_name}/tree/${build.tag}`"
          target="_blank"
        >{{build.tag }}</a>
        <span v-if="build.source==='gerrit'">{{build.tag}}</span>
      </span>
    </el-tooltip>
    <span v-if="build.tag && build.source==='other'" class="normal">
      <i v-if=" build.tag" class="iconfont icontag1 repo-icon"></i>
      <span>{{build.tag}}</span>
    </span>
    <span v-if="build.branch && !build.tag && build.source==='other'" class="normal">
      <i v-if=" build.branch" class="iconfont iconicon_git-branch repo-icon"></i>
      <span class="normal" v-if="build.source ==='other'">{{build.branch}}</span>
    </span>
    <el-tooltip
      :content="build.source==='gerrit'?`暂不支持在该类型上查看 Branch`:`在 ${build.source} 上查看 Branch`"
      placement="top"
      effect="dark"
    >
      <span v-if="build.branch && !build.tag && build.source!=='other'" class="link">
        <i v-if=" build.branch" class="iconfont iconicon_git-branch repo-icon"></i>
        <a
          v-if="build.source==='github'||build.source==='gitee'|| build.source==='gitee-enterprise'||build.source==='gitlab'"
          :href="`${build.address}/${build.repo_owner}/${build.repo_name}/tree/${build.branch}`"
          target="_blank"
        >{{build.branch}}</a>
        <span v-else-if="build.source==='gerrit'">{{build.branch}}</span>
        <a
          v-if="!build.source"
          :href="`${build.address}/${build.repo_owner}/${build.repo_name}/tree/${build.branch}`"
          target="_blank"
        >{{ build.branch}}</a>
      </span>
    </el-tooltip>
    <el-tooltip :content="`在 ${build.source} 上查看 PR`" placement="top" effect="dark">
      <span v-if="build.prs&&build.prs.length>0" class="link mg-l4">
        <a v-if="build.source==='github'" :href="`${build.address}/${build.repo_owner}/${build.repo_name}/pull/${curPr}`" target="_blank">
          <i v-if=" build.prs&&build.prs.length>0" class="iconfont icongit-pull-request repo-icon"></i>
          <span v-for="item in build.prs" :key="item" @click="setPr(item)">#{{item}}</span>
        </a>
        <a
          v-else-if="build.source==='gitlab'"
          :href="`${build.address}/${build.repo_owner}/${build.repo_name}/merge_requests/${curPr}`"
          target="_blank"
        >
          <i v-if="build.prs&&build.prs.length>0" class="iconfont icongit-pull-request repo-icon"></i>
          <span v-for="item in build.prs" :key="item" @click="setPr(item)">#{{item}}</span>
        </a>
        <a
          v-else-if="build.source==='gitee'|| build.source==='gitee-enterprise'"
          :href="`${build.address}/${build.repo_owner}/${build.repo_name}/pulls/${curPr}`"
          target="_blank"
        >
          <i v-if="build.prs&&build.prs.length>0" class="iconfont icongit-pull-request repo-icon"></i>
          <span v-for="item in build.prs" :key="item" @click="setPr(item)">#{{item}}</span>
        </a>
        <a v-if="!build.source" :href="`${build.address}/${build.repo_owner}/${build.repo_name}/pull/${curPr}`" target="_blank">
          <i v-if="build.prs&&build.prs.length>0" class="iconfont icongit-pull-request repo-icon"></i>
          <span v-for="item in build.prs" :key="item" @click="setPr(item)">#{{item}}</span>
        </a>
      </span>
    </el-tooltip>
    <i v-if=" build.commit_id" class="iconfont iconicon_git-commit repo-icon"></i>
    <el-tooltip
      :content="(build.source==='gerrit')?`暂不支持在该类型上查看 Commit`:`在 ${build.source} 上查看 Commit`"
      placement="top"
      effect="dark"
    >
      <span v-if="build.commit_id" class="link">
        <a
          v-if="build.source==='github'||build.source==='gitee'||build.source==='gitlab'"
          :href="`${build.address}/${build.repo_owner}/${build.repo_name}/commit/${build.commit_id}`"
          target="_blank"
        >{{build.commit_id.substring(0, 10)}}</a>
        <a
          v-else-if="build.source==='gitee-enterprise'"
          :href="`${build.address}/enterprise/dashboard/projects/${build.repo_owner}/${build.repo_name}/commit/${build.commit_id}`"
          target="_blank"
        >{{build.commit_id.substring(0, 10)}}</a>
        <span v-else-if="build.source==='gerrit'&& (!build.prs||build.prs.length===0)">{{''+build.commit_id.substring(0, 8)}}</span>
        <span v-else-if="build.source==='gerrit'&& build.prs&&build.prs.length>0" class="link">
          <a :href="`${build.address}/c/${build.repo_name}/+/${curPr}`" target="_blank">
            <span v-for="item in build.prs" :key="item" @click="setPr(item)">#{{item}}</span>
          </a>
          {{build.commit_id.substring(0, 8)}}
        </span>
      </span>
    </el-tooltip>
  </div>
</template>

<script>
export default {
  props: {
    showCommit: {
      type: Boolean,
      default: true
    },
    build: Object
  },
  data () {
    return {
      curPr: ''
    }
  },
  methods: {
    setPr (item) {
      this.curPr = item
      this.$forceUpdate()
    }
  }
}
</script>

<style lang="less" scoped>
.repo-jump-container {
  color: @themeColor;

  .repo-icon {
    vertical-align: bottom;

    &:not(:first-child) {
      margin-left: 6px;
    }
  }

  a {
    color: @themeColor;
  }

  .normal {
    color: #4a4a4a;
  }
}
</style>
