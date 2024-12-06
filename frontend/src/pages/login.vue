<template>
  <div :class="$q.dark.isActive ? '' : 'login-background'" style="height:100vh;display:flex">
    <div v-if="loaded === true" style="margin:auto">
      <q-card align="center" style="width:350px">
        <q-card-section>
          <q-img :src="$q.dark.isActive ? 'pwndoc-logo-white.png' : 'pwndoc-logo.png'" />
        </q-card-section>

        <q-card-section v-if="errors.alert">
          <q-banner rounded class="bg-red-4 text-white">
            <q-icon name="fa fa-exclamation-circle" class="q-pr-sm" />
            {{ errors.alert }}
          </q-banner>
        </q-card-section>

        <div v-if="init">
          <q-card-section>
            <q-input
              :label="t('username')"
              :error="!!errors.username"
              :error-message="errors.username"
              hide-bottom-space
              v-model="username"
              outlined
              bg-color="white"
              autofocus
              for="username"
              @keyup.enter="initUser()"
            />
          </q-card-section>
          <q-card-section>
            <q-input
              :label="t('firstname')"
              :error="!!errors.firstname"
              :error-message="errors.firstname"
              hide-bottom-space
              v-model="firstname"
              outlined
              bg-color="white"
              @keyup.enter="initUser()"
            />
          </q-card-section>
          <q-card-section>
            <q-input
              :label="t('lastname')"
              :error="!!errors.lastname"
              :error-message="errors.lastname"
              hide-bottom-space
              v-model="lastname"
              outlined
              bg-color="white"
              @keyup.enter="initUser()"
            />
          </q-card-section>
          <q-card-section>
            <q-input
              :label="t('password')"
              :error="!!errors.password"
              :error-message="errors.password"
              hide-bottom-space
              v-model="password"
              outlined
              bg-color="white"
              type="password"
              for="password"
              @keyup.enter="initUser()"
            />
          </q-card-section>

          <q-card-section align="center">
            <q-btn color="blue" class="full-width" unelevated no-caps @click="initUser()">{{ t('registerFirstUser') }}</q-btn>
          </q-card-section>
        </div>

        <div v-else>
          <q-card-section v-show="step === 0">
            <q-input
              :label="t('username')"
              :error="!!errors.username"
              :error-message="errors.username"
              hide-bottom-space
              v-model="username"
              autofocus
              outlined
              bg-color="white"
              for="username"
              @keyup.enter="getToken()"
              :disable="loginLoading"
            >
              <template v-slot:prepend>
                <q-icon name="fa fa-user" />
              </template>
            </q-input>
          </q-card-section>
          <q-card-section v-show="step === 0">
            <q-input
              :label="t('password')"
              :error="!!errors.password"
              :error-message="errors.password"
              hide-bottom-space
              v-model="password"
              outlined
              bg-color="white"
              for="password"
              type="password"
              @keyup.enter="getToken()"
              :disable="loginLoading"
            >
              <template v-slot:prepend>
                <q-icon name="fa fa-key" />
              </template>
            </q-input>
          </q-card-section>
          <q-card-section v-show="step === 1">
            <q-item class="q-pl-none">
              <q-item-section avatar style="min-width:0" class="q-pr-sm">
                <q-btn dense flat size="sm" icon="mdi-arrow-left" style="top:-8px" @click="step=0;totpToken=''">
                  <q-tooltip>{{ t('goBack') }}</q-tooltip>
                </q-btn>
              </q-item-section>
              <q-item-section>
                <p class="text-left text-h6 text-center text-vertical">{{ t('twoStepVerification') }}</p>
              </q-item-section>
            </q-item>
            <q-item class="q-pl-none">
              <q-item-section avatar class="no-padding">
                <q-icon name="mdi-cellphone-key" size="70px" />
              </q-item-section>
              <q-item-section>
                <p>{{ t('twoStepVerificationMessage') }}</p>
              </q-item-section>
            </q-item>
            <q-input
              ref="totptoken"
              v-model="totpToken"
              placeholder="Enter 6-digit code"
              outlined
              bg-color="white"
              for="totpToken"
              maxlength="6"
              @keyup.enter="getToken()"
              :disable="loginLoading"
            >
              <template v-slot:prepend>
                <q-icon name="fa fa-unlock-alt" />
              </template>
            </q-input>
          </q-card-section>

          <q-card-section align="center">
            <q-btn :loading="loginLoading" color="blue" class="full-width" unelevated no-caps @click="getToken()">{{ t('login') }}</q-btn>
          </q-card-section>
        </div>
      </q-card>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue';
