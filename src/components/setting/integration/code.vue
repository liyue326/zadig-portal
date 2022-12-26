<template>
  <div class="integration-code-container">
    <!--start of edit code dialog-->
    <el-dialog
      :title="$t(`sysSetting.integration.gitProviders.editProviderTitle`)"
      custom-class="edit-form-dialog"
      :close-on-click-modal="false"
      :visible.sync="dialogCodeEditFormVisible"
    >
      <template>
        <el-alert v-if="codeEdit.type === 'gitlab'" type="info" :closable="false">
          <slot>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appAuthCallbackTip`)}}</span>
            <span class="tips code-line">
              {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
              <span
                v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
                v-clipboard:success="copyCommandSuccess"
                v-clipboard:error="copyCommandError"
                class="el-icon-document-copy copy"
              ></span>
            </span>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appPermissionCheckTip`)}}api、read_user、read_repository</span>
            <span class="tips">
              - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                :href="`https://docs.koderover.com/zadig/settings/codehost/gitlab/`"
                :underline="false"
                target="_blank"
              >{{$t(`global.helpDoc`)}}</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-else-if="codeEdit.type === 'github'" type="info" :closable="false">
          <slot>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appAuthCallbackTip`)}}</span>
            <span class="tips code-line">
              {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
              <span
                v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
                v-clipboard:success="copyCommandSuccess"
                v-clipboard:error="copyCommandError"
                class="el-icon-document-copy copy"
              ></span>
            </span>
            <span class="tips">
              - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                :href="`https://docs.koderover.com/zadig/settings/codehost/github/`"
                :underline="false"
                target="_blank"
              >{{$t(`global.helpDoc`)}}</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-if="codeEdit.type === 'gerrit'" type="info" :closable="false">
          <slot>
            <span class="tips">
              - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                href="https://docs.koderover.com/zadig/settings/codehost/gerrit/"
                :underline="false"
                target="_blank"
              >{{$t(`global.helpDoc`)}}</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-else-if="codeEdit.type === 'gitee'" type="info" :closable="false">
          <slot>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appAuthCallbackTip`)}}</span>
            <span class="tips code-line">
              {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
              <span
                v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
                v-clipboard:success="copyCommandSuccess"
                v-clipboard:error="copyCommandError"
                class="el-icon-document-copy copy"
              ></span>
            </span>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appPermissionCheckTip`)}}projects、groups、pull_requests、hook</span>
            <span class="tips">
              - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                :href="`https://docs.koderover.com/zadig/settings/codehost/gitee/`"
                :underline="false"
                target="_blank"
              >{{$t(`global.helpDoc`)}}</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-if="codeEdit.type === 'gitee-enterprise'" type="info" :closable="false">
          <slot>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appAuthCallbackTip`)}}</span>
            <span class="tips code-line">
              {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
              <span
                v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
                v-clipboard:success="copyCommandSuccess"
                v-clipboard:error="copyCommandError"
                class="el-icon-document-copy copy"
              ></span>
            </span>
            <span
              class="tips"
            >- {{$t(`sysSetting.integration.gitProviders.appPermissionCheckTip`)}}projects、groups、pull_requests、hook、enterprises</span>
            <span class="tips">
              - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                :href="`https://docs.koderover.com/zadig/settings/codehost/gitee-enterprise/`"
                :underline="false"
                target="_blank"
              >{{$t(`global.helpDoc`)}}</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-else-if="codeEdit.type === 'other'" type="info" :closable="false">
          <slot>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.otherProviderTipFirst`)}}</span>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.otherProviderTipSecond`)}}</span>
            <span class="tips">
              - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                :href="`https://docs.koderover.com/zadig/settings/codehost/others/`"
                :underline="false"
                target="_blank"
              >{{$t(`global.helpDoc`)}}</el-link>
            </span>
          </slot>
        </el-alert>
      </template>
      <el-form
        :model="codeEdit"
        :rules="codeRules"
        status-icon
        class="mg-t32"
        label-width="140px"
        label-position="left"
        ref="codeUpdateForm"
      >
        <el-form-item :label="$t(`sysSetting.integration.gitProviders.provider`)" prop="type">
          <el-select v-model="codeEdit.type" disabled>
            <el-option label="Gitlab" value="gitlab"></el-option>
            <el-option label="GitHub" value="github"></el-option>
            <el-option label="Gerrit" value="gerrit"></el-option>
            <el-option :label="$t(`sysSetting.integration.gitProviders.giteeCE`)" value="gitee"></el-option>
            <el-option v-if="hasPlutus" :label="$t(`sysSetting.integration.gitProviders.giteeEE`)" value="gitee-enterprise"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t(`sysSetting.integration.gitProviders.providerAlias`)" prop="alias">
          <el-input v-model="codeEdit.alias" :placeholder="$t(`sysSetting.integration.gitProviders.providerAlias`)"></el-input>
        </el-form-item>
        <template v-if="codeEdit.type==='gitlab'||codeEdit.type==='github'">
          <el-form-item v-if="codeEdit.type==='gitlab'" :label="$t(`sysSetting.integration.gitProviders.gitlabUrl`)" prop="address">
            <el-input
              v-model.trim="codeEdit.address"
              :placeholder="$t(`sysSetting.integration.gitProviders.providerAlias`)"
              auto-complete="off"
            ></el-input>
          </el-form-item>
          <el-form-item :label="codeEdit.type==='gitlab'?'Application ID':'Client ID'" prop="application_id">
            <el-input
              v-model="codeEdit.application_id"
              :placeholder="codeEdit.type==='gitlab'?'Application ID':'Client ID'"
              auto-complete="off"
            ></el-input>
          </el-form-item>
          <!-- v-if dialogCodeEditFormVisible是为了每次打开弹窗使小眼睛都关闭 -->
          <el-form-item :label="codeEdit.type==='gitlab'?'Secret':'Client Secret'" prop="client_secret">
            <el-input
              v-model="codeEdit.client_secret"
              show-password
              v-if="dialogCodeEditFormVisible"
              type="password"
              :placeholder="codeEdit.type==='gitlab'?'Secret':'Client Secret'"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </template>
        <template v-else-if="codeEdit.type==='gerrit'">
          <el-form-item :label="$t(`sysSetting.integration.gitProviders.gerritUrl`)" prop="address">
            <el-input
              v-model.trim="codeEdit.address"
              :placeholder="$t(`sysSetting.integration.gitProviders.gerritUrl`)"
              auto-complete="off"
            ></el-input>
          </el-form-item>
          <el-form-item :label="$t(`sysSetting.integration.gitProviders.username`)" prop="username">
            <el-input v-model="codeEdit.username" placeholder="Username" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :label="$t(`sysSetting.integration.gitProviders.password`)" prop="password">
            <el-input
              v-model="codeEdit.password"
              placeholder="Password"
              show-password
              v-if="dialogCodeEditFormVisible"
              type="password"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </template>
        <template v-else-if="codeEdit.type==='gitee'">
          <el-form-item label="Client ID" prop="application_id">
            <el-input v-model="codeEdit.application_id" placeholder="Client ID" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="Client Secret" prop="client_secret">
            <el-input
              v-model="codeEdit.client_secret"
              show-password
              v-if="dialogCodeEditFormVisible"
              type="password"
              placeholder="Client Secret"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </template>
        <template v-else-if="codeEdit.type==='gitee-enterprise'">
          <el-form-item :label="$t(`sysSetting.integration.gitProviders.giteeUrl`)" prop="address">
            <el-input v-model.trim="codeEdit.address" :placeholder="$t(`sysSetting.integration.gitProviders.giteeUrl`)" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="Client ID" prop="application_id">
            <el-input v-model="codeEdit.application_id" placeholder="Client ID" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="Client Secret" prop="client_secret">
            <el-input
              v-model="codeEdit.client_secret"
              show-password
              v-if="dialogCodeEditFormVisible"
              type="password"
              placeholder="Client Secret"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </template>
        <template v-else-if="codeEdit.type==='other'">
          <el-form-item :label="$t(`sysSetting.integration.gitProviders.authMethod`)" prop="auth_type">
            <el-select v-model="codeEdit.auth_type" filterable allow-create>
              <el-option label="SSH" value="SSH"></el-option>
              <el-option label="Access Token" value="PrivateAccessToken"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item
            :label="$t(`sysSetting.integration.gitProviders.providerUrl`)"
            prop="address"
            :rules="{ required:true,validator: (codeEdit.auth_type === 'SSH' ? validateSSH : validateGitURL), trigger: ['change', 'blur'] }"
          >
            <el-input v-model="codeEdit.address" :placeholder="codeEdit.auth_type === 'SSH' ? 'git@example.com' : 'http(s)://example.com'"></el-input>
          </el-form-item>
          <el-form-item v-if="codeEdit.auth_type === 'SSH'" label="SSH Key" prop="ssh_key">
            <el-input v-model="codeEdit.ssh_key" placeholder="SSH Key" type="textarea" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item v-if="codeEdit.auth_type === 'PrivateAccessToken'" label="Access Token" prop="private_access_token">
            <el-input
              v-model="codeEdit.private_access_token"
              placeholder="Access Token"
              show-password
              v-if="dialogCodeEditFormVisible"
              type="password"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </template>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button
          type="primary"
          native-type="submit"
          size="small"
          class="start-create"
          @click="updateCodeConfig"
        >{{(codeEdit.type==='gerrit'||codeEdit.type==='other')?$t(`global.confirm`):$t(`sysSetting.integration.gitProviders.goToAuthorization`)}}</el-button>
        <el-button plain native-type="submit" size="small" @click="dialogCodeEditFormVisible = false">{{$t(`global.cancel`)}}</el-button>
      </div>
    </el-dialog>
    <!--end of edit code dialog-->

    <!--start of add code dialog-->
    <el-dialog :title="$t(`sysSetting.integration.gitProviders.addProviderTitle`)" custom-class="edit-form-dialog" :close-on-click-modal="false" :visible.sync="dialogCodeAddFormVisible">
      <template>
        <el-alert v-if="codeAdd.type === 'gitlab'" type="info" :closable="false">
          <slot>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appAuthCallbackTip`)}}</span>
            <span class="tips code-line">
              {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
              <span
                v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
                v-clipboard:success="copyCommandSuccess"
                v-clipboard:error="copyCommandError"
                class="el-icon-document-copy copy"
              ></span>
            </span>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appPermissionCheckTip`)}}api、read_user、read_repository</span>
            <span class="tips">
              - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                :href="`https://docs.koderover.com/zadig/settings/codehost/gitlab/`"
                :underline="false"
                target="_blank"
              >{{$t(`global.helpDoc`)}}</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-else-if="codeAdd.type === 'github'" type="info" :closable="false">
          <slot>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appAuthCallbackTip`)}}</span>
            <span class="tips code-line">
              {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
              <span
                v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
                v-clipboard:success="copyCommandSuccess"
                v-clipboard:error="copyCommandError"
                class="el-icon-document-copy copy"
              ></span>
            </span>
            <span class="tips">
              - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                :href="`https://docs.koderover.com/zadig/settings/codehost/github/`"
                :underline="false"
                target="_blank"
              >{{$t(`global.helpDoc`)}}</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-else-if="codeAdd.type === 'gerrit'" type="info" :closable="false">
          <slot>
            <span class="tips">
              - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                href="https://docs.koderover.com/zadig/settings/codehost/gerrit/"
                :underline="false"
                target="_blank"
              >{{$t(`global.helpDoc`)}}</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-else-if="codeAdd.type === 'gitee'" type="info" :closable="false">
          <slot>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appAuthCallbackTip`)}}</span>
            <span class="tips code-line">
              {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
              <span
                v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
                v-clipboard:success="copyCommandSuccess"
                v-clipboard:error="copyCommandError"
                class="el-icon-document-copy copy"
              ></span>
            </span>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appPermissionCheckTip`)}}projects、groups、pull_requests、hook</span>
            <span class="tips">
              - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                :href="`https://docs.koderover.com/zadig/settings/codehost/gitee/`"
                :underline="false"
                target="_blank"
              >{{$t(`global.helpDoc`)}}</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-if="codeAdd.type === 'gitee-enterprise'" type="info" :closable="false">
          <slot>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.appAuthCallbackTip`)}}</span>
            <span class="tips code-line">
              {{`${$utils.getOrigin()}/api/directory/codehosts/callback`}}
              <span
                v-clipboard:copy="`${$utils.getOrigin()}/api/directory/codehosts/callback`"
                v-clipboard:success="copyCommandSuccess"
                v-clipboard:error="copyCommandError"
                class="el-icon-document-copy copy"
              ></span>
            </span>
            <span
              class="tips"
            >- {{$t(`sysSetting.integration.gitProviders.appPermissionCheckTip`)}}projects、groups、pull_requests、hook、enterprises</span>
            <span class="tips">
              - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                :href="`https://docs.koderover.com/zadig/settings/codehost/gitee-enterprise/`"
                :underline="false"
                target="_blank"
              >{{$t(`global.helpDoc`)}}</el-link>
            </span>
          </slot>
        </el-alert>
        <el-alert v-else-if="codeAdd.type === 'other'" type="info" :closable="false">
          <slot>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.otherProviderTipFirst`)}}</span>
            <span class="tips">- {{$t(`sysSetting.integration.gitProviders.otherProviderTipSecond`)}}</span>
            <span class="tips">
              - {{$t(`sysSetting.integration.gitProviders.referToDoc`)}}
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                :href="`https://docs.koderover.com/zadig/settings/codehost/others/`"
                :underline="false"
                target="_blank"
              >{{$t(`global.helpDoc`)}}</el-link>
            </span>
          </slot>
        </el-alert>
      </template>
      <el-form :model="codeAdd" :rules="codeRules" status-icon label-width="140px" label-position="left" class="mg-t32" ref="codeForm">
        <el-form-item :label="$t(`sysSetting.integration.gitProviders.provider`)" prop="type">
          <el-select v-model="codeAdd.type" filterable allow-create>
            <el-option label="GitLab" value="gitlab"></el-option>
            <el-option label="GitHub" value="github"></el-option>
            <el-option label="Gerrit" value="gerrit"></el-option>
            <el-option :label="$t(`sysSetting.integration.gitProviders.giteeCE`)" value="gitee"></el-option>
            <el-option v-if="hasPlutus" :label="$t(`sysSetting.integration.gitProviders.giteeEE`)" value="gitee-enterprise"></el-option>
            <el-option :label="$t(`sysSetting.integration.gitProviders.otherProvider`)" value="other"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="$t(`sysSetting.integration.gitProviders.providerAlias`)" prop="alias">
          <el-input v-model="codeAdd.alias" :placeholder="$t(`sysSetting.integration.gitProviders.providerAlias`)"></el-input>
        </el-form-item>
        <template v-if="codeAdd.type==='gitlab' || codeAdd.type ==='github'">
          <el-form-item v-if="codeAdd.type==='gitlab'" :label="$t(`sysSetting.integration.gitProviders.gitlabUrl`)" prop="address">
            <el-input v-model.trim="codeAdd.address" :placeholder="$t(`sysSetting.integration.gitProviders.gitlabUrl`)" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :label="codeAdd.type==='gitlab'?'Application ID':'Client ID'" prop="application_id">
            <el-input
              v-model="codeAdd.application_id"
              :placeholder="codeAdd.type==='gitlab'?'Application ID':'Client ID'"
              auto-complete="off"
            ></el-input>
          </el-form-item>
          <el-form-item :label="codeAdd.type==='gitlab'?'Secret':'Client Secret'" prop="client_secret">
            <el-input
              v-model="codeAdd.client_secret"
              show-password
              v-if="dialogCodeAddFormVisible"
              type="password"
              :placeholder="codeAdd.type==='gitlab'?'Secret':'Client Secret'"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </template>
        <template v-else-if="codeAdd.type==='gerrit'">
          <el-form-item :label="$t(`sysSetting.integration.gitProviders.gerritUrl`)" prop="address">
            <el-input v-model.trim="codeAdd.address" :placeholder="$t(`sysSetting.integration.gitProviders.gerritUrl`)" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :label="$t(`sysSetting.integration.gitProviders.username`)" prop="username">
            <el-input v-model="codeAdd.username" placeholder="Username" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item :label="$t(`sysSetting.integration.gitProviders.password`)" prop="password">
            <el-input v-model="codeAdd.password" placeholder="Password" auto-complete="off"></el-input>
          </el-form-item>
        </template>
        <template v-else-if="codeAdd.type==='gitee'">
          <el-form-item label="Client ID" prop="application_id">
            <el-input v-model="codeAdd.application_id" placeholder="Client ID" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="Client Secret" prop="client_secret">
            <el-input
              v-model="codeAdd.client_secret"
              placeholder="Client Secret"
              show-password
              v-if="dialogCodeAddFormVisible"
              type="password"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </template>
        <template v-else-if="codeAdd.type==='gitee-enterprise'">
          <el-form-item :label="$t(`sysSetting.integration.gitProviders.giteeUrl`)" prop="address">
            <el-input v-model.trim="codeAdd.address" :placeholder="$t(`sysSetting.integration.gitProviders.giteeUrl`)" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="Client ID" prop="application_id">
            <el-input v-model="codeAdd.application_id" placeholder="Access Key" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item label="Client Secret" prop="client_secret">
            <el-input
              v-model="codeAdd.client_secret"
              placeholder="Client Secret"
              show-password
              v-if="dialogCodeAddFormVisible"
              type="password"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </template>
        <template v-else-if="codeAdd.type==='other'">
          <el-form-item :label="$t(`sysSetting.integration.gitProviders.authMethod`)" prop="auth_type">
            <el-select v-model="codeAdd.auth_type" filterable allow-create>
              <el-option label="SSH" value="SSH"></el-option>
              <el-option label="Access Token" value="PrivateAccessToken"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item
            v-if="codeAdd.auth_type"
            :label="$t(`sysSetting.integration.gitProviders.providerUrl`)"
            prop="address"
            :rules="{ required:true,validator: (codeAdd.auth_type === 'SSH' ? validateSSH : validateGitURL), trigger: ['change', 'blur'] }"
          >
            <el-input v-model="codeAdd.address" :placeholder="codeAdd.auth_type === 'SSH' ? 'git@example.com' : 'http(s)://example.com'"></el-input>
          </el-form-item>
          <el-form-item v-if="codeAdd.auth_type === 'SSH'" label="SSH Key" prop="ssh_key">
            <el-input v-model="codeAdd.ssh_key" placeholder="SSH Key" type="textarea" auto-complete="off"></el-input>
          </el-form-item>
          <el-form-item v-if="codeAdd.auth_type === 'PrivateAccessToken'" label="Access Token" prop="private_access_token">
            <el-input
              v-model="codeAdd.private_access_token"
              placeholder="Access Token"
              show-password
              v-if="dialogCodeAddFormVisible"
              type="password"
              auto-complete="off"
            ></el-input>
          </el-form-item>
        </template>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button
          type="primary"
          native-type="submit"
          size="small"
          class="start-create"
          @click="createCodeConfig"
        >{{(codeAdd.type==='gerrit'||codeAdd.type==='other')?$t(`global.confirm`):$t(`sysSetting.integration.gitProviders.goToAuthorization`)}}</el-button>
        <el-button plain native-type="submit" size="small" @click="dialogCodeAddFormVisible = false">{{$t(`global.cancel`)}}</el-button>
      </div>
    </el-dialog>
    <!--end of add code dialog-->
    <div class="tab-container">
      <div>
        <template>
          <el-alert type="info" :closable="false">
            <template>
              {{$t(`sysSetting.integration.gitProviders.tip`)}}
              <el-link
                style="font-size: 14px; vertical-align: baseline;"
                type="primary"
                :href="`https://docs.koderover.com/zadig/settings/codehost/overview`"
                :underline="false"
                target="_blank"
              >{{$t(`global.helpDoc`)}}</el-link>
            </template>
          </el-alert>
        </template>
        <div class="sync-container">
          <el-button type="primary" size="small" @click="handleCodeAdd" plain>{{$t(`global.add`)}}</el-button>
        </div>
        <el-table :data="code" style="width: 100%;">
          <el-table-column :label="$t(`sysSetting.integration.gitProviders.provider`)">
            <template slot-scope="scope">
              <span>{{scope.row.type}}</span>
              <span v-if="scope.row.alias">({{scope.row.alias}})</span>
            </template>
          </el-table-column>
          <el-table-column label="URL">
            <template slot-scope="scope">{{scope.row.address}}</template>
          </el-table-column>
          <el-table-column :label="$t(`sysSetting.integration.gitProviders.authStatus`)">
            <template slot-scope="scope">
              <span
                :class="scope.row.is_ready?'text-success':'text-failed'"
              >{{scope.row.is_ready === '2'?$t(`sysSetting.integration.gitProviders.authSuccess`):$t(`sysSetting.integration.gitProviders.authFailed`)}}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t(`sysSetting.integration.gitProviders.lastUpdated`)">
            <template slot-scope="scope">{{$utils.convertTimestamp(scope.row.updated_at)}}</template>
          </el-table-column>
          <el-table-column :label="$t(`sysSetting.integration.gitProviders.enableProxy`)" width="100">
            <el-switch slot-scope="scope" size="small" v-model="scope.row.enable_proxy" @change="updateRepoProxySettings(scope.row)"></el-switch>
          </el-table-column>
          <el-table-column :label="$t(`global.operation`)" width="160">
            <template slot-scope="scope">
              <el-button type="primary" size="mini" plain @click="handleCodeEdit(scope.row)">{{$t(`global.edit`)}}</el-button>
              <el-button type="danger" size="mini" @click="handleCodeDelete(scope.row)" plain>{{$t(`global.delete`)}}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>
