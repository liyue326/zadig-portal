<template>
  <div class="var-group-container">
    <div class="btn-container">
      <el-button plain size="small" type="primary" @click="varGroup('new')">新建</el-button>
    </div>
    <el-table v-loading="loading" :data="groupList" class="group-container">
      <el-table-column label="变量组名称" prop="name" />
      <el-table-column label="描述信息" prop="description" />
      <el-table-column label="更新时间" prop="updated_at" />
      <el-table-column label="最后修改" prop="updated_by" />
      <el-table-column label="操作" width="150px">
        <template slot-scope="{ row }">
          <el-button size="mini" type="primary" @click="varGroup('edit', row)" plain>编辑</el-button>
          <el-button size="mini" type="danger" @click="varGroup('delete', row)" plain>删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="table-pagination">
      <el-pagination
        background
        @size-change="handlePageChange($event, 'perPage')"
        @current-change="handlePageChange($event, 'page')"
        :current-page="page.page"
        :page-sizes="[10, 20, 30, 40]"
        :page-size="page.perPage"
        layout="total, sizes, prev, pager, next, jumper"
        :total="page.total"
      />
    </div>
  </div>
</template>

<script>
import bus from '@utils/eventBus'
import { getVariablesGroupsAPI, deleteVariablesGroupAPI } from '@api'
export default {
  data () {
    return {
      loading: false,
      groupList: [],
      page: {
        total: 0,
        page: 1,
        perPage: 30
      }
    }
  },
  computed: {
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    varGroup (tag, row) {
      if (tag === 'delete') {
        this.$confirm(`确定要删除 ${row.name} ?`, '确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          deleteVariablesGroupAPI(this.projectName, row.id).then(res => {
            this.$message.success(`变量组 ${row.name} 删除成功！`)
            this.getGroupList()
          })
        })
      } else {
        this.$router.push(
          `/v1/projects/detail/${this.projectName}/group/create?${
            tag === 'edit' ? `id=${row.id}&name=${row.name}` : ''
          }`
        )
      }
    },
    async getGroupList () {
      const { page, perPage } = this.page
      this.loading = true
      const res = await getVariablesGroupsAPI(
        this.projectName,
        page,
        perPage
      ).catch(err => window.console.log(err))
      this.loading = false
      if (res) {
        this.groupList = res.variable_set_list.map(variable => {
          return {
            ...variable,
            updated_at: this.$utils.convertTimestamp(
              variable.updated_at,
              'yyyy-mm-dd-ss'
            )
          }
        })
        this.page.total = res.total
      }
    },
    handlePageChange (val, attr) {
      this.page[attr] = val
      this.getGroupList()
    }
  },
  created () {
    this.getGroupList()
    bus.$emit(`set-topbar-title`, {
      title: '',
      breadcrumb: [
        { title: '项目', url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: '变量组', url: '' }
      ]
    })
  }
}
</script>

<style lang="less" scoped>
.var-group-container {
  padding: 5px 20px 25px;

  .btn-container {
    margin-top: 15px;
    margin-bottom: 15px;
  }

  .table-pagination {
    margin-top: 25px;
  }
}
</style>
