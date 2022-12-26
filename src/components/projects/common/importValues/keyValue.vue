<template>
  <div class="key-value-container">
    <div class="secondary-title" style="margin-bottom: 10px;">{{$t('environments.helm.keyValueComp.title')}}</div>
    <el-form ref="form" :model="keyValueForm" label-position="left">
      <el-table :data="keyValues">
        <el-table-column :label="$t(`global.key`)">
          <template slot-scope="{ $index }">
            <el-form-item
              :prop="`keyValues[${$index}].key`"
              :rules="[{
                  required: true, message: '请输入 key 值', trigger: 'blur'
              }, {
                  validator: validateKey, trigger: 'change'
              }]"
            >
              <el-select
                v-model="keyValueForm.keyValues[$index].key"
                filterable
                allow-create
                clearable
                :placeholder="$t(`global.key`)"
                size="small"
                @change="selectKey($event, $index)"
                @visible-change="firstEstimatedValues"
                style="width: 100%;"
              >
                <el-option v-for="key in lastKeys" :key="key" :label="key" :value="key"></el-option>
              </el-select>
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column :label="$t(`global.value`)">
          <template slot-scope="{ $index }">
            <el-form-item
              :prop="`keyValues[${$index}].value`"
              :rules="{
                  required: true, message: '请输入 value 值', trigger: 'blur'
              }"
            >
              <el-input v-model="keyValueForm.keyValues[$index].value" :placeholder="$t(`global.value`)" size="small"></el-input>
            </el-form-item>
          </template>
        </el-table-column>
        <el-table-column :label="$t(`global.operation`)" width="120px">
          <template slot-scope="{ $index }">
            <span class="operate" @click="keyValues.splice($index, 1)">
              <i class="el-icon-close"></i>
            </span>
            <span class="operate" @click="addKeyValue">
              <i class="el-icon-plus"></i>
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
    <el-button type="text" @click="addKeyValue" icon="el-icon-circle-plus-outline" class="gray-color">{{$t(`global.add`)}}</el-button>
  </div>
</template>

<script>
export default {
  data () {
    this.validateKey = (rule, value, callback) => {
      const keys = this.keyValues.map(value => value.key)
      if (value === '') {
        callback(new Error('请输入 key 值'))
      } else if (keys.indexOf(value) !== keys.lastIndexOf(value)) {
        callback(new Error('key 值重复'))
      } else {
        callback()
      }
    }

    return {}
  },
  props: {
    keyValues: {
      default: () => [],
      type: Array
    },
    listKeyValues: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  computed: {
    keyValueForm () {
      return {
        keyValues: this.keyValues
      }
    },
    lastKeys () {
      const keys = this.keyValues.map(kv => kv.key)
      return Object.keys(this.listKeyValues).filter(key => !keys.includes(key))
    }

  },
  methods: {
    selectKey (key, index) {
      this.keyValues[index].value = this.listKeyValues[key] || ''
    },
    firstEstimatedValues (value) {
      if (value && this.lastKeys.length === 0) this.$emit('estimatedValues')
    },
    addKeyValue () {
      this.validate().then(() => {
        this.keyValues.push({
          key: '',
          value: ''
        })
        this.$emit('estimatedValues')
      })
    },
    validate () {
      return this.$refs.form
        .validate()
        .then(() => {
          return Promise.resolve(true)
        })
        .catch(err => {
          console.log(err)
          return Promise.reject(false)
        })
    }
  }
}
</script>

<style lang="less" scoped>
@secondaryColor: #888888;
@darkBackgroundColor: rgba(246, 246, 246, 0.6);

.key-value-container {
  /deep/ .el-table {
    td {
      padding: 4px 0;

      &.el-table__cell {
        border-bottom-width: 0;

        .operate {
          display: inline-block;
          box-sizing: border-box;
          margin-right: 5px;
          padding: 3px;
          font-size: 12px;
          line-height: 1;
          background: #fff;
          border: 1px solid rgba(118, 122, 200, 0.5);
          border-radius: 4px;
          cursor: pointer;
        }
      }
    }

    th.el-table__cell {
      color: @secondaryColor;
      background: #fff;
    }

    .el-table__row {
      background: @darkBackgroundColor;
    }

    .el-table__empty-block {
      min-height: 48px;
      background-color: @darkBackgroundColor;

      .el-table__empty-text {
        font-weight: 300;
        line-height: 48px;
      }
    }

    .el-form-item {
      margin-bottom: 0;
    }
  }

  .gray-color {
    color: @fontLightGray;
  }
}
</style>
