import { ref, reactive, computed, onMounted, getCurrentInstance } from 'vue';
import { Dialog, Notify, QSpinnerGears } from 'quasar';

import AuditStateIcon from 'components/audit-state-icon';
import Breadcrumb from 'components/breadcrumb';

import AuditService from '@/services/audit';
import DataService from '@/services/data';
import CompanyService from '@/services/company';
import {user, isAllowed} from '@/services/user';
import { useI18n } from 'vue-i18n';

export default {
  setup() {
    const { t } = useI18n();
    const { proxy } = getCurrentInstance();

    const audits = ref([]);
    const loading = ref(true);
    const auditTypes = ref([]);
    const companies = ref([]);
    const languages = ref([]);
    const visibleColumns = ref(['name', 'tr', 'yacUUID', 'users', 'date', 'action']);
    const pagination = reactive({
      page: 1,
      rowsPerPage: 25,
      sortBy: 'date',
      descending: true,
    });
    const rowsPerPageOptions = [
      { label: '25', value: 25 },
      { label: '50', value: 50 },
      { label: '100', value: 100 },
      { label: 'All', value: 0 },
    ];
    const search = reactive({ filter: '' });
    const myAudits = ref(false);
    const displayConnected = ref(false);
    const displayReadyForReview = ref(false);
    const errors = reactive({ name: '', language: '', auditType: '' });
    const currentAudit = reactive({ name: '', auditType: '' });
    const internalAudits = ref(false);
    const externalAudits = ref(false);

    const dtHeaders = computed(() => [
      { name: 'name', label: t('name'), field: 'name', align: 'left', sortable: true },
      { name: 'tr', label: t('tr'), field: 'tr', align: 'left', sortable: true },
      { name: 'yacUUID', label: t('yacUUID'), field: 'yacUUID', align: 'left', sortable: true },
      { name: 'users', label: t('participants'), align: 'left', sortable: true },
      { name: 'date', label: t('date'), field: row => row.date_start.split('T')[0], align: 'left', sortable: true },
      { name: 'connected', label: '', align: 'left', sortable: false },
      { name: 'reviews', label: '', align: 'left', sortable: false },
      { name: 'action', label: '', field: 'action', align: 'left', sortable: false },
    ]);

    const getLanguages = async () => {
      try {
        const data = await DataService.getLanguages();
        languages.value = data.data.datas;
      } catch (err) {
        console.log(err);
      }
    };

    const getAuditTypes = async () => {
      try {
        const data = await DataService.getAuditTypes();
        auditTypes.value = data.data.datas;
      } catch (err) {
        console.log(err);
      }
    };

    const getCompanies = async () => {
      try {
        const data = await CompanyService.getCompanies();
        companies.value = data.data.datas;
      } catch (err) {
        console.log(err);
      }
    };

    const getAudits = async () => {
      loading.value = true;
      try {
        const data = await AuditService.getAudits({ findingTitle: search.filter });
        audits.value = data.data.datas;
        loading.value = false;
      } catch (err) {
        console.log(err);
      }
    };

    const createAudit = async () => {
      cleanErrors();
      if (!currentAudit.name) errors.name = 'Name required';
      if (!currentAudit.auditType) errors.auditType = 'Assessment required';

      if (errors.name || errors.auditType) return;

      try {
        const response = await AuditService.createAudit(currentAudit);
        console.log(response);
        proxy.$refs.createModal.hide();
        proxy.$router.push('/audits/' + response.data.datas.audit._id + '/general');
      } catch (err) {
        Notify.create({
          message: err.response.data.datas,
          color: 'negative',
          textColor: 'white',
          position: 'top-right',
        });
      }
    };

    const deleteAudit = async uuid => {
      try {
        await AuditService.deleteAudit(uuid);
        getAudits();
        Notify.create({
          message: 'Audit deleted successfully',
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

    const confirmDeleteAudit = audit => {
      Dialog.create({
        title: 'Confirm Suppression',
        message: `Audit «${audit.name}» will be permanently deleted`,
        ok: { label: 'Confirm', color: 'positive' },
        cancel: { label: 'Cancel', color: 'negative' },
      }).onOk(() => deleteAudit(audit._id));
    };

    const BlobReader = data => {
      const fileReader = new FileReader();

      return new Promise((resolve, reject) => {
        fileReader.onerror = () => {
          fileReader.abort();
          reject(new Error('Problem parsing blob'));
        };

        fileReader.onload = () => {
          resolve(fileReader.result);
        };

        fileReader.readAsText(data);
      });
    };

    const generateReport = async auditId => {
      const downloadNotif = Notify.create({
        spinner: QSpinnerGears,
        message: 'Generating the Report',
        color: 'blue',
        timeout: 0,
        group: false,
      });
      var data = {};
      data.isAttachement = false;
      try {
        const audit = await AuditService.generateAuditReport(auditId, data);
        const auditNew = audit.data.datas;
        var blob = new Blob([Buffer.from(auditNew.blob, 'base64')], { type: 'application/octet-stream' });
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        const title = auditNew.name.concat('_', 'report', '.docx');
        link.download = title;
        document.body.appendChild(link);
        link.click();
        link.remove();
        downloadNotif({
          icon: 'done',
          spinner: false,
          message: 'Report successfully generated',
          color: 'green',
          timeout: 2500,
        });
      } catch (err) {
        var message = 'Error generating template';
        if (err.response && err.response.data) {
          var blob = new Blob([err.response.data], { type: 'application/json' });
          var blobData = await BlobReader(blob);
          message = JSON.parse(blobData).datas;
        }
        downloadNotif();
        Notify.create({
          message: message,
          type: 'negative',
          textColor: 'white',
          position: 'top',
          closeBtn: true,
          timeout: 0,
          classes: 'text-pre-wrap',
        });
      }
    };

    const cleanErrors = () => {
      errors.name = '';
      errors.language = '';
      errors.auditType = '';
    };

    const cleanCurrentAudit = () => {
      cleanErrors();
      currentAudit.name = '';
      currentAudit.language = '';
      currentAudit.auditType = '';
    };

    const convertLocale = locale => {
      for (var i = 0; i < languages.value.length; i++) {
        if (languages.value[i].locale === locale) return languages.value[i].language;
      }
      return '';
    };

    const convertParticipants = row => {
      var collabs = row.collaborators ? row.collaborators : [];
      var result = row.creator ? [row.creator.username] : [];
      collabs.forEach(collab => result.push(collab.username));
      return result.join(', ');
    };

    const customFilter = (rows, terms, cols, getCellValue) => {
      var username = user.value.username.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      var nameTerm = (terms.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var yacUUIDTerm = (terms.yacUUID || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var trTerm = (terms.tr || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var usersTerm = (terms.users || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      var dateTerm = (terms.date || '').toLowerCase();

      return (
        rows &&
        rows.filter(row => {
          var name = (row.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          var yacUUID = (row.yacUUID || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          var tr = (row.tr || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          var users = convertParticipants(row).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          var date = (row.date_start || '').split('T')[0].toLowerCase();
          var pentestType = row.pentestType || '';

          return (
            name.indexOf(nameTerm) > -1 &&
            yacUUID.indexOf(yacUUIDTerm) > -1 &&
            tr.indexOf(trTerm) > -1 &&
            users.indexOf(usersTerm) > -1 &&
            date.indexOf(dateTerm) > -1 &&
            ((myAudits.value && users.indexOf(username) > -1) || !myAudits.value) &&
            ((internalAudits.value && pentestType === 'Internal') || !internalAudits.value) &&
            ((externalAudits.value && pentestType !== 'Internal') || !externalAudits.value) &&
            ((displayConnected.value && row.connected && row.connected.length > 0) || !displayConnected.value) &&
            ((displayReadyForReview.value && users.indexOf(username) < 0 && row.state === 'REVIEW') || !displayReadyForReview.value)
          );
        })
      );
    };

    const dblClick = (evt, row) => {
      proxy.$router.push('/audits/' + row._id + '/general');
    };

    onMounted(() => {
      search.filter = proxy.$route.params.finding;

      if (isAllowed('audits:users-connected')) visibleColumns.value.push('connected');
      if (proxy.$settings?.reviews?.enabled ?? false) {
        visibleColumns.value.push('reviews');
      }

      getAudits();
      getLanguages();
      getAuditTypes();
      getCompanies();
    });

    return {
      t,
      isAllowed,
      audits,
      loading,
      auditTypes,
      companies,
      languages,
      visibleColumns,
      pagination,
      rowsPerPageOptions,
      search,
      myAudits,
      displayConnected,
      displayReadyForReview,
      errors,
      currentAudit,
      internalAudits,
      externalAudits,
      dtHeaders,
      getLanguages,
      getAuditTypes,
      getCompanies,
      getAudits,
      createAudit,
      deleteAudit,
      confirmDeleteAudit,
      BlobReader,
      generateReport,
      cleanErrors,
      cleanCurrentAudit,
      convertLocale,
      convertParticipants,
      customFilter,
      dblClick,
    };
  },
  components: {
    AuditStateIcon,
    Breadcrumb,
  },
};