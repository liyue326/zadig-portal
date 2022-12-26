<template>
  <div class="var-group-container">
    <div class="btn-container">
      <el-button plain size="small" type="primary" @click="varGroup('new')">{{$t('global.add')}}</el-button>
    </div>
    <el-table v-loading="loading" :data="groupList" class="group-container">
      <el-table-column :label="$t('project.varsGroup.name')" prop="name" />
      <el-table-column :label="$t('global.desc')" prop="description" />
      <el-table-column :label="$t('global.updateTime')" prop="updated_at" />
      <el-table-column :label="$t('global.lastModified')" prop="updated_by" />
      <el-table-column :label="$t(`global.operation`)">
        <template slot-scope="{ row }">
          <el-button size="mini" type="primary" @click="varGroup('edit', row)" plain>{{$t(`global.edit`)}}</el-button>
          <el-button size="mini" type="danger" @click="varGroup('delete', row)" plain>{{$t(`global.delete`)}}</el-button>
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
        this.$confirm(this.$t('project.varsGroup.confirmToDeleteVarsGroup', { name: row.name }), this.$t('global.confirm'), {
          confirmButtonText: this.$t(`global.confirm`),
          cancelButtonText: this.$t(`global.cancel`),
          type: 'warning'
        }).then(() => {
          deleteVariablesGroupAPI(this.projectName, row.id).then(res => {
            this.$message.success(this.$t('project.varsGroup.deleteVarsGroupSuccess', { name: row.name }))
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
      ).catch(err => console.log(err))
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
        { title: this.$t('subTopbarMenu.projects'), url: '/v1/projects' },
        {
          title: this.projectName,
          isProjectName: true,
          url: `/v1/projects/detail/${this.projectName}/detail`
        },
        { title: this.$t('subTopbarMenu.varsGroup'), url: '' }
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
