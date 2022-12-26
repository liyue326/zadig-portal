<template>
  <span class="notification">
    <el-popover ref="notifyPop" placement="bottom" width="300" popper-class="notify-container" trigger="hover" v-model="showPopover">
      <div class="notify-header">
        <span class="msg">通知</span>
        <el-tooltip effect="dark" content="通知设置" placement="top">
          <router-link to="/v1/profile/info" class="setting pull-right">
            <i class="el-icon-setting icon"></i>
          </router-link>
        </el-tooltip>
        <el-tooltip effect="dark" content="全部通知设为已读" placement="top">
          <span @click="notificationOperation('mark_all_as_read')" style="margin-right: 15px;" class="setread pull-right">
            <i class="el-icon-check"></i>
          </span>
        </el-tooltip>
      </div>
      <div class="notify-body">
        <div v-if="notifications.length===0" class="no-msg">没有通知</div>
        <div>
          <ul class="notifications-list">
            <li v-for="(notification,index) in notifications" :key="index" class="notification" :class="{'has-read':notification.is_read}">
              <div v-if="notification.type===2">
                <h3>
                  <span>
                    <el-tag
                      size="mini"
                      effect="plain"
                      :type="$utils.taskElTagType(notification.content.status)"
                      close-transition
                    >{{notification.content.status?$t(`workflowTaskStatus.${notification.content.status}`):$t(`workflowTaskStatus.notRunning`) }}</el-tag>

                    <router-link
                      :to="`/v1/projects/detail/${notification.content.product_name}/pipelines/${notification.content.type==='single'?notification.content.type:'multi'}/${notification.content.pipeline_name}/${notification.content.task_id}?status=${notification.content.status}`"
                    >
                      <span @click="markAsRead(notification, index)" class="notification-id">
                        {{'#' +
                        notification.content.task_id}}
                      </span>
                    </router-link>
                    <br />
                    <em>{{notification.content.pipeline_name}}</em>
                  </span>
                </h3>
                <div class="item-bottom">
                  <div class="event-extra">
                    <span :class="{'is-read':notification.is_read,'unread':!notification.is_read}">{{notification.is_read?'已读':'未读'}}</span>
                    <span class="time">{{$utils.convertTimestamp(notification.create_time)}}</span>
                  </div>
                  <span v-if="!notification.is_read" @click="notificationOperation('mark_as_read', notification, index)" class="operation read">
                    <el-tooltip effect="dark" content="设为已读" placement="top">
                      <i class="el-icon-check"></i>
                    </el-tooltip>
                  </span>
                  <span @click="notificationOperation('delete', notification, index)" class="operation delete">
                    <el-tooltip effect="dark" content="删除该通知" placement="top">
                      <i class="el-icon-delete"></i>
                    </el-tooltip>
                  </span>
                </div>
              </div>
              <div v-if="notification.type===3">
                <h3>
                  <span class="status" style="margin-right: 10px;">{{notification.content.title}}</span>
                </h3>
                <div class="announcement-content">
                  <p>{{notification.content.content}}{{"("+notification.content.req_id+")"}}</p>
                </div>
                <div class="item-bottom">
                  <div class="event-extra">
                    <span class="is-read">{{notification.is_read?'已读':'未读'}}</span>
                    <span class="time">{{$utils.convertTimestamp(notification.create_time)}}</span>
                  </div>
                  <span v-if="!notification.is_read" @click="notificationOperation('mark_as_read', notification, index)" class="operation read">
                    <el-tooltip effect="dark" content="设为已读" placement="top">
                      <i class="el-icon-check"></i>
                    </el-tooltip>
                  </span>
                  <span @click="notificationOperation('delete', notification, index)" class="operation delete">
                    <el-tooltip effect="dark" content="删除该通知" placement="top">
                      <i class="el-icon-delete"></i>
                    </el-tooltip>
                  </span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </el-popover>
    <div class="notify">
      <el-badge :value="unreadMsgs.length" :max="99" :hidden="unreadMsgs.length===0" class="item">
        <span v-popover:notifyPop>
          <i class="el-icon-bell icon-bell"></i>
        </span>
      </el-badge>
    </div>
  </span>
