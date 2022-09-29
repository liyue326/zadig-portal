<template>
  <div v-loading="loading"
       element-loading-text="加载中..."
       element-loading-spinner="iconfont iconfont-loading icongonggao"
       class="setting-anno-container">
    <!--announcement-create-dialog-->
    <el-dialog title='新建'
               :visible.sync="dialogAnnouncementCreateFormVisible">
      <el-form ref="announcement"
               :rules="rules"
               :model="announcement"
               label-width="90px">
        <el-form-item label="标题"
                      prop="content.title">
          <el-input style="width: 100%;" size="small" v-model="announcement.content.title"></el-input>
        </el-form-item>
        <el-form-item label="优先级"
                      prop="content.priority">
          <el-select size="small"
                     style="width: 100%;"
                     v-model="announcement.content.priority"
                     placeholder="请选择优先级">
            <el-option label="高"
                       :value="1"></el-option>
            <el-option label="中"
                       :value="2"></el-option>
            <el-option label="低"
                       :value="3"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围"
                      prop="duration">
          <el-date-picker style="width: 100%;"
                          size="small"
                          v-model="announcement.duration"
                          type="datetimerange"
                          range-separator="至"
                          start-placeholder="开始日期"
                          end-placeholder="结束日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="内容"
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
                   @click="dialogAnnouncementCreateFormVisible = false">取 消</el-button>
        <el-button :plain="true"
                   type="success"
                   size="small"
                   @click="announcementOperation('add')">保存</el-button>
      </div>
    </el-dialog>
    <!--announcement-create-dialog-->

    <!--announcement-edit-dialog-->
    <el-dialog title='修改公告'
               :visible.sync="dialogAnnouncementEditFormVisible">
      <el-form ref="swapAnnouncement"
               :rules="rules"
               :model="swapAnnouncement"
               label-width="90px">
        <el-form-item label="标题"
                      prop="content.title">
          <el-input style="width: 100%;" size="small" v-model="swapAnnouncement.content.title"></el-input>
        </el-form-item>
        <el-form-item label="优先级"
                      prop="content.priority">
          <el-select style="width: 100%;"
                     size="small"
                     v-model="swapAnnouncement.content.priority"
                     placeholder="请选择优先级">
            <el-option label="高"
                       :value="1"></el-option>
            <el-option label="中"
                       :value="2"></el-option>
            <el-option label="低"
                       :value="3"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围"
                      prop="duration">
          <el-date-picker style="width: 100%;"
                          size="small"
                          v-model="swapAnnouncement.duration"
                          type="datetimerange"
                          range-separator="至"
                          start-placeholder="开始日期"
                          end-placeholder="结束日期">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="内容"
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
                   @click="dialogAnnouncementEditFormVisible = false">取 消</el-button>
        <el-button size="small"
                   :plain="true"
                   type="success"
                   @click="announcementOperation('update')">保存</el-button>
      </div>
    </el-dialog>
    <div class="section">
      <div class="sync-container">
        <el-button :plain="true"
                   size="small"
                   @click="dialogAnnouncementCreateFormVisible=true"
                   type="success">新建</el-button>
      </div>
      <div class="announcement-list">
        <template>
          <el-table :data="allAnnouncements"
                    style="width: 100%;">
            <el-table-column label="标题">
              <template slot-scope="scope">
                <div class="indicator-container">
                  <span>{{scope.row.content.title}}</span>
                  <span v-if="showActive(scope.row.content.start_time,scope.row.content.end_time)"
                        class="ann-active"></span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="优先级">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.content.priority===1"
                        size="mini"
                        effect="dark"
                        type="danger">高</el-tag>
                <el-tag v-if="scope.row.content.priority===2"
                        size="mini"
                        effect="dark"
                        type="warning">中</el-tag>
                <el-tag v-if="scope.row.content.priority===3"
                        size="mini"
                        effect="dark"
                        type="info">低</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="开始时间">
              <template slot-scope="scope">
                <i class="el-icon-time"></i>
                <span style="margin-left: 10px;">{{
                  $utils.convertTimestamp(scope.row.content.start_time) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="结束时间">
              <template slot-scope="scope">
                <i class="el-icon-time"></i>
                <span style="margin-left: 10px;">{{
                  $utils.convertTimestamp(scope.row.content.end_time) }}</span>
              </template>
            </el-table-column>

            <el-table-column label="操作">
              <template slot-scope="scope">
                <el-button @click="announcementOperation('edit',scope.row)"
                           size="mini" type="primary" plain>编辑</el-button>
                <el-button @click="announcementOperation('delete',scope.row)"
                           size="mini"
                           type="danger" plain>删除</el-button>
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
      rules: {
        'content.title': [{ required: true, message: '请输入公告标题', trigger: ['blur', 'change'] }],
        'content.priority': [{ required: true, message: '请选择优先级', trigger: ['blur', 'change'] }],
        'content.content': [{ required: true, message: '请填写公告内容', trigger: ['blur', 'change'] }],
        duration: [
          {
            type: 'array',
            required: true,
            message: '请选择起止时间',
            trigger: 'change'
          }
        ]
      },
      loading: true
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
              message: '公告已删除',
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
            message: '新增公告成功',
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
            message: '新增公告失败',
            type: 'error'
          })
        }
      )
    },
    updateAnnouncement (data) {
      updateAnnouncementAPI(data).then(
        response => {
          this.$message({
            message: '修改公告成功',
            type: 'success'
          })
          this.getAnnouncements()
        },
        response => {
          this.$message({
            message: '修改公告失败',
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
    bus.$emit(`set-topbar-title`, { title: '公告管理', breadcrumb: [] })
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
