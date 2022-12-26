<template>
  <div class="notify-operate">
    <el-form :model="notify" :rules="notifyRules" label-position="top" ref="ruleForm">
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
              <a class="help-link" href="https://docs.koderover.com/zadig/project/common-workflow/#通知配置" target="_blank">
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
              <a class="help-link" href="https://docs.koderover.com/zadig/project/common-workflow/#通知配置" target="_blank">
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
              <a class="help-link" href="https://docs.koderover.com/zadig/project/common-workflow/#通知配置" target="_blank">
                <i class="el-icon-question"></i>
              </a>
            </el-tooltip>
          </span>
        </span>
        <el-input style="width: 350px;" size="small" v-model="notify.dingding_webhook"></el-input>
      </el-form-item>
      <el-form-item v-if="notify.webhook_type==='dingding'" prop="at_mobiles">
        <span slot="label">
          <span>{{$t(`workflow.specifyMembersTip1`)}}：</span>
        </span>
        <el-input style="width: 350px;" type="textarea" :rows="3" :placeholder="$t(`workflow.specifyMembersTip1`)" v-model="mobileStr"></el-input>
      </el-form-item>
      <el-form-item v-if="notify.webhook_type==='wechat'" prop="wechat_user_ids">
        <span slot="label">
          <span>{{$t(`workflow.specifyMembersTip2`)}}：</span>
        </span>
        <el-input style="width: 350px;" type="textarea" :rows="3" placeholder="输入指定通知接收人的 user_id，使用 ; 分割" v-model="wechatMobileStr"></el-input>
      </el-form-item>
      <el-form-item v-if="notify.webhook_type==='feishu'" prop="lark_user_ids">
        <span slot="label">
          <span>{{$t(`workflow.specifyMembersTip2`)}}：</span>
        </span>
        <el-input
          style="width: 350px;"
          type="textarea"
          :rows="3"
          placeholder="输入指定通知接收人的 user_id，使用 ; 分割，为空则全员通知"
          v-model="feishuMobileStr"
        ></el-input>
      </el-form-item>
      <el-form-item prop="notify_type" :label="$t(`workflow.notifyEvents`)">
        <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAllChange">全选</el-checkbox>
        <el-checkbox-group @change="handleCheckedValueChange" v-model="notify.notify_type" class="events">
          <el-row :gutter="4">
            <el-col :span="4" v-for="(type) in notifyType" :key="type.label">
              <el-checkbox :label="type.label">{{$t(`workflow.notifyType.${type.desc}`)}}</el-checkbox>
            </el-col>
          </el-row>
        </el-checkbox-group>
      </el-form-item>
    </el-form>
  </div>
</template>
<script type="text/javascript">
import { notifyType } from '../../config'
export default {
  data () {
    return {
      notifyType,
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
  props: {
    notify: {
      type: Object,
      default: () => ({
        notify_type: ''
      })
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
    }
  },
  methods: {
    validate () {
      return this.$refs.ruleForm.validate()
    },
    getData () {
      return this.notify
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
      this.$refs.ruleForm.clearValidate()
    }
  }
}
</script>
<style lang="less" scoped>
.notify-operate {
  .events {
    /deep/div.el-col:nth-child(4) {
      margin-right: 30%;
    }
  }
}
</style>