import { Loading } from 'quasar';
import { isInit, initUser as initUserService, getToken as getTokenService } from '@/services/user';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

export default {
  setup() {
    const { t } = useI18n();
    const route = useRoute();
    const router = useRouter();

    const init = ref(false);
    const loaded = ref(false);
    const username = ref("");
    const firstname = ref("");
    const lastname = ref("");
    const password = ref("");
    const totpToken = ref("");
    const step = ref(0);
    const errors = ref({
      alert: "",
      username: "",
      password: "",
      firstname: "",
      lastname: ""
    });
    const loginLoading = ref(false);

    const cleanErrors = () => {
      errors.value.alert = "";
      errors.value.username = "";
      errors.value.firstname = "";
      errors.value.lastname = "";
    };

    const checkInit = () => {
      Loading.show({ message: t('msg.tryingToContactBackend'), customClass: 'loading', backgroundColor: 'blue-grey-8' });
      isInit()
        .then((data) => {
          Loading.hide();
          loaded.value = true;
          init.value = data.data.datas;
        })
        .catch((err) => {
          Loading.show({
            message: `<i class='material-icons'>wifi_off</i><br /><p>${t('msg.wrongContactingBackend')}</p>`,
            spinner: null,
            backgroundColor: 'red-10',
            customClass: 'loading-error'
          });
          console.log(err);
        });
    };

    const initUser = () => {
      cleanErrors();
      if (!username.value) errors.value.username = t('msg.usernameRequired');
      if (!password.value) errors.value.password = t('msg.passwordRequired');
      if (!firstname.value) errors.value.firstname = t('msg.firstnameRequired');
      if (!lastname.value) errors.value.lastname = t('msg.lastnameRequired');

      if (errors.value.username || errors.value.firstname || errors.value.lastname) return;

      initUserService(username.value, firstname.value, lastname.value, password.value)
        .then(async () => {
          router.push('/');
        })
        .catch((err) => {
          console.log(err);
          errors.value.alert = err.response.data.datas;
        });
    };

    const getToken = () => {
      cleanErrors();
      if (!username.value) errors.value.username = t('msg.usernameRequired');

      if (errors.value.username) return;

      loginLoading.value = true;
      getTokenService(username.value, password.value, totpToken.value)
        .then(async () => {
          router.push('/');
        })
        .catch((err) => {
          if (err.response.status === 422) {
            step.value = 1;
            nextTick(() => {
              totptoken.value?.focus();
            });
          } else {
            let errmsg = t('err.invalidCredentials');
            if (err.response.data.datas) errmsg = err.response.data.datas;
            errors.value.alert = errmsg;
          }
        })
        .finally(() => {
          loginLoading.value = false;
        });
    };

    onMounted(() => {
      if (route.query.tokenError) {
        if (route.query.tokenError === "2") errors.value.alert = t('err.expiredToken');
        else errors.value.alert = t('err.invalidToken');
      }
      checkInit();
    });

    return {
      t,
      init,
      loaded,
      username,
      firstname,
      lastname,
      password,
      totpToken,
      step,
      errors,
      loginLoading,
      cleanErrors,
      checkInit,
      initUser,
      getToken,
    };
  },
};
</script>

<style scoped>
.login-background {
  background: linear-gradient(45deg, #007bff, transparent);
}

.loading p {
  font-size: 20px;
}
</style>