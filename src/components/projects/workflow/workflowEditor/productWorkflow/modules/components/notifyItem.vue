<template>
  <div>
    <el-card class="notifyItem box-card">
      <i class="del el-icon-delete" @click="delNotify"></i>
      <el-form :model="notify" :rules="notifyRules" label-position="top" ref="notify">
        <el-form-item prop="webhook_type">
          <span slot="label">
            <span>{{$t(`workflow.webhookType`)}}：</span>
          </span>
          <el-select v-model="notify.webhook_type" @change="clearForm" style="width: 350px;" size="small" :placeholder="$t(`global.pleaseSelect`)">
            <el-option :label="$t(`webhookType.dingding`)" value="dingding"></el-option>
            <el-option :label="$t(`webhookType.wechat`)" value="wechat"></el-option>
            <el-option :label="$t(`webhookType.feishu`)" value="feishu"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="notify.webhook_type==='feishu'" prop="feishu_webhook">
          <span slot="label">
            <span>
                      {{$t(`workflow.webhookAddr`)}}：

              <el-tooltip class="item" effect="dark" content="点击查看飞书 webhook 配置文档" placement="top">
                <a class="help-link" href="https://docs.koderover.com/zadig/project/workflow/#飞书" target="_blank">
                  <i class="el-icon-question"></i>
                </a>
              </el-tooltip>
            </span>
          </span>
          <el-input style="width: 350px;" size="small" v-model="notify.feishu_webhook"></el-input>
        </el-form-item>
        <el-form-item v-if="notify.webhook_type==='wechat'" prop="weChat_webHook">
          <span slot="label">
            <span>
                      {{$t(`workflow.webhookAddr`)}}：

              <el-tooltip class="item" effect="dark" content="点击查看企业微信 webhook 配置文档" placement="top">
                <a class="help-link" href="https://docs.koderover.com/zadig/project/workflow/#企业微信" target="_blank">
                  <i class="el-icon-question"></i>
                </a>
              </el-tooltip>
            </span>
          </span>
          <el-input style="width: 350px;" size="small" v-model="notify.weChat_webHook"></el-input>
        </el-form-item>
        <el-form-item v-if="notify.webhook_type==='dingding'" prop="dingding_webhook">
          <span slot="label">
            <span>
                      {{$t(`workflow.webhookAddr`)}}：

              <el-tooltip class="item" effect="dark" content="点击查看钉钉 webhook 配置文档" placement="top">
                <a class="help-link" href="https://docs.koderover.com/zadig/project/workflow/#钉钉" target="_blank">
                  <i class="el-icon-question"></i>
                </a>
              </el-tooltip>
            </span>
          </span>
          <el-input style="width: 350px;" size="small" v-model="notify.dingding_webhook"></el-input>
        </el-form-item>
        <el-form-item v-if="hasPlutus&&notify.webhook_type==='dingding'" prop="at_mobiles">
          <span slot="label">
            <span>    {{$t(`workflow.specifyMembersTip1`)}}：</span>
          </span>
          <el-input style="width: 350px;" type="textarea" :rows="3" :placeholder="$t(`workflow.specifyMembersTip1`)" v-model="mobileStr"></el-input>
        </el-form-item>
        <el-form-item v-if="hasPlutus&&notify.webhook_type==='wechat'" prop="wechat_user_ids">
          <span slot="label">
            <span> {{$t(`workflow.specifyMembersTip1`)}}：</span>
          </span>
          <el-input style="width: 350px;" type="textarea" :rows="3" :placeholder="$t(`workflow.specifyMembersTip1`)" v-model="wechatMobileStr"></el-input>
        </el-form-item>
        <el-form-item v-if="hasPlutus&&notify.webhook_type==='feishu'" prop="lark_user_ids">
          <span slot="label">
            <span> {{$t(`workflow.specifyMembersTip2`)}}：</span>
          </span>
          <el-input style="width: 350px;" type="textarea" :rows="3" :placeholder="$t(`workflow.specifyMembersTip2`)" v-model="feishuMobileStr"></el-input>
        </el-form-item>
        <el-form-item prop="notify_type" :label="$t(`workflow.notifyEvents`)">
          <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAllChange">全选</el-checkbox>
          <el-checkbox-group @change="handleCheckedValueChange" v-model="notify.notify_type">
            <el-checkbox v-for="type in notifyType" :key="type.label" :label="type.label">{{$t(`workflow.notifyType.${type.desc}`)}}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script type="text/javascript">
