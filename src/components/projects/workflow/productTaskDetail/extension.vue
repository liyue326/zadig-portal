<template>
  <div class="extension-container">
    <div class="primary-title not-first-child">扩展</div>
    <el-alert
      v-if="extensionStage.error"
      title="错误信息"
      :description="extensionStage.error"
      type="error"
      close-text="知道了"
      style="margin: 8px 0;"
    ></el-alert>
    <el-row :gutter="0" class="extension-content">
      <el-col :span="6">
        <i class="iconfont iconzhuangtai"></i> 状态
      </el-col>
      <el-col
        :span="6"
        :class="colorTranslation(extensionStage.status, 'pipeline', 'task')"
      >{{ extensionStage.status ? myTranslate(extensionStage.status) : "未运行" }}</el-col>
      <el-col v-if="extensionStage.status!=='running'" :span="6">
        <i class="iconfont iconshijian"></i> 持续时间
      </el-col>
      <el-col v-if="extensionStage.status!=='running'" :span="6">{{ extensionStage.duration }}</el-col>
    </el-row>
    <el-row :gutter="0" class="extension-content" v-if="extensionStage.payload">
      <el-col :span="6">
        <i class="iconfont iconBoardList"></i> Request
      </el-col>
      <el-col :span="6">
        <el-popover popper-class="payload-popover" placement="top" width="400" trigger="click">
          <div v-if="extensionStage.request_header.length > 0" style="margin-bottom: 5px;">
            <span style="display: inline-block; margin-bottom: 5px; color: #000; font-size: 16px;">Request Header:</span>
            <ul style="padding: 10px 5px; border: 1px solid #ebeef5; border-radius: 6px;">
              <li v-for="(header,index) in extensionStage.request_header" :key="index">
                <span style="font-weight: 500;">{{ header.key }}:</span>
                <span style="font-weight: 500;">{{ header.value }}</span>
              </li>
            </ul>
          </div>
          <div v-if="extensionStage.payload">
            <span style="display: inline-block; margin-bottom: 10px; color: #000; font-size: 16px;">Request Payload:</span>
            <VueJsonPretty  style="padding: 10px 5px; border: 1px solid #ebeef5; border-radius: 6px;" :data="JSON.parse(extensionStage.payload)" />
          </div>
          <span slot="reference" class="btn">查看</span>
        </el-popover>
      </el-col>
      <el-col :span="6">
        <i class="iconfont iconBoardList"></i> Response
      </el-col>
      <el-col :span="6">
        <el-popover popper-class="payload-popover" placement="top" width="400" trigger="click">
          <div v-if="extensionStage.response_code" style="margin: 10px 0;">
            <span style="display: inline-block; color: #000; font-size: 16px;">Response Code:</span>
            <div style="margin-top: 10px;">
              <el-tag v-if="extensionStage.response_code <=299" type="success" size="mini" effect="dark">{{ extensionStage.response_code }}</el-tag>
              <el-tag
                v-else-if="extensionStage.response_code > 299"
                type="danger"
                size="mini"
                effect="dark"
              >{{ extensionStage.response_code }}</el-tag>
            </div>
          </div>
          <div v-if="extensionStage.response_body" style="margin: 10px 0;">
            <span style="display: inline-block; color: #000; font-size: 16px;">Response Body:</span>
            <VueJsonPretty style="padding: 10px; border: 1px solid #ebeef5; border-radius: 6px;" v-if="checkJSON(extensionStage.response_body)" :data="JSON.parse(extensionStage.response_body)" />
            <pre v-else style="max-height: 400px; padding: 10px 5px; overflow: auto; border: 1px solid #ebeef5; border-radius: 6px;">{{extensionStage.response_body}}</pre>
          </div>
          <span slot="reference" class="btn">查看</span>
        </el-popover>
      </el-col>
    </el-row>
  </div>
</template>
<script>
import { wordTranslate, colorTranslate } from '@utils/wordTranslate.js'
import VueJsonPretty from 'vue-json-pretty'
import isJSON from 'validator/lib/isJSON'
export default {
  props: {
    extensionStage: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    colorTranslation (word, category, subitem) {
      return colorTranslate(word, category, subitem)
    },
    myTranslate (word) {
      return wordTranslate(word, 'pipeline', 'task')
    },
    checkJSON (str) {
      return isJSON(str)
    }
  },
  components: {
    VueJsonPretty
  }
}
</script>
<style lang="less" scoped>
.extension-container {
  .extension-content {
    margin-top: 12px;
    color: #8d9199;
    font-size: 14px;
    line-height: 22px;

    .btn {
      color: @themeColor;
      cursor: pointer;

      &:hover {
        color: #66b1ff;
      }
    }
  }
}
</style>
