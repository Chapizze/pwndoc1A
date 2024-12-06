import { Dialog, Notify } from 'quasar';
import { ref, reactive, computed, onMounted, getCurrentInstance } from 'vue';

import ClientService from '@/services/client';
import CompanyService from '@/services/company';
import Utils from '@/services/utils';

import { useI18n } from 'vue-i18n';

export default {
  setup() {
    const { t } = useI18n();
    const { proxy } = getCurrentInstance();

    const clients = ref([]);
    const loading = ref(true);
    const companies = ref([]);
    const pagination = reactive({
      page: 1,
      rowsPerPage: 25,
      sortBy: 'firstname',
    });
    const rowsPerPageOptions = [
      { label: '25', value: 25 },
      { label: '50', value: 50 },
      { label: '100', value: 100 },
      { label: 'All', value: 0 },
    ];
    const search = reactive({ firstname: '', lastname: '', email: '', 'company.name': '' });
    const customFilter = Utils.customFilter;
    const errors = reactive({ lastname: '', firstname: '', email: '' });
    const currentClient = reactive({
      lastname: '',
      firstname: '',
      email: '',
      phone: '',
      cell: '',
      title: '',
      company: {},
    });
    const idUpdate = ref('');

    const dtHeaders = computed(() => [
      { name: 'firstname', label: t('firstname'), field: 'firstname', align: 'left', sortable: true },
      { name: 'lastname', label: t('lastname'), field: 'lastname', align: 'left', sortable: true },
      { name: 'email', label: t('email'), field: 'email', align: 'left', sortable: true },
      { name: 'company', label: t('company'), field: row => (row.company ? row.company.name : ''), align: 'left', sortable: true },
      { name: 'action', label: '', field: 'action', align: 'left', sortable: false },
    ]);

    const getClients = async () => {
      loading.value = true;
      try {
        const data = await ClientService.getClients();
        clients.value = data.data.datas;
        loading.value = false;
      } catch (err) {
        console.log(err);
      }
    };

    const createClient = async () => {
      cleanErrors();
      if (!currentClient.lastname) errors.lastname = t('msg.lastnameRequired');
      if (!currentClient.firstname) errors.firstname = t('msg.firstnameRequired');
      if (!currentClient.email) errors.email = t('msg.emailRequired');

      if (errors.lastname || errors.firstname || errors.email) return;

      try {
        await ClientService.createClient(currentClient);
        getClients();
        proxy.$refs.createModal.hide();
        Notify.create({
          message: t('msg.clientCreatedOk'),
          color: 'positive',
          textColor: 'white',
          position: 'top-right',
        });
      } catch (err) {
        Notify.create({
          message: err.response.data.datas,
          color: 'negative',
          textColor: 'white',
          position: 'top-right',
        });
      }
    };

    const updateClient = async () => {
      cleanErrors();
      if (!currentClient.lastname) errors.lastname = t('msg.lastnameRequired');
      if (!currentClient.firstname) errors.firstname = t('msg.firstnameRequired');
      if (!currentClient.email) errors.email = t('msg.emailRequired');

      if (errors.lastname || errors.firstname || errors.email) return;

      try {
        await ClientService.updateClient(idUpdate.value, currentClient);
        getClients();
        proxy.$refs.editModal.hide();
        Notify.create({
          message: t('msg.clientUpdatedOk'),
          color: 'positive',
          textColor: 'white',
          position: 'top-right',
        });
      } catch (err) {
        Notify.create({
          message: err.response.data.datas,
          color: 'negative',
          textColor: 'white',
          position: 'top-right',
        });
      }
    };

    const deleteClient = async clientId => {
      try {
        await ClientService.deleteClient(clientId);
        getClients();
        Notify.create({
          message: t('msg.clientDeletedOk'),
          color: 'positive',
          textColor: 'white',
          position: 'top-right',
        });
      } catch (err) {
        Notify.create({
          message: err.response.data.datas,
          color: 'negative',
          textColor: 'white',
          position: 'top-right',
        });
      }
    };

    const confirmDeleteClient = client => {
      Dialog.create({
        title: t('msg.confirmSuppression'),
        message: `${t('client')} «${client.firstname} ${client.lastname}» ${t('msg.deleteNotice')}`,
        ok: { label: t('btn.confirm'), color: 'negative' },
        cancel: { label: t('btn.cancel'), color: 'white' },
      }).onOk(() => deleteClient(client._id));
    };

    const getCompanies = async () => {
      try {
        const data = await CompanyService.getCompanies();
        companies.value = data.data.datas;
      } catch (err) {
        console.log(err);
      }
    };

    const clone = row => {
      Object.assign(currentClient, row);
      idUpdate.value = row._id;
    };

    const cleanErrors = () => {
      errors.lastname = '';
      errors.firstname = '';
      errors.email = '';
    };

    const cleanCurrentClient = () => {
      currentClient.lastname = '';
      currentClient.firstname = '';
      currentClient.email = '';
      currentClient.phone = '';
      currentClient.cell = '';
      currentClient.title = '';
      currentClient.company = { name: '' };
    };

    const dblClick = (evt, row) => {
      clone(row);
      proxy.$refs.editModal.show();
    };

    onMounted(() => {
      getClients();
      getCompanies();
    });

    return {
      t,
      clients,
      proxy,
      loading,
      companies,
      pagination,
      rowsPerPageOptions,
      search,
      customFilter,
      errors,
      currentClient,
      idUpdate,
      dtHeaders,
      getClients,
      createClient,
      updateClient,
      deleteClient,
      confirmDeleteClient,
      getCompanies,
      clone,
      cleanErrors,
      cleanCurrentClient,
      dblClick,
    };
  },
};