import { mapState } from 'vuex'

export default {
  name: 'NotifyItem',
  data () {
    return {
      notifyType: [
        {
          label: 'created',
          desc: 'created'
        },
        {
          label: 'passed',
          desc: 'passed'
        },
        {
          label: 'failed',
          desc: 'failed'
        },
        {
          label: 'timeout',
          desc: 'timeout'
        },
        {
          label: 'cancelled',
          desc: 'cancelled'
        },
        {
          label: 'changed',
          desc: 'changed'
        }
      ],
      isIndeterminate: true,
      notifyRules: {
        webhook_type: [
          {
            type: 'string',
            required: true,
            message: this.$t(`workflow.selectNotifyType`),
            trigger: 'blur'
          }
        ],
        weChat_webHook: [
          {
            type: 'string',
            required: true,
            message: this.$t(`workflow.inputWechatWebhook`),
            trigger: 'blur'
          }
        ],
        wechat_user_ids: [],
        lark_user_ids: [],
        dingding_webhook: [
          {
            type: 'string',
            required: true,
            message: this.$t(`workflow.inputDingTalkWebhook`),
            trigger: 'blur'
          }
        ],
        feishu_webhook: [
          {
            type: 'string',
            required: true,
            message: this.$t(`workflow.inputLarkWebhook`),
            trigger: 'blur'
          }
        ],
        notify_type: [
          {
            type: 'array',
            required: true,
            message: this.$t(`workflow.selectNotifyType`),
            trigger: 'blur'
          }
        ]
      }
    }
  },
  computed: {
    checkAll: {
      get: function () {
        return this.notify.notify_type.length === this.notifyType.length
      },
      set (val) {
        return val
      }
    },
    'notify.at_mobiles': {
      get: function () {
        return this.mobileStr.split(';')
      }
    },
    'notify.wechat_user_ids': {
      get: function () {
        return this.wechatMobileStr.split(';')
      }
    },
    'notify.lark_user_ids': {
      get: function () {
        return this.feishuMobileStr.split(';')
      }
    },
    wechatMobileStr: {
      get: function () {
        if (this.notify.wechat_user_ids) {
          return this.notify.wechat_user_ids.join(';')
        } else {
          return ''
        }
      },
      set: function (newValue) {
        if (newValue === '') {
          this.$set(this.notify, 'wechat_user_ids', [])
        } else {
          this.$set(this.notify, 'wechat_user_ids', newValue.split(';'))
        }
      }
    },
    feishuMobileStr: {
      get: function () {
        if (this.notify.lark_user_ids) {
          return this.notify.lark_user_ids.join(';')
        } else {
          return ''
        }
      },
      set: function (newValue) {
        if (newValue === '') {
          this.$set(this.notify, 'is_at_all', true)
          this.$set(this.notify, 'lark_user_ids', [])
        } else {
          this.$set(this.notify, 'is_at_all', false)
          this.$set(this.notify, 'lark_user_ids', newValue.split(';'))
        }
      }
    },
    mobileStr: {
      get: function () {
        if (this.notify.at_mobiles) {
          return this.notify.at_mobiles.join(';')
        } else {
          return ''
        }
      },
      set: function (newValue) {
        if (newValue === '') {
          this.$set(this.notify, 'is_at_all', true)
          this.$set(this.notify, 'at_mobiles', [])
        } else {
          this.$set(this.notify, 'is_at_all', false)
          this.$set(this.notify, 'at_mobiles', newValue.split(';'))
        }
      }
    },
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    })
  },
  methods: {
    delNotify () {
      this.$emit('update', this.curIndex)
    },
    handleCheckAllChange (val) {
      this.notify.notify_type = val
        ? this.notifyType.map(type => type.label)
        : []
      this.isIndeterminate = false
    },
    handleCheckedValueChange (value) {
      const typeLength = this.notifyType.length
      const checkedCount = value.length
      this.isIndeterminate = checkedCount > 0 && checkedCount < typeLength
    },
    clearForm () {
      this.$refs.notify.clearValidate()
    }
  },
  props: {
    notify: {
      required: true,
      type: Object
    },
    curIndex: {
      type: Number,
      default: null
    },
    fromWorkflow: {
      type: Boolean,
      default: true
    }
  }
}
</script>

<style lang="less" scoped>
.notifyItem {
  position: relative;

  .del {
    position: absolute;
    top: 16px;
    right: 16px;
    cursor: pointer;
  }

  .help-link {
    color: #303133;
  }
}
</style>