</template>
<script>
import { colorTranslate } from '@utils/wordTranslate'
import {
  getNotificationAPI,
  deleteNotificationAPI,
  markNotiReadAPI
} from '@api'
export default {
  props: {},
  data: function () {
    return {
      notifications: [],
      unreadMsgs: [],
      showPopover: false
    }
  },
  methods: {
    getNotifications () {
      getNotificationAPI().then(res => {
        this.notifications = res
        this.unreadMsgs = []
        this.notifications.forEach(element => {
          if (!element.is_read) {
            this.unreadMsgs.push(element)
          }
        })
        this.showPopover = !!this.unreadMsgs.length
      })
    },

    notificationOperation (operation, item, index) {
      if (operation === 'delete') {
        const payload = {
          ids: [item.id]
        }
        deleteNotificationAPI(payload).then(res => {
          this.getNotifications()
        })
      } else if (operation === 'mark_as_read') {
        const payload = {
          ids: [item.id]
        }
        markNotiReadAPI(payload).then(res => {
          this.getNotifications()
        })
      } else if (operation === 'mark_all_as_read') {
        const payload = {
          ids: []
        }
        this.notifications.forEach(element => {
          payload.ids.push(element.id)
        })
        markNotiReadAPI(payload).then(res => {
          this.getNotifications()
        })
      }
    },
    colorTranslation (word, category, subitem) {
      return colorTranslate(word, category, subitem)
    },
    markAsRead (item, index) {
      if (!item.is_read) {
        this.notificationOperation('mark_as_read', item, index)
      }
    }
  },
  created () {
    this.getNotifications()
  }
}
</script>
<style lang="less">
.el-badge__content {
  &.is-fixed {
    top: 30%;
  }
}

.notification {
  display: inline-block;

  .notification-id {
    color: @themeColor;
    font-size: 14px;
    cursor: pointer;
  }
}

.notify {
  .icon-bell {
    font-size: 20px;
  }
}

.notify-container {
  padding: 0 !important;

  .notify-header {
    padding: 15px 20px;
    background-color: #f2f3f5;
    border-bottom: 1px solid #dcdfe5;

    .msg {
      font-size: 13px;
    }

    .pull-right {
      float: right;
    }

    .setting,
    .setread {
      color: #000;
      font-size: 18px;
      cursor: pointer;

      &:hover {
        color: @themeColor;
      }
    }
  }

  .notify-body {
    height: 290px;
    padding: 2px 5px;
    overflow: hidden;
    overflow-y: auto;

    &::-webkit-scrollbar-track {
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    &::-webkit-scrollbar {
      width: 4px;
      background-color: #f5f5f5;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 4px;
      box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.3);
    }

    .no-msg {
      padding: 15px 20px;
      color: #5e6166;
      font-size: 12px;
      line-height: 200px;
      text-align: center;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      width: 100%;
      margin: 0;
      padding-left: 0;
      list-style: none;

      .notification {
        position: relative;
        padding: 10px 20px 10px 20px;
        background: #fff;
        border-bottom: 1px solid #e2dee6;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);

        .item-bottom {
          display: flex;
          justify-content: space-between;
        }

        .operation {
          display: inline-block;
          margin-left: 10px;
          font-size: 16px;
          visibility: hidden;
          cursor: pointer;
        }

        &:hover {
          background-color: #f1f8ff;

          .operation {
            visibility: visible;
          }
        }

        .icon {
          position: absolute;
          top: 16px;
          left: 10px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .color-running {
          color: @themeColor;
          font-weight: 500;
        }

        .color-failed {
          color: #ff1949;
          font-weight: 500;
        }

        .color-cancelled {
          color: #909399;
          font-weight: 500;
        }

        .color-timeout {
          color: #e6a23c;
          font-weight: 500;
        }

        .color-passed {
          color: #6ac73c;
          font-weight: 500;
        }

        h3 {
          margin: 0;
          color: #303133;
          font-weight: 400;
          font-size: 13px;

          em {
            color: #303133;
            font-weight: 400;
            font-size: 14px;
            font-style: normal;

            .task_id {
              color: @themeColor;
            }
          }
        }

        &.has-read {
          h3 {
            color: #606266;
            filter: grayscale(80%);

            em {
              color: inherit;
            }
          }
        }

        .event-extra {
          flex: 1 1 auto;

          .is-read {
            margin-right: 10px;
            color: #999;
            font-size: 13px;
          }

          .unread {
            margin-right: 10px;
            color: #606266;
            font-size: 13px;
          }

          .time {
            margin-right: 10px;
            color: #606266;
            font-size: 13px;
          }
        }

        .announcement-content {
          p {
            margin: 5px 0;
            font-size: 12px;
          }
        }

        .operation.read {
          &:hover {
            color: @themeColor;
          }
        }

        .operation.delete {
          &:hover {
            color: #ff1949;
          }
        }
      }
    }
  }
}
</style>
