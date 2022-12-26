<template>
  <li class="workflow-model" @click="$router.push(pipelineLink)">
    <section class="header" @click.stop>
      <div class="header-name">
        <router-link :to="pipelineLink">
          <el-tooltip effect="dark" :content="modelInfo.template_name" placement="top">
            <span class="header-span">{{ modelInfo.template_name }}</span>
          </el-tooltip>
        </router-link>
      </div>
    </section>
    <section class="stages">
      <CusTags :values="modelInfo.stages" noLimit />
    </section>
    <section class="desc">{{ modelInfo.description }}</section>
    <section class="operations" @click.stop>
      <template>
        <router-link :to="pipelineLink">
          <span class="menu-item iconfont icondeploy"></span>
        </router-link>
        <el-dropdown>
          <span class="el-dropdown-link">
            <i class="iconfont iconmorelist more-operation"></i>
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item @click.native="deleteModel(modelInfo)">
              <span>{{$t(`global.delete`)}}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </template>
    </section>
  </li>
</template>

<script>
import { deleteWorkflowTemplateAPI } from '@api'

export default {
  data () {
    return {}
  },
  props: {
    modelInfo: {
      type: Object,
      required: true
    },
    type: {
      type: String,
      default: 'custom'
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    },
    pipelineLink () {
      return `/v1/template/workflows/config?id=${this.modelInfo.id}&type=${this.type}`
    }
  },
  methods: {
    deleteModel (modelInfo) {
      const { template_name, id } = modelInfo
      this.$confirm(`确定要删除 ${template_name} 模板?`, '确认', {
        confirmButtonText: this.$t(`global.confirm`),
        cancelButtonText: this.$t(`global.cancel`),
        type: 'warning'
      }).then(() => {
        deleteWorkflowTemplateAPI(id).then(res => {
          this.$message({
            message: '删除成功',
            type: 'success'
          })
          this.$emit('success')
        })
      })
    }
  }
}
</script>

<style lang="less">
.workflow-model {
  display: flex;
  flex-flow: row nowrap;
  flex-grow: 1;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  width: 100%;
  height: 80px;
  margin-bottom: 8px;
  padding: 0 16px;
  overflow: auto;
  font-size: 14px;
  line-height: 22px;
  background: #fff;
  cursor: pointer;

  .header {
    flex: 0 0 240px;
    max-width: 240px;
    cursor: auto;

    &-name {
      display: flex;
      align-items: center;

      a {
        display: flex;
        font-weight: 500;

        .name-span {
          display: inline-block;
          max-width: 180px;
          margin-right: 8px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }
    }

    .icon {
      margin-left: 2px;
      font-size: 12px;
    }
  }

  .stages {
    width: 400px;
    overflow: hidden;
  }

  .desc {
    flex: 1 0 20%;
    color: @fontLightGray;
    font-size: 13px;
  }

  .operations {
    display: flex;
    flex: 0 0 100px;
    align-items: center;
    justify-content: space-around;
    font-size: 30px;
    cursor: pointer;

    a {
      color: @fontLightGray;
    }

    .menu-item {
      display: inline-block;
      box-sizing: border-box;
      padding: 8px;
      color: @fontGray;
      font-size: 20px;
      border: 1px solid transparent;
      border-radius: 5px;

      &:hover {
        border-color: @borderGray;
      }
    }

    .more-operation {
      font-size: 20px;
    }
  }
}
</style>