<script>
import {
  getCodeProviderAPI,
  deleteCodeSourceAPI,
  updateCodeSourceAPI,
  createCodeSourceAPI,
  getProxyConfigAPI
} from '@api'
import { mapState } from 'vuex'
export default {
  data () {
    return {
      proxyInfo: {
        id: '',
        type: '',
        address: '',
        port: null,
        username: '',
        password: '',
        enable_repo_proxy: false,
        enable_application_proxy: false
      },
      code: [],
      dialogCodeAddFormVisible: false,
      dialogCodeEditFormVisible: false,
      codeEdit: {
        name: '',
        type: '',
        address: '',
        access_token: '',
        application_id: '',
        client_secret: '',
        enable_proxy: false,
        alias: '',
        auth_type: ''
      },
      codeAdd: {
        name: '',
        type: 'gitlab',
        address: '',
        access_token: '',
        application_id: '',
        client_secret: '',
        alias: '',
        auth_type: ''
      }
    }
  },
  computed: {
    codeRules () {
      return {
        type: {
          required: true,
          message: this.$t(
            `sysSetting.integration.gitProviders.selectProvider`
          ),
          trigger: ['blur']
        },
        address: [
          {
            required: true,
            trigger: ['blur', 'change'],
            message: this.$t(`sysSetting.integration.gitProviders.inputAddress`)
          }
        ],
        access_token: {
          required: true,
          message: this.$t(
            `sysSetting.integration.gitProviders.inputAccessToken`
          ),
          trigger: ['blur']
        },
        application_id: {
          required: true,
          message: this.$t(`sysSetting.integration.gitProviders.inputAppId`),
          trigger: ['blur']
        },
        client_secret: {
          required: true,
          message: this.$t(
            `sysSetting.integration.gitProviders.inputclientSecret`
          ),
          trigger: ['blur']
        },
        username: {
          required: true,
          message: this.$t(`sysSetting.integration.gitProviders.inputUsername`),
          trigger: ['blur']
        },
        password: {
          required: true,
          message: this.$t(`sysSetting.integration.gitProviders.inputPass`),
          trigger: ['blur']
        },
        alias: {
          required: true,
          message: this.$t(`sysSetting.integration.gitProviders.inputAlias`),
          trigger: ['blur']
        },
        auth_type: {
          required: true,
          message: this.$t(
            `sysSetting.integration.gitProviders.selectAuthMethod`
          ),
          trigger: ['blur', 'change']
        },
        ssh_key: {
          required: true,
          message: this.$t(
            `sysSetting.integration.gitProviders.inputSSHKey`
          ),
          trigger: ['blur', 'change']
        },
        private_access_token: {
          required: true,
          message: this.$t(
            `sysSetting.integration.gitProviders.inputPrivateAccessToken`
          ),
          trigger: ['blur', 'change']
        }
      }
    },
    validateSSH () {
      const validateSSH = (rule, value, callback) => {
        if (value === '') {
          callback(
            new Error(
              this.$t(
                `sysSetting.integration.gitProviders.inputOtherProviderUrl`
              )
            )
          )
        } else {
          const reg = /\w[-\w.+]*@([A-Za-z0-9][-A-Za-z0-9]+\.)+[A-Za-z0-9]{2,14}(:[1-9]\d{0,4})?/
          if (!reg.test(value)) {
            callback(
              new Error(
                this.$t(
                  `sysSetting.integration.gitProviders.checkOtherProviderUrl`
                )
              )
            )
          } else {
            callback()
          }
        }
      }
      return validateSSH
    },
    validateGitURL () {
      const validateGitURL = (rule, value, callback) => {
        if (value === '') {
          callback(
            new Error(
              this.$t(
                `sysSetting.integration.gitProviders.inputOtherProviderUrl`
              )
            )
          )
        } else {
          const reg = /^((ht|f)tps?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:\/~\+#]*[\w\-\@?^=%&\/~\+#])?$/
          if (!reg.test(value)) {
            callback(
              new Error(
                this.$t(`sysSetting.integration.gitProviders.inputAddress`)
              )
            )
          } else {
            callback()
          }
        }
      }
      return validateGitURL
    },
    ...mapState({
      hasPlutus: state => state.checkPlutus.hasPlutus
    })
  },
  methods: {
    updateRepoProxySettings (row) {
      if (!this.proxyInfo.id || this.proxyInfo.type === 'no') {
        row.enable_proxy = false
        this.$message.error(
          this.$t(`sysSetting.integration.gitProviders.noProxy`)
        )
        return
      }
      const codehostID = row.id
      updateCodeSourceAPI(codehostID, row)
        .then(res => {
          this.$message({
            message: row.enable_proxy
              ? this.$t(`sysSetting.integration.gitProviders.proxyIsEnabled`)
              : this.$t(`sysSetting.integration.gitProviders.proxyIsDisabled`),
            type: 'success'
          })
        })
        .catch(err => {
          row.enable_proxy = !row.enable_proxy
          this.$message.error(
            `${this.$t(
              `sysSetting.integration.gitProviders.proxyEnableFailed`
            )}：${err}`
          )
        })
    },
    handleCodeAdd () {
      this.dialogCodeAddFormVisible = true
    },
    handleCodeDelete (row) {
      this.$confirm(
        this.$t(`sysSetting.integration.gitProviders.confirmDeleteProvider`),
        this.$t(`global.confirm`),
        {
          confirmButtonText: this.$t(`global.confirm`),
          cancelButtonText: this.$t(`global.cancel`),
          type: 'warning'
        }
      ).then(() => {
        deleteCodeSourceAPI(row.id).then(res => {
          this.getCodeConfig()
          this.$message({
            message: this.$t(
              `sysSetting.integration.gitProviders.deleteProviderSuccess`
            ),
            type: 'success'
          })
        })
      })
    },
    handleCodeEdit (row) {
      this.dialogCodeEditFormVisible = true
      this.codeEdit = this.$utils.cloneObj(row)
    },
    handleCodeCancel () {
      if (this.$refs.codeForm) {
        this.$refs.codeForm.resetFields()
      } else if (this.$refs.codeUpdateForm) {
        this.$refs.codeUpdateForm.resetFields()
      }
      this.dialogCodeEditFormVisible = false
      this.dialogCodeAddFormVisible = false
    },
    clearValidate (ref) {
      this.$refs[ref].clearValidate()
    },
    createCodeConfig () {
      this.$refs.codeForm.validate(valid => {
        if (valid) {
          const payload = this.codeAdd
          const redirectUrl = window.location.href
          const provider = this.codeAdd.type
          if (provider === 'github') {
            payload.address = 'https://github.com'
          } else if (provider === 'gitee') {
            payload.address = 'https://gitee.com'
          } else if (provider === 'other') {
            // Add newline to the end of the ssh key
            const sshKeyLastCharacter = payload.ssh_key.charAt(
              payload.ssh_key.length - 1
            )
            if (sshKeyLastCharacter !== '\n') {
              payload.ssh_key = payload.ssh_key + '\n'
            }
          }
          createCodeSourceAPI(payload).then(res => {
            const codehostId = res.id
            this.getCodeConfig()
            this.$message({
              message: this.$t(
                `sysSetting.integration.gitProviders.addProviderSuccess`
              ),
              type: 'success'
            })
            if (
              payload.type === 'gitlab' ||
              payload.type === 'gitee' ||
              payload.type === 'github'
            ) {
              this.goToCodeHostAuth(codehostId, redirectUrl)
            }
            this.handleCodeCancel()
          })
        } else {
          return false
        }
      })
    },
    updateCodeConfig () {
      this.$refs.codeUpdateForm.validate(valid => {
        if (valid) {
          const payload = this.codeEdit
          const codehostId = this.codeEdit.id
          const redirectUrl = window.location.href
          const provider = this.codeEdit.type
          if (provider === 'github') {
            payload.address = 'https://github.com'
          } else if (provider === 'gitee') {
            payload.address = 'https://gitee.com'
          } else if (provider === 'other') {
            // Add newline to the end of the ssh key
            const sshKeyLastCharacter = payload.ssh_key.charAt(
              payload.ssh_key.length - 1
            )
            if (sshKeyLastCharacter !== '\n') {
              payload.ssh_key = payload.ssh_key + '\n'
            }
          }
          updateCodeSourceAPI(codehostId, payload).then(res => {
            this.getCodeConfig()
            if (
              payload.type === 'gitlab' ||
              payload.type === 'gitee' ||
              payload.type === 'gitee-enterprise' ||
              payload.type === 'github'
            ) {
              this.$message({
                message: this.$t(`changeProviderInfoSuccessAndGoToAuth`),
                type: 'success'
              })
              this.goToCodeHostAuth(codehostId, redirectUrl)
            } else {
              this.handleCodeCancel()
              this.$message({
                message: this.$t(
                  `sysSetting.integration.gitProviders.changeProviderInfoSuccess`
                ),
                type: 'success'
              })
            }
          })
        } else {
          return false
        }
      })
    },
    getCodeConfig () {
      const key = this.$utils.rsaEncrypt()
      getCodeProviderAPI(key).then(res => {
        res.forEach(item => {
          item.client_secret = this.$utils.aesDecrypt(item.client_secret)
          if (item.password) {
            item.password = this.$utils.aesDecrypt(item.password)
          }
          if (item.private_access_token) {
            item.private_access_token = this.$utils.aesDecrypt(
              item.private_access_token
            )
          }
          if (item.ssh_key) {
            item.ssh_key = this.$utils.aesDecrypt(item.ssh_key)
          }
        })
        this.code = res
      })
    },
    goToCodeHostAuth (codehostId, redirectUrl) {
      window.location.href = `/api/v1/codehosts/${codehostId}/auth?redirect_url=${redirectUrl}`
    },
    copyCommandSuccess (event) {
      this.$message({
        message: this.$t(`sysSetting.integration.gitProviders.copyAddrSuccess`),
        type: 'success'
      })
    },
    copyCommandError (event) {
      this.$message({
        message: this.$t(`sysSetting.integration.gitProviders.copyAddrFailed`),
        type: 'error'
      })
    },
    getProxyConfig () {
      getProxyConfigAPI()
        .then(response => {
          if (response.length > 0) {
            this.proxyInfo = Object.assign({}, this.proxyInfo, response[0])
          }
        })
        .catch(error => {
          this.$message.error(
            `${this.$t(
              `sysSetting.integration.gitProviders.getProxyConfigurationFailed`
            )}${error}`
          )
        })
    }
  },
  watch: {
    'codeAdd.type' (val) {
      this.$refs.codeForm.clearValidate()
    }
  },
  activated () {
    this.getProxyConfig()
    this.getCodeConfig()
  }
}
</script>

<style lang="less">
.integration-code-container {
  position: relative;
  flex: 1;
  overflow: auto;
  font-size: 13px;

  .tab-container {
    .sync-container {
      padding-top: 15px;
      padding-bottom: 15px;
    }
  }

  .text-success {
    color: rgb(82, 196, 26);
  }

  .text-failed {
    color: #ff1949;
  }

  .edit-form-dialog {
    width: 580px;

    .el-dialog__header {
      padding: 15px;
      text-align: center;
      border-bottom: 1px solid #e4e4e4;

      .el-dialog__close {
        font-size: 10px;
      }
    }

    .el-dialog__body {
      padding: 0 20px;
      color: #606266;
      font-size: 14px;

      .el-form-item {
        margin-bottom: 15px;
      }
    }

    .el-select {
      width: 100%;
    }

    .el-input {
      display: inline-block;
    }

    .tips {
      display: block;

      &.code-line {
        display: inline-block;
        padding-left: 10px;
        color: #ecf0f1;
        font-size: 14px;
        word-wrap: break-word;
        word-break: break-all;
        background-color: #334851;
        border-radius: 2px;

        .copy {
          font-size: 16px;
          cursor: pointer;

          &:hover {
            color: @themeColor;
          }
        }
      }
    }
  }
}
</style>
