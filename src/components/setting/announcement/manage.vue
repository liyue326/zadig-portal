<template>
  <div v-loading="loading"
       :element-loading-text="$t(`global.loading`)"
       element-loading-spinner="iconfont iconfont-loading icongonggao"
       class="setting-anno-container">
    <!--announcement-create-dialog-->
    <el-dialog :title="$t('sysSetting.announcement.addAnnouncement')"
               :visible.sync="dialogAnnouncementCreateFormVisible">
      <el-form ref="announcement"
               :rules="rules"
               :model="announcement"
               label-position="left"
               label-width="110px">
        <el-form-item :label="$t('sysSetting.announcement.title')"
                      prop="content.title">
          <el-input style="width: 100%;" size="small" v-model="announcement.content.title"></el-input>
        </el-form-item>
        <el-form-item :label="$t('sysSetting.announcement.priority')"
                      prop="content.priority">
          <el-select size="small"
                     style="width: 100%;"
                     v-model="announcement.content.priority"
                     :placeholder="$t('sysSetting.announcement.selectPriority')">
            <el-option :label="$t('sysSetting.announcement.high')"
                       :value="1"></el-option>
            <el-option :label="$t('sysSetting.announcement.medium')"
                       :value="2"></el-option>
            <el-option :label="$t('sysSetting.announcement.low')"
                       :value="3"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('sysSetting.announcement.timeRange')"
                      prop="duration">
          <el-date-picker style="width: 100%;"
                          size="small"
                          v-model="announcement.duration"
                          type="datetimerange"
                          :range-separator="$t('sysSetting.announcement.timeTo')"
                          :start-placeholder="$t('sysSetting.announcement.startTime')"
                          :end-placeholder="$t('sysSetting.announcement.endTime')">
          </el-date-picker>
        </el-form-item>
        <el-form-item :label="$t('sysSetting.announcement.content')"
                      prop="content.content">
          <el-input size="small"
                    :autosize="{ minRows: 4}"
                    type="textarea"
                    v-model="announcement.content.content"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer"
           class="dialog-footer">
        <el-button size="small"
                   @click="dialogAnnouncementCreateFormVisible = false">{{$t(`global.cancel`)}}</el-button>
        <el-button :plain="true"
                   type="success"
                   size="small"
                   @click="announcementOperation('add')">{{$t(`global.save`)}}</el-button>
      </div>
    </el-dialog>
    <!--announcement-create-dialog-->

    <!--announcement-edit-dialog-->
    <el-dialog :title="$t('sysSetting.announcement.editAnnouncement')"
               :visible.sync="dialogAnnouncementEditFormVisible">
      <el-form ref="swapAnnouncement"
               :rules="rules"
               :model="swapAnnouncement"
               label-position="left"
               label-width="110px">
        <el-form-item :label="$t('sysSetting.announcement.title')"
                      prop="content.title">
          <el-input style="width: 100%;" size="small" v-model="swapAnnouncement.content.title"></el-input>
        </el-form-item>
        <el-form-item :label="$t('sysSetting.announcement.priority')"
                      prop="content.priority">
          <el-select style="width: 100%;"
                     size="small"
                     v-model="swapAnnouncement.content.priority"
                     :placeholder="$t('sysSetting.announcement.selectPriority')">
            <el-option :label="$t('sysSetting.announcement.high')"
                       :value="1"></el-option>
            <el-option :label="$t('sysSetting.announcement.medium')"
                       :value="2"></el-option>
            <el-option :label="$t('sysSetting.announcement.low')"
                       :value="3"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('sysSetting.announcement.timeRange')"
                      prop="duration">
          <el-date-picker style="width: 100%;"
                          size="small"
                          v-model="swapAnnouncement.duration"
                          type="datetimerange"
                          :range-separator="$t('sysSetting.announcement.timeTo')"
                          :start-placeholder="$t('sysSetting.announcement.startTime')"
                          :end-placeholder="$t('sysSetting.announcement.endTime')">
          </el-date-picker>
        </el-form-item>
        <el-form-item :label="$t('sysSetting.announcement.content')"
                      prop="content.content">
          <el-input style="width: 100%;"
                    size="small"
                    :autosize="{ minRows: 4}"
                    type="textarea"
                    v-model="swapAnnouncement.content.content"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer"
           class="dialog-footer">
        <el-button size="small"
                   @click="dialogAnnouncementEditFormVisible = false">{{$t(`global.cancel`)}}</el-button>
        <el-button size="small"
                   :plain="true"
                   type="success"
                   @click="announcementOperation('update')">{{$t(`global.save`)}}</el-button>
      </div>
    </el-dialog>
    <div class="section">
      <div class="sync-container">
        <el-button :plain="true"
                   size="small"
                   @click="dialogAnnouncementCreateFormVisible=true"
                   type="success">{{$t('global.add')}}</el-button>
      </div>
      <div class="announcement-list">
        <template>
          <el-table :data="allAnnouncements"
                    style="width: 100%;">
            <el-table-column :label="$t('sysSetting.announcement.title')">
              <template slot-scope="scope">
                <div class="indicator-container">
                  <span>{{scope.row.content.title}}</span>
                  <span v-if="showActive(scope.row.content.start_time,scope.row.content.end_time)"
                        class="ann-active"></span>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sysSetting.announcement.priority')">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.content.priority===1"
                        size="mini"
                        effect="dark"
                        type="danger">{{$t('sysSetting.announcement.high')}}</el-tag>
                <el-tag v-if="scope.row.content.priority===2"
                        size="mini"
                        effect="dark"
                        type="warning">{{$t('sysSetting.announcement.medium')}}</el-tag>
                <el-tag v-if="scope.row.content.priority===3"
                        size="mini"
                        effect="dark"
                        type="info">{{$t('sysSetting.announcement.low')}}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sysSetting.announcement.startTime')">
              <template slot-scope="scope">
                <i class="el-icon-time"></i>
                <span style="margin-left: 10px;">{{
                  $utils.convertTimestamp(scope.row.content.start_time) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sysSetting.announcement.endTime')">
              <template slot-scope="scope">
                <i class="el-icon-time"></i>
                <span style="margin-left: 10px;">{{
                  $utils.convertTimestamp(scope.row.content.end_time) }}</span>
              </template>
            </el-table-column>

            <el-table-column :label="$t(`global.operation`)">
              <template slot-scope="scope">
                <el-button @click="announcementOperation('edit',scope.row)"
                           size="mini" type="primary" plain>{{$t(`global.edit`)}}</el-button>
                <el-button @click="announcementOperation('delete',scope.row)"
                           size="mini"
                           type="danger" plain>{{$t(`global.delete`)}}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </div>
    </div>

  </div>
</template>

<script>
import { deleteAnnouncementAPI, createAnnouncementAPI, updateAnnouncementAPI, getAnnouncementListAPI } from '@api'
import bus from '@utils/eventBus'
export default {
  data () {
    return {
      announcement: {
        content: {
          title: '',
          priority: null,
          content: ''
        },
        receiver: '*',
        type: 1
      },
      swapAnnouncement: {
        content: {
          title: '',
          priority: null,
          content: ''
        },
        receiver: '*',
        type: 1
      },
      dialogAnnouncementCreateFormVisible: false,
      dialogAnnouncementEditFormVisible: false,
      allAnnouncements: [],
      loading: true
    }
  },
  computed: {
    rules () {
      return {
        'content.title': [{ required: true, message: this.$t('sysSetting.announcement.inputTitle'), trigger: ['blur', 'change'] }],
        'content.priority': [{ required: true, message: this.$t('sysSetting.announcement.selectPriority'), trigger: ['blur', 'change'] }],
        'content.content': [{ required: true, message: this.$t('sysSetting.announcement.inputContent'), trigger: ['blur', 'change'] }],
        duration: [
          {
            type: 'array',
            required: true,
            message: this.$t('sysSetting.announcement.selectStartTimeAndEndTime'),
            trigger: 'change'
          }
        ]
      }
    }
  },
  methods: {
    announcementOperation (operate, current_announcement) {
      if (operate === 'add') {
        this.$refs.announcement.validate(valid => {
          if (valid) {
            const duration = this.announcement.duration
            const announcement = this.announcement
            announcement.content.priority = parseInt(this.announcement.content.priority)
            this.announcement.content.start_time = this.parseTime(duration[0], duration[1]).start
            this.announcement.content.end_time = this.parseTime(duration[0], duration[1]).end
            delete announcement.duration
            this.dialogAnnouncementCreateFormVisible = false
            this.addAnnouncement(announcement)
          } else {
            return false
          }
        })
      } else if (operate === 'edit') {
        this.swapAnnouncement = current_announcement
        this.$set(this.swapAnnouncement, 'duration', [new Date(current_announcement.content.start_time * 1000), new Date(current_announcement.content.end_time * 1000)])
        this.dialogAnnouncementEditFormVisible = true
      } else if (operate === 'update') {
        this.$refs.swapAnnouncement.validate(valid => {
          if (valid) {
            const duration = this.swapAnnouncement.duration
            const announcement = this.swapAnnouncement
            announcement.content.priority = parseInt(this.swapAnnouncement.content.priority)
            announcement.content.start_time = this.parseTime(duration[0], duration[1]).start
            announcement.content.end_time = this.parseTime(duration[0], duration[1]).end
            delete announcement.duration
            this.dialogAnnouncementEditFormVisible = false
            this.updateAnnouncement(announcement)
          } else {
            return false
          }
        })
      } else if (operate === 'delete') {
        deleteAnnouncementAPI(current_announcement.id).then(
          response => {
            this.$message({
              message: this.$t('sysSetting.announcement.announcementHasBeenDeleted'),
              type: 'success'
            })
            this.getAnnouncements()
          }
        )
      }
    },
    parseTime (start, end) {
      return {
        start: Math.floor(Date.parse(start) / 1000),
        end: Math.floor(Date.parse(end) / 1000)
      }
    },
    showActive (start, end) {
      const now = Math.floor(Date.parse(new Date()) / 1000)
      if (now >= start && now <= end) {
        return true
      } else {
        return false
      }
    },
    addAnnouncement (data) {
      createAnnouncementAPI(data).then(
        response => {
          this.$message({
            message: this.$t('sysSetting.announcement.addAnnouncementSuccess'),
            type: 'success'
          })
          this.getAnnouncements()
          this.announcement = {
            content: {
              title: '',
              priority: null,
              content: ''
            },
            receiver: '*',
            type: 1
          }
        },
        response => {
          this.$message({
            message: this.$t('sysSetting.announcement.addAnnouncementFailed'),
            type: 'error'
          })
        }
      )
    },
    updateAnnouncement (data) {
      updateAnnouncementAPI(data).then(
        response => {
          this.$message({
            message: this.$t('sysSetting.announcement.editAnnouncementSuccess'),
            type: 'success'
          })
          this.getAnnouncements()
        },
        response => {
          this.$message({
            message: this.$t('sysSetting.announcement.editAnnouncementFailed'),
            type: 'error'
          })
        }
      )
    },
    getAnnouncements () {
      this.loading = true
      getAnnouncementListAPI().then(
        response => {
          this.loading = false
          this.allAnnouncements = response
        }
      )
    }
  },
  created () {
    bus.$emit('set-topbar-title', { title: '', breadcrumb: [{ title: this.$t(`sidebarMenu.announcement`), url: '' }] })
    this.getAnnouncements()
  }
}
</script>

<style lang="less" scoped>
.setting-anno-container {
  position: relative;
  flex: 1;
  padding: 15px 30px;
  overflow: auto;
  font-size: 13px;

  .section {
    margin-bottom: 56px;

    .sync-container {
      padding-top: 15px;
      padding-bottom: 15px;
      overflow: hidden;

      .el-button--success.is-plain {
        color: @themeColor;
        background: #fff;
        border-color: @themeColor;
      }

      .el-button--success.is-plain:hover {
        color: @themeColor;
        background: #fff;
        border-color: @themeColor;
      }
    }

    .announcement-list {
      padding-bottom: 30px;

      .indicator-container {
        display: inline-flex;
        align-items: center;

        .ann-active {
          display: inline-block;
          width: 6px;
          height: 6px;
          margin-left: 5px;
          background: @themeColor;
          border-radius: 50%;
        }
      }
    }
  }
}
</style>
