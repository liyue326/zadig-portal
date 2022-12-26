<template>
  <el-dialog title="使用变量组" :visible.sync="dialogVisible" width="55%" append-to-body>
    <div>
      <el-form ref="groupForm" :model="group" label-position="left" label-width="120px">
        <el-form-item label="选择变量组">
          <el-select v-model="group.source_id" placeholder="选择变量组" filterable size="small" style="width: 100%;">
            <el-option v-for="(group, index) in groupList" :key="index" :label="group.label" :value="group.id">
              {{ group.name }}
              <span style="color: #aaa;">({{ group.description }})</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item prop="autoSync" :label="$t('global.autoSync')" :show-message="false">
          <span slot="label">
            <span>{{$t('global.autoSync')}}</span>
            <el-tooltip effect="dark" content="当变量组发生变更时，会自动同步并更新到环境中" placement="top">
              <i class="pointer el-icon-question"></i>
            </el-tooltip>
          </span>
          <el-switch v-model="group.autoSync"></el-switch>
        </el-form-item>
      </el-form>
    </div>
    <div slot="footer">
      <el-button @click="dialogVisible = false" size="small">{{$t(`global.cancel`)}}</el-button>
      <el-button type="primary" @click="handleOpe" size="small">{{$t(`global.confirm`)}}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { getVariablesGroupsAPI } from '@api'
export default {
  props: {
    value: Boolean,
    variableSet: Object
  },
  data () {
    return {
      group: {
        source_id: '',
        autoSync: false
      },
      groupList: [],
      groupMap: {}
    }
  },
  computed: {
    dialogVisible: {
      get () {
        if (this.value && !this.groupList.length) {
          this.getGroupList()
        }
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      }
    },
    projectName () {
      return this.$route.params.project_name
    }
  },
  methods: {
    handleOpe () {
      const { source_id, autoSync } = this.group
      this.$emit('updateSourceDetail', {
        yamlSource: 'variableSet',
        overrideYaml: this.groupMap[source_id],
        variableSet: {
          source_id,
          autoSync
        }
      })
      this.dialogVisible = false
    },
    async getGroupList () {
      const res = await getVariablesGroupsAPI(
        this.projectName,
        1,
        1000
      ).catch(err => console.log(err))
      if (res) {
        const groupMap = {}
        this.groupList = (res.variable_set_list || []).map(group => {
          groupMap[group.id] = group.variable_yaml
          return {
            ...group,
            label: `${group.name} (${group.description})`
          }
        })
        this.groupMap = groupMap
      }
    }
  },
  watch: {
    variableSet (val) {
      if (val) {
        this.group.source_id = val.source_id
        this.group.autoSync = val.autoSync
      } else {
        this.group.source_id = ''
        this.group.autoSync = false
      }
    }
  }
}
</script>
