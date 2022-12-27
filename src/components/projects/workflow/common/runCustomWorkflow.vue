<template>
  <div class="custom-workflow">
    <div class="error" v-if="isShowCheckErrorTip">
      审批发起人手机号码未找到，请正确配置您的手机号码
      <el-button type="text" plain size="mini" @click="updateEmail">点击修改</el-button>
    </div>
    <el-form label-position="left" label-width="140px" size="small">
      <el-collapse v-model="activeName">
        <el-collapse-item :title="$t(`workflow.workflowVars`)" name="env" class="mg-l8" v-if="payload.params && payload.params.length>0&&isShowParams">
          <el-table :data="payload.params.filter(item=>item.isShow)">
            <el-table-column :label="$t(`global.key`)">
              <template slot-scope="scope">{{scope.row.name}}</template>
            </el-table-column>
            <el-table-column :label="$t(`global.value`)">
              <template slot-scope="scope">
                <el-select v-model="scope.row.value" v-if="scope.row.type === 'choice'" size="small" style="width: 220px;">
                  <el-option v-for="(item,index) in scope.row.choice_option" :key="index" :value="item" :label="item">{{item}}</el-option>
                </el-select>
                <el-input
                  v-if="scope.row.type === 'text'"
                  v-model="scope.row.value"
                  size="small"
                  type="textarea"
                  :rows="2"
                  style="width: 220px;"
                ></el-input>
                <el-input
                  v-if="scope.row.type === 'string'"
                  class="password"
                  v-model="scope.row.value"
                  size="small"
                  type="text"
                  style="width: 220px;"
                ></el-input>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
        <div v-for="(stage,stageIndex) in payload.stages" :key="stage.name">
          <el-collapse-item
            v-for="(job,jobIndex) in stage.jobs"
            :title="`${job.name}`"
            :key="job.name"
            :name="`${stageIndex}${jobIndex}`"
            class="mg-l8"
          >
            <template slot="title">
              <el-checkbox v-model="job.checked"></el-checkbox>
              <span class="mg-l8">{{job.name}}</span>
            </template>
            <div v-if="job.type === 'zadig-build'">
              <el-form-item :label="$t(`global.serviceModule`)">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="value"
                  size="medium"
                  style="width: 220px;"
                  @change="handleServiceBuildChange($event,job)"
                >
                  <el-option
                    v-for="(service,index) of job.spec.service_and_builds"
                    :key="index"
                    :label="`${service.service_module}(${service.service_name})`"
                    :value="service"
                  >
                    <span>{{service.service_module}}</span>
                    <span style="color: #ccc;">({{service.service_name}})</span>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item :label="$t(`status.imageRepo`)" prop="docker_registry_id">
                <el-select v-model="job.spec.docker_registry_id" filterable placeholder="请选择镜像" size="small" style="width: 220px;">
                  <el-option v-for="item in dockerList" :key="item.id" :label="`${item.reg_addr}/${item.namespace}`" :value="item.id"></el-option>
                </el-select>
              </el-form-item>
              <div v-if="job.pickedTargets">
                <CustomWorkflowBuildRows :pickedTargets="job.pickedTargets" />
              </div>
            </div>
            <div v-if="job.type === 'zadig-deploy'">
              <el-form-item prop="productName" :label="$t(`project.environments`)" v-if="!(job.spec.env.includes('<+fixed>')||job.spec.env.includes('{{'))">
                <el-select v-model="job.spec.env" size="medium" @change="getRegistryId(job.spec.env)" style="width: 220px;">
                  <el-option
                    v-for="pro of currentProjectEnvs"
                    :key="`${pro.projectName} / ${pro.name}`"
                    :label="`${pro.projectName} / ${pro.name}`"
                    :value="`${pro.name}`"
                  >
                    <span>{{`${pro.projectName} / ${pro.name}`}}</span>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item :label="$t(`global.serviceModule`)" v-if="job.spec.source === 'runtime'">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="value"
                  size="medium"
                  style="width: 220px;"
                  @change="handleServiceDeployChange"
                >
                  <el-option
                    v-for="(service,index) of job.spec.service_and_images"
                    :key="index"
                    :label="`${service.service_module}(${service.service_name})`"
                    :value="service"
                  >
                    <span>{{service.service_module}}</span>
                    <span style="color: #ccc;">({{service.service_name}})</span>
                  </el-option>
                </el-select>
              </el-form-item>
              <div v-for="(item,index) in job.pickedTargets" :key="index">
                <el-form-item :label="`${item.service_module}`">
                  <el-select
                    v-model="item.image"
                    filterable
                    clearable
                    reserve-keyword
                    value-key="service_name"
                    size="medium"
                    style="width: 220px;"
                    placeholder="请选择镜像"
                  >
                    <el-option
                      v-for="(image,index) of item.images"
                      :key="index"
                      :value="image.host+'/'+image.owner+'/'+image.name+':'+image.tag"
                      :label="image.tag"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </div>
            </div>
            <div v-if="job.type === 'custom-deploy'">
              <el-form-item :label="$t(`workflow.selectContainer`)" v-if="job.spec.source === 'runtime'">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="target"
                  size="medium"
                  style="width: 220px;"
                  @change="handleContainerChange($event,job)"
                >
                  <el-option v-for="(item,index) of job.spec.targets" :key="index" :label="item.target" :value="item"></el-option>
                </el-select>
              </el-form-item>
              <div v-for="(item,index) in job.pickedTargets" :key="index">
                <el-form-item :label="item.service">
                  <el-select
                    v-model="item.image"
                    filterable
                    clearable
                    @change="handleCurImageChange"
                    reserve-keyword
                    size="medium"
                    style="width: 220px;"
                    placeholder="请选择镜像"
                  >
                    <el-option
                      v-for="(image,index) of item.images"
                      :key="index"
                      :value="image.host+'/'+image.owner+'/'+image.name+':'+image.tag"
                      :label="image.tag"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </div>
            </div>
            <div v-if="job.type === 'k8s-gray-rollback'">
              <el-form-item label="选择 Deployment">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  value-key="workload_name"
                  reserve-keyword
                  size="small"
                  style="width: 220px;"
                  @change="handleContainerChange($event,job)"
                >
                  <el-option v-for="(item,index) of job.spec.targets" :key="index" :label="item.workload_name" :value="item"></el-option>
                </el-select>
              </el-form-item>
              <el-table :data="job.pickedTargets">
                <el-table-column label="Deployment  名称" prop="workload_name"></el-table-column>
                <el-table-column label="镜像名称" prop="origin_image"></el-table-column>
                <el-table-column label="副本数量" prop="origin_replica"></el-table-column>
              </el-table>
            </div>
            <div v-if="job.type === 'k8s-resource-patch'">
              <el-form-item :label="$t(`workflow.resourceName`)">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="resource_name"
                  size="medium"
                  style="width: 220px;"
                  @change="handleResourceChange($event,job)"
                >
                  <el-option
                    v-for="(item,index) of job.spec.patch_items"
                    :key="index"
                    :label="`${item.resource_kind}/${item.resource_name}`"
                    :value="item"
                  ></el-option>
                </el-select>
              </el-form-item>
              <el-form-item :label="$t(`workflow.updateContent`)">
                <div v-for="(item,index) in job.pickedTargets" :key="index">
                  <span>{{item.resource_name}}</span>
                  <el-table :data="item.params">
                    <el-table-column :label="$t(`global.key`)" prop="name"></el-table-column>
                    <el-table-column :label="$t(`global.value`)">
                      <template slot-scope="scope">
                        <el-select v-model="scope.row.value" v-if="scope.row.type === 'choice'" size="small" style="width: 220px;">
                          <el-option v-for="(item,index) in scope.row.choice_option" :key="index" :value="item" :label="item">{{item}}</el-option>
                        </el-select>
                        <el-input
                          v-if="scope.row.type === 'text'"
                          v-model="scope.row.value"
                          size="small"
                          type="textarea"
                          :rows="2"
                          style="width: 220px;"
                        ></el-input>
                        <el-input
                          v-if="scope.row.type === 'string'"
                          class="password"
                          v-model="scope.row.value"
                          size="small"
                          :type="scope.row.is_credential ? 'passsword' : ''"
                          :show-password="scope.row.is_credential ? true : false"
                          style="width: 220px;"
                        ></el-input>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-form-item>
            </div>
            <div v-if="job.type === 'k8s-gray-release'">
              <el-form-item :label="$t(`workflow.grayPercentage`)">{{job.spec.gray_scale}}</el-form-item>
              <el-form-item :label="$t(`workflow.selectContainer`)" v-if="!job.spec.from_job">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="value"
                  size="medium"
                  style="width: 220px;"
                  @change="handleResourceChange($event,job)"
                >
                  <el-option
                    v-for="(item,index) of job.spec.targets"
                    :key="index"
                    :label="`${item.container_name}/${item.workload_name}`"
                    :value="item"
                  ></el-option>
                </el-select>
              </el-form-item>
              <div v-for="(item,index) in job.pickedTargets" :key="index">
                <el-form-item :label="`${item.container_name}/${item.workload_name}`">
                  <el-select
                    v-model="item.image"
                    filterable
                    clearable
                    @change="handleCurImageChange"
                    reserve-keyword
                    size="medium"
                    style="width: 220px;"
                    placeholder="请选择镜像"
                  >
                    <el-option
                      v-for="(image,index) of item.images"
                      :key="index"
                      :value="image.host+'/'+image.owner+'/'+image.name+':'+image.tag"
                      :label="image.tag"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </div>
            </div>
            <div v-if="job.type === 'k8s-canary-deploy'">
              <el-form-item label="K8s service 名称">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  size="medium"
                  value-key="container_name"
                  @change="handleK8sServiceChange($event,job)"
                  style="width: 220px;"
                >
                  <el-option v-for="(service,index) of job.spec.targets" :key="index" :label="`${service.container_name}`" :value="service"></el-option>
                </el-select>
              </el-form-item>
              <div v-for="(item,index) in job.pickedTargets" :key="index">
                <el-form-item :label="`${item.container_name}`">
                  <el-select
                    v-model="item.image"
                    filterable
                    clearable
                    reserve-keyword
                    size="medium"
                    @change="handleCurImageChange"
                    style="width: 220px;"
                    placeholder="请选择镜像"
                  >
                    <el-option
                      v-for="(image,index) of item.images"
                      :key="index"
                      :value="image.host+'/'+image.owner+'/'+image.name+':'+image.tag"
                      :label="image.tag"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </div>
            </div>
            <div class="font-gray" v-if="job.type === 'k8s-canary-release'">{{$t(`workflow.noNeedToEnterVariables`)}}</div>
            <div v-if="job.type === 'k8s-blue-green-deploy'">
              <el-form-item label="K8s service 名称">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="container_name"
                  size="medium"
                  @change="handleK8sServiceChange($event,job)"
                  style="width: 220px;"
                >
                  <el-option v-for="(service,index) of job.spec.targets" :key="index" :label="`${service.container_name}`" :value="service"></el-option>
                </el-select>
              </el-form-item>
              <div v-for="(item,index) in job.pickedTargets" :key="index">
                <el-form-item :label="`${item.container_name}`">
                  <el-select
                    v-model="item.image"
                    filterable
                    clearable
                    reserve-keyword
                    size="medium"
                    @change="handleCurImageChange"
                    style="width: 220px;"
                    placeholder="请选择镜像"
                  >
                    <el-option
                      v-for="(image,index) of item.images"
                      :key="index"
                      :value="image.host+'/'+image.owner+'/'+image.name+':'+image.tag"
                      :label="image.tag"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </div>
            </div>
            <div class="font-gray" v-if="job.type === 'k8s-blue-green-release'">{{$t(`workflow.noNeedToEnterVariables`)}}</div>
            <div v-if="job.type === 'freestyle'">
              <CustomWorkflowCommonRows :job="job" />
            </div>
            <div v-if="job.type === 'plugin'">
              <CustomWorkflowCommonRows :job="job" type="plugin" />
            </div>
            <div v-if="job.type === 'zadig-test'">
              <div v-if="job.pickedTargets">
                <CustomWorkflowBuildRows :pickedTargets="job.pickedTargets" type="zadig-test" />
              </div>
            </div>
            <div v-if="job.type === 'zadig-scanning'">
              <div v-if="job.pickedTargets">
                <CustomWorkflowBuildRows :pickedTargets="job.pickedTargets" type="zadig-scanning" />
              </div>
            </div>
            <div v-if="job.type==='zadig-distribute-image'">
              <div v-if="job.spec.source === 'runtime'">
                <el-form-item :label="$t(`global.serviceModule`)">
                  <el-select
                    v-model="job.pickedTargets"
                    filterable
                    multiple
                    clearable
                    reserve-keyword
                    value-key="value"
                    size="medium"
                    style="width: 220px;"
                    @change="handleServiceDeployChange(job.pickedTargets)"
                  >
                    <el-option
                      v-for="(service,index) of job.spec.targets"
                      :key="index"
                      :label="`${service.service_module}(${service.service_name})`"
                      :value="service"
                    >
                      <span>{{service.service_module}}</span>
                      <span style="color: #ccc;">({{service.service_name}})</span>
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-table :data="job.pickedTargets">
                  <el-table-column :label="$t(`project.services`)" min-width="15%">
                    <template slot-scope="scope">{{`${scope.row.service_module}(${scope.row.service_name})`}}</template>
                  </el-table-column>
                  <el-table-column label="原始镜像版本" min-width="25%">
                    <template slot-scope="scope">
                      <el-select
                        v-model="scope.row.source_tag"
                        filterable
                        clearable
                        reserve-keyword
                        @change="handleSourceTagChange(scope.row)"
                        value-key="service_name"
                        size="small"
                        placeholder="请选择原始镜像版本"
                      >
                        <el-option v-for="(image,index) of scope.row.images" :key="index" :value="image.tag" :label="image.tag"></el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="目标镜像版本" min-width="30%">
                    <template slot-scope="{row,$index}">
                      <div class="flex">
                        <el-input v-model="row.target_tag" placeholder="请输入目标镜像版本" size="small" class="input"></el-input>
                        <el-button v-if="$index===0" size="small" type="text" @click="applyAllImage(job.pickedTargets,row.target_tag)">应用全部</el-button>
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-else>
                <el-table :data="fromJobInfo.pickedTargets">
                  <el-table-column :label="$t(`project.services`)" min-width="20%">
                    <template slot-scope="scope">{{`${scope.row.service_module}(${scope.row.service_name})`}}</template>
                  </el-table-column>
                  <el-table-column label="原始镜像版本" min-width="20%">
                    <span style="color: #909399; font-size: 12px; line-height: 33px;">来自前置构建任务</span>
                  </el-table-column>
                  <el-table-column label="修改版本" min-width="12%">
                    <template slot-scope="scope">
                      <el-switch v-model="scope.row.update_tag"></el-switch>
                    </template>
                  </el-table-column>
                  <el-table-column label="目标镜像版本" min-width="48%">
                    <template slot-scope="scope">
                      <div v-if="scope.row.update_tag" class="flex">
                        <el-input v-model="scope.row.target_tag" placeholder="请输入目标镜像版本" size="small" class="input"></el-input>
                        <el-button size="small" type="text" @click="applyAllImage(fromJobInfo.pickedTargets,scope.row.target_tag)">应用全部</el-button>
                      </div>
                      <span v-else>
                        <span style="color: #909399; font-size: 12px; line-height: 33px;">来自前置构建任务</span>
                      </span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
            <div v-if="job.type === 'istio-release'">
              <div style="margin-bottom: 10px; color: #606266;">
                <span>新版本副本数百分比:{{job.spec.replica_percentage}}%</span>
                <span style="margin-left: 10px;">新版本流量百分比:{{job.spec.weight}}%</span>
              </div>
              <el-form-item :label="$t(`workflow.selectContainer`)" v-if="!job.spec.from_job">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="value"
                  size="medium"
                  style="width: 220px;"
                  @change="handleResourceChange($event,job)"
                >
                  <el-option
                    v-for="(item,index) of job.spec.targets"
                    :key="index"
                    :label="`${item.container_name}/${item.workload_name}`"
                    :value="item"
                  ></el-option>
                </el-select>
              </el-form-item>
              <div v-for="(item,index) in job.pickedTargets" :key="index">
                <el-form-item :label="`${item.container_name}/${item.workload_name}`">
                  <el-select
                    v-model="item.image"
                    filterable
                    clearable
                    @change="handleCurImageChange"
                    reserve-keyword
                    size="medium"
                    style="width: 220px;"
                    placeholder="请选择镜像"
                  >
                    <el-option
                      v-for="(image,index) of item.images"
                      :key="index"
                      :value="image.host+'/'+image.owner+'/'+image.name+':'+image.tag"
                      :label="image.tag"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </div>
            </div>
            <div v-if="job.type === 'istio-rollback'">
              <el-form-item :label="$t(`workflow.selectContainer`)">
                <el-select
                  v-model="job.pickedTargets"
                  filterable
                  multiple
                  clearable
                  reserve-keyword
                  value-key="value"
                  size="medium"
                  style="width: 220px;"
                  @change="handleResourceChange($event,job)"
                >
                  <el-option
                    v-for="(item,index) of job.spec.targets"
                    :key="index"
                    :label="`${item.workload_name}/${item.container_name}`"
                    :value="item"
                  ></el-option>
                </el-select>
              </el-form-item>
              <template v-if="job.pickedTargets.length > 0">
                <span style="color: #606266;">回滚版本信息</span>
                <el-table :data="job.pickedTargets">
                  <el-table-column :label="$t(`workflow.containerName`)" prop="value">
                    <template slot-scope="scope">
                      <span>{{`${scope.row.workload_name}/${scope.row.container_name}`}}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="镜像名称" prop="image"></el-table-column>
                  <el-table-column label="副本数量" prop="target_replica"></el-table-column>
                </el-table>
              </template>
            </div>
          </el-collapse-item>
        </div>
      </el-collapse>
      <el-button @click="runTask" :loading="startTaskLoading" type="primary" size="small" class="mg-t16">{{ startTaskLoading?$t(`workflow.starting`):$t(`workflow.run`) }}</el-button>
    </el-form>
    <el-dialog
      :title="$t(`profile.changePhone`)"
      :close-on-click-modal="false"
      :append-to-body="true"
      custom-class="edit-form-dialog"
      :visible.sync="dialogMailEditFormVisible"
    >
      <el-form :model="userInfo" @submit.native.prevent ref="mailForm">
        <el-form-item
          :label="$t(`profile.newPhone`)"
          label-width="100px"
          prop="phone"
          size="small"
          :rules="{
            required: true,
            validator: validatePhone,
            trigger: ['blur', 'change']
          }"
        >
          <el-input v-model="userInfo.phone"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" native-type="submit" size="small" @click="updateUser" class="start-create">{{$t(`global.confirm`)}}</el-button>
        <el-button plain native-type="submit" size="small" @click="dialogMailEditFormVisible=false">{{$t(`global.cancel`)}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import CustomWorkflowBuildRows from '@/components/common/customWorkflowBuildRows.vue'
import CustomWorkflowCommonRows from '@/components/common/customWorkflowCommonRows.vue'
import { mapState } from 'vuex'
import store from 'storejs'
import {
  listProductAPI,
  getAllBranchInfoAPI,
  runCustomWorkflowTaskAPI,
  imagesAPI,
  getCustomWorkfloweTaskPresetAPI,
  getRegistryWhenBuildAPI,
  getAssociatedBuildsAPI,
  updateCurrentUserMailAPI,
  checkWorkflowApprovalAPI
} from '@api'
import { keyBy, orderBy, cloneDeep } from 'lodash'

const validatePhone = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请填写手机号'))
  } else {
    if (
      !/^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/.test(
        value
      )
    ) {
      callback(new Error('请输入正确的手机号码'))
    } else {
      callback()
    }
  }
}

