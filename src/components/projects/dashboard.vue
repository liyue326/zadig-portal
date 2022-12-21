<template>
  <div class="dashboard">
    <div class="header">
      <el-input placeholder="搜索" class="header-search"></el-input>
      <el-button class="header-btn" type="primary" @click="isShowCardDialog=true">添加卡片</el-button>
    </div>
    <div class="main">
      <draggable v-model="info" group="people" @start="onStart" @end="onEnd">
        <transition-group class="wrap">
          <el-card v-for="(item) in info" :key="item.title" class="item">
            <div slot="header" class="clearfix">
              <span>{{item.title}}</span>
              <el-dropdown style="float: right;" @command="handleCommand($event, item)">
                <span class="el-dropdown-link">
                  <el-button type="text">
                    操作
                    <i class="el-icon-arrow-down el-icon--right"></i>
                  </el-button>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="delete">删除</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </div>
            <div>
              <el-table :data="item.list" style="width: 100%;" v-if="item.show">
                <el-table-column prop="name" label="工作流名称" width="180"></el-table-column>
                <el-table-column prop="creator" label="执行人" width="180"></el-table-column>
                <el-table-column prop="time" label="创建时间"></el-table-column>
              </el-table>
              <div v-else>
                <div>
                  <el-select placeholder="选择工作流">
                    <el-option v-for="item in item.list" :key="item.name">{{item.name}}</el-option>
                  </el-select>
                </div>
                <div>
                  <el-select placeholder="选择项目">
                    <el-option v-for="item in item.list" :key="item.name">{{item.name}}</el-option>
                  </el-select>
                  <el-select placeholder="选择环境">
                    <el-option v-for="item in item.list" :key="item.name">{{item.name}}</el-option>
                  </el-select>
                  <el-select placeholder="选择服务">
                    <el-option v-for="item in item.list" :key="item.name">{{item.name}}</el-option>
                  </el-select>
                </div>
                <div class="mg-t24">
                  <el-button type="primary" size="small">保存</el-button>
                  <el-button size="small">取消</el-button>
                </div>
              </div>
            </div>
          </el-card>
        </transition-group>
      </draggable>
    </div>
    <el-dialog title="添加卡片" :visible.sync="isShowCardDialog" width="60%" class="card-dialog">
      <el-card shadow="hover" v-for="item in cardTypeList" :key="item.title" class="card">
        <div class="type" @click="operateCard(item)">
          <span class="type-title">{{item.title}}</span>
          <span class="type-desc">{{item.desc}}</span>
        </div>
      </el-card>
    </el-dialog>
  </div>
</template>
<script>
import draggable from 'vuedraggable'
import { deleteBuildConfigAPI } from '@api'
export default {
  name: 'Dashboard',
  data () {
    return {
      info: [
        {
          title: '运行中的工作流',
          show: true,
          list: [
            {
              name: '32',
              creator: '32re',
              time: '324243242'
            },
            {
              name: '3rewr2',
              creator: '3rewr2re',
              time: '3242rewr43242'
            },
            {
              name: '3rerewrwwr2',
              creator: '3rerewrwr2re',
              time: '3242rewr43242'
            }
          ]
        },
        {
          title: '我的工作流',
          show: true,
          list: [
            {
              name: '32',
              creator: '32re',
              time: '324243242'
            },
            {
              name: '3re惹二wr2',
              creator: '3rewr2re',
              time: '3242rewr43242'
            },
            {
              name: '3rerewrwwr2',
              creator: '3rerewrwr2re',
              time: '3242rewr43242'
            }
          ]
        },
        {
          title: '我的环境',
          show: true,
          list: [
            {
              name: '32',
              creator: '32re',
              time: '324243242'
            },
            {
              name: '3rewr2',
              creator: '3rewr2re',
              time: '3242rewr43242'
            },
            {
              name: '3rerewrwwr2',
              creator: '3rerewrwr2re',
              time: '3242rewr43242'
            }
          ]
        },
        {
          title: '运行中的工32作流',
          show: true,
          list: [
            {
              name: '32',
              creator: '32re',
              time: '324243242'
            },
            {
              name: '3rewr2',
              creator: '3rewr2re',
              time: '3242rewr43242'
            },
            {
              name: '3rerewrwwr2',
              creator: '3rerewrwr2re',
              time: '3242rewr43242'
            }
          ]
        }
      ],
      cardTypeList: [
        {
          title: '运行中的工作流',
          desc: '显示系统中运行中的工作流列表'
        },
        {
          title: '服务热力图',
          desc: '热力图方式显示服务被更新次数'
        },
        {
          title: '我的工作流',
          desc: '显示个人关注的工作流列表'
        },
        {
          title: '我的环境',
          desc: '显示个人关注的环境及服务信息'
        }
      ],
      isShowCardDialog: false
    }
  },
  components: {
    draggable
  },
  // created () {},
  methods: {
    onStart (val) {
      this.drag = true
    },
    onEnd () {
      this.drag = false
    },
    operateCard (item) {
      const obj = {
        title: item.title,
        list: []
      }
      this.info.push(obj)
      this.isShowCardDialog = false
    },
    handleCommand (val, item) {
      if (val === 'delete') {
        this.$confirm(`确定删除 [${item.title}] 卡片吗`, '确认', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          deleteBuildConfigAPI(obj.name, obj.version, projectName).then(() => {
            this.$message.success('删除成功')
            this.getBuildConfig()
          })
        })
      } else {
        this.$set(item, 'show', false)
      }
    }
  }
}
</script>
<style lang="less" scoped>
.dashboard {
  // width: 100%;
  height: 100%;
  padding: 20px;
  // overflow-x: hidden;
  overflow-y: auto;

  .header {
    display: flex;
    justify-content: flex-end;
    margin: 8px 0;

    &-search {
      width: 220px;
    }

    &-btn {
      margin-left: 16px;
    }
  }

  .main {
    width: 100%;

    .wrap {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;

      .item {
        box-sizing: border-box;
        width: 49%;
        margin: 8px 0;
      }
    }
  }

  .card-dialog {
    .card {
      margin: 8px;

      .type {
        &-title {
          display: inline-block;
          width: 10em;
          color: @primaryColor;
          font-size: 18px;
        }

        &-desc {
          color: @fontLightGray;
          font-size: 14px;
        }
      }
    }
  }
}
</style>