export default {
  data () {
    return {
      validatePhone,
      registry_id: '',
      currentProjectEnvs: [],
      dockerList: [],
      startTaskLoading: false,
      activeName: ['env', '00'],
      notReady: false,
      payload: {
        workflow_name: '',
        stages: [
          {
            name: '',
            jobs: []
          }
        ]
      },
      originServiceAndBuilds: [],
      isShowParams: true,
      fromJobInfo: {},
      dialogMailEditFormVisible: false,
      isShowCheckErrorTip: false,
      userInfo: {
        phone: ''
      }
    }
  },
  props: {
    workflowName: {
      type: String,
      default: ''
    },
    displayName: {
      type: String,
      default: ''
    },
    projectName: {
      type: String,
      default: ''
    },
    cloneWorkflow: {
      type: Object,
      default: () => ({})
    }
  },
  components: {
    CustomWorkflowBuildRows,
    CustomWorkflowCommonRows
  },
  computed: {
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    })
  },
  created () {
    this.init()
  },
  methods: {
    init () {
      if (this.hasPlutus) {
        this.checkWorkflowApproval()
      }
      this.getEnvList()
      this.getRegistryWhenBuild()
      this.getServiceAndBuildList()
      if (Object.keys(this.cloneWorkflow).length > 0) {
        this.cloneWorkflow.stages.forEach(stage => {
          stage.jobs.forEach(job => {
            this.$set(job, 'checked', true)
            if (
              job.spec.service_and_builds &&
              job.spec.service_and_builds.length > 0
            ) {
              job.pickedTargets = job.spec.service_and_builds
              job.pickedTargets.forEach(build => {
                this.getRepoInfo(build.repos)
              })
            }
            if (job.type === 'zadig-distribute-image') {
              if (job.spec.source === 'runtime') {
                job.pickedTargets = job.spec.targets
              } else {
                this.fromJobInfo.pickedTargets = cloneDeep(job.spec.targets)
              }
            }
          })
        })
        this.payload = this.cloneWorkflow
        this.handleEnv()
      } else {
        this.getWorkflowPresetInfo(this.workflowName)
      }
    },
    handleEnv () {
      this.payload.params.forEach(item => {
        if (item.value.includes('<+fixed>') || item.value.includes('{{')) {
          item.isShow = false
        } else {
          item.isShow = true
        }
        const len = this.payload.params.filter(item => item.isShow)
        this.isShowParams = len.length !== 0
      })
      this.payload.stages.forEach((stage, stageIndex) => {
        stage.jobs.forEach((job, jobIndex) => {
          this.activeName.push(`${stageIndex}${jobIndex}`)
          if (job.type === 'custom-deploy') {
            job.spec.targets.forEach(item => {
              item.service = item.target.split('/')[2]
            })
            job.pickedTargets = cloneDeep(job.spec.targets)
            this.handleContainerChange(job.pickedTargets, job)
          }
          if (job.spec && job.spec.service_and_builds) {
            job.spec.service_and_builds.forEach(service => {
              this.getRepoInfo(service.repos)
              service.key_vals.forEach(item => {
                if (
                  item.value.includes('<+fixed>') ||
                  item.value.includes('{{')
                ) {
                  item.isShow = false
                } else {
                  item.isShow = true
                }
              })
              service.value = `${service.service_name}/${service.service_module}`
              service.key_vals.forEach(key => {
                // if (key.is_credential) {
                //   key.value = this.$utils.aesDecrypt(key.value)
                // }
              })
            })
            // 如果只有一个组件 默认选上
            if (job.spec.service_and_builds.length === 1) {
              job.pickedTargets = job.spec.service_and_builds
            }
          }
          if (job.type === 'zadig-deploy' && job.spec.source === 'runtime') {
            job.pickedTargets = job.spec.service_and_images
            this.getRegistryId(job.spec.env)
            this.handleServiceDeployChange(job.pickedTargets)
            setTimeout(() => {
              job.spec.service_and_images = this.originServiceAndBuilds
            }, 1000)
          }
          if (job.type === 'freestyle') {
            job.spec.steps.forEach(step => {
              if (step.type === 'git') {
                this.getRepoInfo(step.spec.repos)
              }
            })
            job.spec.properties.envs.forEach(item => {
              if (
                item.value.includes('<+fixed>') ||
                item.value.includes('{{')
              ) {
                item.isShow = false
              } else {
                item.isShow = true
              }
            })
            // 判断是否展示(固定值和全局变量不展示)一个都没有的话则不展示表头
            const len = job.spec.properties.envs.filter(item => item.isShow)
            job.isShowCommon = len.length !== 0
          }
          if (job.type === 'plugin') {
            job.spec.plugin.inputs.forEach(item => {
              if (
                item.value.includes('<+fixed>') ||
                item.value.includes('{{')
              ) {
                item.isShow = false
              } else {
                item.isShow = true
              }
            })
            const len = job.spec.plugin.inputs.filter(item => item.isShow)
            job.isShowPlugin = len.length !== 0
          }
          if (job.type === 'k8s-canary-deploy') {
            job.pickedTargets = cloneDeep(job.spec.targets)
            this.handleK8sServiceChange(job.pickedTargets, job)
          }
          if (job.type === 'k8s-gray-rollback') {
            job.pickedTargets = cloneDeep(job.spec.targets)
          }
          if (job.type === 'k8s-blue-green-deploy') {
            job.pickedTargets = cloneDeep(job.spec.targets)
            this.handleK8sServiceChange(job.pickedTargets, job)
          }
          if (job.type === 'k8s-gray-release') {
            job.spec.targets.forEach(item => {
              item.value = `${item.workload_type}/${item.workload_name}`
            })
            job.pickedTargets = cloneDeep(job.spec.targets)
            this.handleContainerChange(job.pickedTargets, job)
          }
          if (job.type === 'zadig-test') {
            job.pickedTargets = job.spec.test_modules
            job.spec.test_modules.forEach(service => {
              this.getRepoInfo(service.repos)
              service.key_vals.forEach(item => {
                if (
                  item.value.includes('<+fixed>') ||
                  item.value.includes('{{')
                ) {
                  item.isShow = false
                } else {
                  item.isShow = true
                }
              })
            })
          }
          if (job.type === 'zadig-scanning') {
            job.pickedTargets = job.spec.scannings
            job.spec.scannings.forEach(service => {
              this.getRepoInfo(service.repos)
            })
          }
          if (job.type === 'zadig-distribute-image') {
            if (job.spec.source === 'runtime') {
              job.spec.targets.forEach(service => {
                service.value = `${service.service_name}/${service.service_module}`
              })
              this.registry_id = job.spec.source_registry_id
            }
          }
          if (job.type === 'istio-release') {
            job.spec.targets.forEach(item => {
              item.value = `${item.workload_name}/${item.container_name}`
              item.service = item.container_name
            })
            job.pickedTargets = cloneDeep(job.spec.targets)
            this.handleContainerChange(job.pickedTargets, job)
          }
          if (job.type === 'istio-rollback') {
            job.spec.targets.forEach(item => {
              item.value = `${item.workload_name}/${item.container_name}`
              item.service = item.container_name
            })
            job.pickedTargets = cloneDeep(job.spec.targets)
            this.handleContainerChange(job.pickedTargets, job)
          }
        })
      })
    },
    checkWorkflowApproval () {
      checkWorkflowApprovalAPI(this.workflowName)
        .then(res => {
          this.isShowCheckErrorTip = false
          this.notReady = false
        })
        .catch(error => {
          if (error.response && error.response.data.code === 6940) {
            this.isShowCheckErrorTip = true
          }
          this.notReady = true
        })
    },
    updateUser () {
      const userInfo = store.get('userInfo')
      this.$refs.mailForm.validate().then(valid => {
        if (valid) {
          const params = {
            name: userInfo.name,
            phone: this.userInfo.phone
          }
          updateCurrentUserMailAPI(userInfo.uid, params).then(res => {
            this.checkWorkflowApproval(this.workflowName)
            this.dialogMailEditFormVisible = false
            this.userInfo.phone = ''
          })
        }
      })
    },
    updateEmail () {
      this.isShowCheckErrorTip = false
      this.dialogMailEditFormVisible = true
    },
    getWorkflowPresetInfo (workflowName) {
      // const key = this.$utils.rsaEncrypt()
      getCustomWorkfloweTaskPresetAPI(workflowName, this.projectName).then(
        res => {
          res.stages.forEach(stage => {
            stage.jobs.forEach(job => {
              this.$set(job, 'checked', true)
              if (job.type === 'zadig-deploy') {
                // Mapping for value-key
                if (
                  job.spec &&
                  job.spec.service_and_images &&
                  job.spec.service_and_images.length > 0
                ) {
                  job.spec.service_and_images.forEach(service => {
                    service.value = `${service.service_name}/${service.service_module}`
                  })
                }
              }
            })
          })
          this.payload = res
          this.handleEnv()
        }
      )
    },
    getEnvList () {
      const projectName = this.projectName
      listProductAPI(projectName).then(res => {
        // Sort by environment type first, then by name
        this.currentProjectEnvs = orderBy(
          res,
          ['production', 'name'],
          ['asc', 'asc']
        )
      })
    },
    getRegistryWhenBuild () {
      const projectName = this.projectName
      getRegistryWhenBuildAPI(projectName).then(res => {
        this.dockerList = res
      })
    },
    async getRepoInfo (originRepos) {
      const reposQuery = originRepos.map(re => {
        return {
          source: re.source,
          repo_owner: re.repo_owner,
          repo: re.repo_name,
          default_branch: re.branch,
          codehost_id: re.codehost_id,
          repo_namespace: re.repo_namespace,
          filter_regexp: re.filter_regexp
        }
      })
      const payload = { infos: reposQuery }
      // b = branch, p = pr, t = tag
      const res = await getAllBranchInfoAPI(payload)
      // make these repo info more friendly
      res.forEach(repo => {
        if (repo.prs) {
          repo.prs.forEach(element => {
            element.pr = element.id
          })
          repo.branchPRsMap = this.$utils.arrayToMapOfArrays(
            repo.prs,
            'targetBranch'
          )
        } else {
          repo.branchPRsMap = {}
        }
        if (repo.branches) {
          repo.branchNames = repo.branches.map(b => b.name)
        } else {
          repo.branchNames = []
        }
      })

      const repoInfoMap = keyBy(res, repo => {
        return `${repo.repo_owner}/${repo.repo}`
      })
      for (const repo of originRepos) {
        this.$set(repo, '_id_', `${repo.repo_owner}/${repo.repo_name}`)
        const repoInfo = repoInfoMap[repo._id_]
        this.$set(repo, 'branchNames', repoInfo && repoInfo.branchNames)
        this.$set(repo, 'branchPRsMap', repoInfo && repoInfo.branchPRsMap)
        this.$set(repo, 'tags', repoInfo && repoInfo.tags ? repoInfo.tags : [])
        this.$set(repo, 'prNumberPropName', 'pr')
        if (repoInfo) {
          this.$set(repo, 'errorMsg', repoInfo.error_msg || '')
        }
        this.$set(repo, 'branch', repo.branch || '')
        this.$set(
          repo,
          repo.prNumberPropName,
          repo[repo.prNumberPropName] || null
        )
        this.$set(repo, 'tag', repo.tag || '')
        let branchOrTag = null
        if (repo.branch) {
          branchOrTag = {
            type: 'branch',
            id: `branch-${repo.branch}`,
            name: repo.branch
          }
        } else if (repo.tag) {
          branchOrTag = {
            type: 'tag',
            id: `tag-${repo.tag}`,
            name: repo.tag
          }
        }
        this.$set(repo, 'branchOrTag', branchOrTag)
        this.$set(repo, 'branchAndTagList', [
          {
            label: 'Branches',
            options: (repo.branchNames || []).map(name => {
              return {
                type: 'branch',
                id: `branch-${name}`,
                name
              }
            })
          },
          {
            label: 'Tags',
            options: (repo.tags || []).map(tag => {
              return {
                type: 'tag',
                id: `tag-${tag.name}`,
                name: tag.name
              }
            })
          }
        ])
      }
    },
    runTask () {
      // 数据处理
      const payload = cloneDeep(this.payload)
      payload.stages.forEach(stage => {
        stage.jobs = stage.jobs.filter(job => job.checked)
        stage.jobs.forEach(job => {
          if (job.type === 'zadig-build') {
            if (
              job.spec.service_and_builds &&
              job.spec.service_and_builds.length > 0
            ) {
              job.spec.service_and_builds = job.pickedTargets
              job.spec.service_and_builds.forEach(item => {
                if (item.repos) {
                  item.repos.forEach(repo => {
                    if (typeof repo.prs === 'string') {
                      repo.prs = repo.prs.split(',').map(Number)
                    }
                    if (repo.branchOrTag) {
                      if (repo.branchOrTag.type === 'branch') {
                        repo.branch = repo.branchOrTag.name
                      }
                      if (repo.branchOrTag.type === 'tag') {
                        repo.tag = repo.branchOrTag.name
                      }
                    }
                  })
                }
              })
              delete job.pickedTargets
            }
          }
          if (job.type === 'freestyle') {
            job.spec.steps.forEach(step => {
              if (step.type === 'git') {
                step.spec.repos.forEach(repo => {
                  if (typeof repo.prs === 'string') {
                    repo.prs = repo.prs.split(',').map(Number)
                  }
                  if (repo.branchOrTag) {
                    if (repo.branchOrTag.type === 'branch') {
                      repo.branch = repo.branchOrTag.name
                    }
                    if (repo.branchOrTag.type === 'tag') {
                      repo.tag = repo.branchOrTag.name
                    }
                  }
                })
              }
            })
          }
          if (job.type === 'zadig-deploy') {
            job.spec.service_and_images = cloneDeep(job.pickedTargets)
            if (
              job.spec.service_and_images &&
              job.spec.service_and_images.length > 0
            ) {
              job.spec.service_and_images.forEach(item => {
                delete item.images
              })
              delete job.pickedTargets
            }
          }
          if (job.type === 'custom-deploy' && job.spec.source === 'runtime') {
            job.spec.targets = cloneDeep(job.pickedTargets)
            delete job.pickedTargets
          }
          if (job.type === 'zadig-test') {
            job.spec.test_modules = cloneDeep(job.pickedTargets)
            if (job.spec.test_modules && job.spec.test_modules.length > 0) {
              job.spec.test_modules.forEach(item => {
                if (item.repos) {
                  item.repos.forEach(repo => {
                    if (typeof repo.prs === 'string') {
                      repo.prs = repo.prs.split(',').map(Number)
                    }
                    if (repo.branchOrTag) {
                      if (repo.branchOrTag.type === 'branch') {
                        repo.branch = repo.branchOrTag.name
                      }
                      if (repo.branchOrTag.type === 'tag') {
                        repo.tag = repo.branchOrTag.name
                      }
                    }
                  })
                }
              })
            }
            delete job.pickedTargets
          }
          if (job.type === 'zadig-scanning') {
            job.spec.scannings = cloneDeep(job.pickedTargets)
            if (job.spec.scannings && job.spec.scannings.length > 0) {
              job.spec.scannings.forEach(item => {
                if (item.repos) {
                  item.repos.forEach(repo => {
                    if (typeof repo.prs === 'string') {
                      repo.prs = repo.prs.split(',').map(Number)
                    }
                    if (repo.branchOrTag) {
                      if (repo.branchOrTag.type === 'branch') {
                        repo.branch = repo.branchOrTag.name
                      }
                      if (repo.branchOrTag.type === 'tag') {
                        repo.tag = repo.branchOrTag.name
                      }
                    }
                  })
                }
              })
            }
            delete job.pickedTargets
          }
          if (job.type === 'zadig-distribute-image') {
            if (job.spec.source === 'runtime') {
              job.spec.targets = cloneDeep(job.pickedTargets)
              job.spec.targets.forEach(item => {
                delete item.images
              })
              delete job.pickedTargets
            } else {
              // fromjob
              if (this.fromJobInfo.pickedTargets && this.fromJobInfo.pickedTargets.length > 0) {
                this.fromJobInfo.pickedTargets.forEach(item => {
                  if (item.update_tag && !item.target_tag) {
                    this.$message.error(
                      this.$t(`workflow.inputTargetImage`, {
                        serviceName: item.service_name
                      })
                    )
                    throw Error()
                  }
                })
                job.spec.targets = this.fromJobInfo.pickedTargets
                job.spec.targets = job.spec.targets.map(item => {
                  return {
                    service_name: item.service_name,
                    service_module: item.service_module,
                    source_tag: item.source_tag,
                    target_tag: item.target_tag,
                    update_tag: item.update_tag
                  }
                })
              }
            }
          }
          if (job.type === 'k8s-resource-patch') {
            job.spec.patch_items = cloneDeep(job.pickedTargets)
            delete job.pickedTargets
          }
          if (job.type === 'k8s-gray-rollback') {
            job.spec.targets = cloneDeep(job.pickedTargets)
            delete job.pickedTargets
          }
          if (job.type === 'k8s-blue-green-deploy') {
            job.pickedTargets.forEach(item => {
              delete item.images
            })
            job.spec.targets = job.pickedTargets
            delete job.pickedTargets
          }
          if (job.type === 'k8s-canary-deploy') {
            job.pickedTargets.forEach(item => {
              delete item.images
            })
            job.spec.targets = job.pickedTargets
            delete job.pickedTargets
          }
          if (job.type === 'k8s-gray-release') {
            job.pickedTargets.forEach(item => {
              delete item.images
            })
            job.spec.targets = job.pickedTargets
            delete job.pickedTargets
          }
          if (job.type === 'istio-release') {
            job.pickedTargets.forEach(item => {
              delete item.images
            })
            job.spec.targets = job.pickedTargets
            delete job.pickedTargets
          }
          if (job.type === 'istio-rollback') {
            job.pickedTargets.forEach(item => {
              delete item.images
            })
            job.spec.targets = job.pickedTargets
            delete job.pickedTargets
          }
        })
      })
      this.startTaskLoading = true
      runCustomWorkflowTaskAPI(payload, this.projectName)
        .then(res => {
          const taskId = res.task_id || 1
          this.$message.success('创建成功')
          this.$emit('success')
          this.$router.push(
            `/v1/projects/detail/${this.projectName}/pipelines/custom/${this.payload.name}/${taskId}?status=running&display_name=${this.displayName}`
          )
        })
        .catch(error => {
          this.$message({
            message: error.message,
            type: 'warning',
            dangerouslyUseHTMLString: true,
            duration: 5000
          })
        })
        .finally(() => {
          this.startTaskLoading = false
        })
    },
    getRegistryId (val) {
      if (val) {
        const res = this.currentProjectEnvs.find(item => {
          return item.name === val
        })
        this.registry_id = res ? res.registry_id : ''
      }
    },
    getRegistryList (name, id, item) {
      return imagesAPI(name, id).then(res => {
        return res
      })
    },
    handleServiceDeployChange (val) {
      val.forEach(item => {
        this.getRegistryList([item.service_module], this.registry_id).then(
          res => {
            this.$set(item, 'images', res)
          }
        )
      })
      this.$forceUpdate()
    },
    handleServiceBuildChange (services, job) {
      this.fromJobInfo = cloneDeep(job)
      services.forEach(service => {
        this.getRepoInfo(service.repos)
      })
      this.$forceUpdate()
    },
    handleContainerChange (val, job) {
      val.forEach(item => {
        this.getRegistryList(
          [item.service || item.container_name],
          job.spec.docker_registry_id
        ).then(res => {
          this.$set(item, 'images', res)
          this.$forceUpdate()
        })
      })
      this.$forceUpdate()
    },
    handleK8sServiceChange (val, job) {
      val.forEach(item => {
        this.getRegistryList(
          [item.container_name],
          job.spec.docker_registry_id
        ).then(res => {
          this.$set(item, 'images', res)
          this.$forceUpdate()
        })
      })
      this.$forceUpdate()
    },
    handleImageChange (job) {
      this.handleContainerChange(job.pickedTargets, job)
    },
    handleCurImageChange () {
      this.$forceUpdate()
    },
    handleResourceChange (val, job) {
      job.pickedTargets = val
      this.$forceUpdate()
    },
    handleStrategyChange (val) {
      this.$forceUpdate()
    },
    handleCommand (val, item) {
      this.$set(item, 'patch_strategy', val)
      this.$forceUpdate()
    },
    getServiceAndBuildList () {
      const projectName = this.projectName
      getAssociatedBuildsAPI(projectName, true).then(res => {
        res.forEach(item => {
          item.value = `${item.service_name}/${item.service_module}`
        })
        this.originServiceAndBuilds = res
      })
    },
    applyAllImage (allTags, curTag) {
      allTags.forEach(item => {
        this.$set(item, 'target_tag', curTag)
      })
    },
    handleSourceTagChange (row) {
      if (!row.target_tag) {
        this.$set(row, 'target_tag', row.source_tag)
      }
    }
  }
}
</script>
<style lang="less" scoped>
.custom-workflow {
  /deep/.el-collapse-item__header {
    font-weight: 700;
  }

  .error {
    position: absolute;
    top: -10%;
    left: 50%;
    padding: 4px 8px;
    background: #fde2e2;
    transform: translateX(-50%);
  }

  .font-gray {
    color: @fontLightGray;
  }

  .flex {
    display: flex;
    justify-content: space-between;

    .input {
      width: 220px;
    }
  }
}
</style>
