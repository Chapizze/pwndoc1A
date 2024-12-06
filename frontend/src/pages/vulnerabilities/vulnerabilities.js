import { Dialog, Notify } from 'quasar';
import _ from 'lodash';

import BasicEditor from 'components/editor';
import Breadcrumb from 'components/breadcrumb';
import TextareaArray from 'components/textarea-array';
import CustomFields from 'components/custom-fields';

import VulnerabilityService from '@/services/vulnerability';
import DataService from '@/services/data';
import {user, isAllowed} from '@/services/user';
import Utils from '@/services/utils';

import { useI18n } from 'vue-i18n';
import { ref, reactive, computed, onMounted, getCurrentInstance } from 'vue';

export default {
  setup() {
    const { t } = useI18n();
    const { proxy } = getCurrentInstance();
    const vulnerabilities = ref([]);
    const loading = ref(true);
    const pagination = reactive({
      page: 1,
      rowsPerPage: 25,
      sortBy: 'title',
    });
    const rowsPerPageOptions = [
      { label: '25', value: 25 },
      { label: '50', value: 50 },
      { label: '100', value: 100 },
      { label: 'All', value: 0 },
    ];
    const filteredRowsCount = ref(0);
    const languages = ref([]);
    const locale = ref('');
    const search = reactive({ title: '', category: '', valid: 0, new: 1, updates: 2 });
    const errors = reactive({ title: '' });
    const currentVulnerability = reactive({
      cvssv3: '',
      severity: '',
      urgency: '',
      details: [],
    });
    const currentLanguage = ref('');
    const displayFilters = reactive({ valid: true, new: true, updates: true });
    const dtLanguage = ref('');
    const currentDetailsIndex = ref(0);
    const vulnerabilityId = ref('');
    const vulnUpdates = ref([]);
    const currentUpdate = ref('');
    const currentUpdateLocale = ref('');
    const vulnTypes = ref([]);
    const mergeLanguageLeft = ref('');
    const mergeLanguageRight = ref('');
    const mergeVulnLeft = ref('');
    const mergeVulnRight = ref('');
    const vulnCategories = ref([]);
    const currentCategory = ref(null);
    const customFields = ref([]);

    const dtHeaders = computed(() => [
      { name: 'title', label: t('title'), field: 'title', align: 'left', sortable: true },
      { name: 'category', label: t('category'), field: 'category', align: 'left', sortable: true },
      { name: 'action', label: '', field: 'action', align: 'left', sortable: false },
    ]);

    const vulnTypesLang = computed(() => vulnTypes.value.filter(type => type.locale === currentLanguage.value));

    const computedVulnerabilities = computed(() => {
      const result = [];
      vulnerabilities.value.forEach(vuln => {
        for (let i = 0; i < vuln.details.length; i++) {
          if (vuln.details[i].locale === dtLanguage.value && vuln.details[i].title) {
            result.push(vuln);
          }
        }
      });
      return result;
    });

    const vulnCategoriesOptions = computed(() => {
      const result = vulnCategories.value.map(cat => cat.name);
      result.unshift('No Category');
      return result;
    });

    const getLanguages = async () => {
      try {
        const data = await DataService.getLanguages();
        languages.value = data.data.datas;
        if (languages.value.length > 0) {
          dtLanguage.value = languages.value[0].locale;
          cleanCurrentVulnerability();
        }
      } catch (err) {
        console.log(err);
      }
    };

    const getCustomFields = async () => {
      try {
        const data = await DataService.getCustomFields();
        customFields.value = data.data.datas;
      } catch (err) {
        console.log(err);
      }
    };

    const getVulnTypes = async () => {
      try {
        const data = await DataService.getVulnerabilityTypes();
        vulnTypes.value = data.data.datas;
      } catch (err) {
        console.log(err);
      }
    };

    const getVulnerabilityCategories = async () => {
      try {
        const data = await DataService.getVulnerabilityCategories();
        vulnCategories.value = data.data.datas;
      } catch (err) {
        console.log(err);
      }
    };

    const getVulnerabilities = async () => {
      loading.value = true;
      try {
        const data = await VulnerabilityService.getVulnerabilities();
        vulnerabilities.value = data.data.datas;
        loading.value = false;
      } catch (err) {
        console.log(err);
        Notify.create({
          message: err.response.data.datas,
          color: 'negative',
          textColor: 'white',
          position: 'top-right',
        });
      }
    };

    const createVulnerability = async () => {
      cleanErrors();
      const index = currentVulnerability.details.findIndex(obj => obj.title !== '');
      if (index < 0) errors.title = t('err.titleRequired');
      if (errors.title) return;

      try {
        await VulnerabilityService.createVulnerabilities([currentVulnerability]);
        getVulnerabilities();
        proxy.$refs.createModal.hide();
        Notify.create({
          message: t('msg.vulnerabilityCreatedOk'),
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

    const updateVulnerability = async () => {
      cleanErrors();
      const index = currentVulnerability.details.findIndex(obj => obj.title !== '');
      if (index < 0) errors.title = t('err.titleRequired');
      if (errors.title) return;

      try {
        await VulnerabilityService.updateVulnerability(vulnerabilityId.value, currentVulnerability);
        getVulnerabilities();
        proxy.$refs.editModal.hide();
        proxy.$refs.updatesModal.hide();
        Notify.create({
          message: t('msg.vulnerabilityUpdatedOk'),
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

    const deleteVulnerability = async vulnerabilityId => {
      try {
        await VulnerabilityService.deleteVulnerability(vulnerabilityId);
        getVulnerabilities();
        Notify.create({
          message: t('msg.vulnerabilityDeletedOk'),
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

    const confirmDeleteVulnerability = row => {
      Dialog.create({
        title: t('msg.confirmSuppression'),
        message: t('msg.vulnerabilityWillBeDeleted'),
        ok: { label: t('btn.confirm'), color: 'negative' },
        cancel: { label: t('btn.cancel'), color: 'white' },
      }).onOk(() => deleteVulnerability(row._id));
    };

    const getVulnUpdates = async vulnId => {
      try {
        const data = await VulnerabilityService.getVulnUpdates(vulnId);
        vulnUpdates.value = data.data.datas;
        vulnUpdates.value.forEach(vuln => {
          vuln.customFields = Utils.filterCustomFields(
            'vulnerability',
            currentVulnerability.category,
            customFields.value,
            vuln.customFields,
            vuln.locale
          );
        });
        if (vulnUpdates.value.length > 0) {
          currentUpdate.value = vulnUpdates.value[0]._id || null;
          currentLanguage.value = vulnUpdates.value[0].locale || null;
        }
      } catch (err) {
        console.log(err);
      }
    };

    const clone = row => {
      cleanCurrentVulnerability();
      Object.assign(currentVulnerability, _.cloneDeep(row));
      setCurrentDetails();
      vulnerabilityId.value = row._id;
      if (isAllowed('vulnerabilities:update')) getVulnUpdates(vulnerabilityId.value);
    };

    const editChangeCategory = category => {
      Dialog.create({
        title: t('msg.confirmCategoryChange'),
        message: t('msg.categoryChangingNotice'),
        ok: { label: t('btn.confirm'), color: 'negative' },
        cancel: { label: t('btn.cancel'), color: 'white' },
      }).onOk(() => {
        if (category) {
          currentVulnerability.category = category.name;
        } else {
          currentVulnerability.category = null;
        }
        setCurrentDetails();
      });
    };

    const cleanErrors = () => {
      errors.title = '';
    };

    const cleanCurrentVulnerability = () => {
      cleanErrors();
      currentVulnerability.cvssv3 = '';
      currentVulnerability.severity = '';
      currentVulnerability.urgency = '';
      currentVulnerability.details = [];
      currentLanguage.value = dtLanguage.value;
      if (currentCategory.value && currentCategory.value.name) {
        currentVulnerability.category = currentCategory.value.name;
      } else {
        currentVulnerability.category = null;
      }
      setCurrentDetails();
    };

    const setCurrentDetails = value => {
      let index = currentVulnerability.details.findIndex(obj => obj.locale === currentLanguage.value);
      if (index < 0) {
        const details = {
          locale: currentLanguage.value,
          title: '',
          vulnType: '',
          description: '',
          observation: '',
          remediation: '',
          references: [],
          customFields: []
        };
        details.customFields = Utils.filterCustomFields(
          'vulnerability',
          currentVulnerability.category,
          customFields.value,
          [],
          currentLanguage.value
        );
        currentVulnerability.details.push(details);
        index = currentVulnerability.details.length - 1;
      } else {
        currentVulnerability.details[index].customFields = Utils.filterCustomFields(
          'vulnerability',
          currentVulnerability.category,
          customFields.value,
          currentVulnerability.details[index].customFields,
          currentLanguage.value
        );
      }
      currentDetailsIndex.value = index;
    };

    const isTextInCustomFields = field => {
      if (currentVulnerability.details[currentDetailsIndex.value].customFields) {
        return (
          typeof currentVulnerability.details[currentDetailsIndex.value].customFields.find(f => {
            return f.customField === field.customField._id && f.text === field.text;
          }) === 'undefined'
        );
      }
      return false;
    };

    const getTextDiffInCustomFields = field => {
      let result = '';
      if (currentVulnerability.details[currentDetailsIndex.value].customFields) {
        currentVulnerability.details[currentDetailsIndex.value].customFields.find(f => {
          if (f.customField === field.customField._id) result = f.text;
        });
      }
      return result;
    };

    const getDtTitle = row => {
      const index = row.details.findIndex(obj => obj.locale === dtLanguage.value);
      if (index < 0 || !row.details[index].title) return t('err.notDefinedLanguage');
      else return row.details[index].title;
    };

    const getDtType = row => {
      const index = row.details.findIndex(obj => obj.locale === dtLanguage.value);
      if (index < 0 || !row.details[index].vulnType) return 'Undefined';
      else return row.details[index].vulnType;
    };

    const customSort = (rows, sortBy, descending) => {
      if (rows) {
        const data = [...rows];
        if (sortBy === 'type') {
          descending
            ? data.sort((a, b) => getDtType(b).localeCompare(getDtType(a)))
            : data.sort((a, b) => getDtType(a).localeCompare(getDtType(b)));
        } else if (sortBy === 'title') {
          descending
            ? data.sort((a, b) => getDtTitle(b).localeCompare(getDtTitle(a)))
            : data.sort((a, b) => getDtTitle(a).localeCompare(getDtTitle(b)));
        } else if (sortBy === 'category') {
          descending
            ? data.sort((a, b) => (b.category || t('noCategory')).localeCompare(a.category || t('noCategory')))
            : data.sort((a, b) => (a.category || t('noCategory')).localeCompare(b.category || t('noCategory')));
        }
        return data;
      }
    };

    const customFilter = (rows, terms, cols, getCellValue) => {
      const result =
        rows &&
        rows.filter(row => {
          const title = getDtTitle(row)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          const type = getDtType(row).toLowerCase();
          const category = (row.category || t('noCategory')).toLowerCase();
          const termTitle = (terms.title || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          const termCategory = (terms.category || '').toLowerCase();
          const termVulnType = (terms.type || '').toLowerCase();
          return (
            title.indexOf(termTitle) > -1 &&
            type.indexOf(termVulnType || '') > -1 &&
            category.indexOf(termCategory || '') > -1 &&
            (row.status === terms.valid || row.status === terms.new || row.status === terms.updates)
          );
        });
      filteredRowsCount.value = result.length;
      return result;
    };

    const goToAudits = row => {
      const title = getDtTitle(row);
      proxy.$router.push({ name: 'audits', params: { finding: title } });
    };

    const getVulnTitleLocale = (vuln, locale) => {
      for (let i = 0; i < vuln.details.length; i++) {
        if (vuln.details[i].locale === locale && vuln.details[i].title) return vuln.details[i].title;
      }
      return 'undefined';
    };

    const mergeVulnerabilities = async () => {
      try {
        await VulnerabilityService.mergeVulnerability(mergeVulnLeft.value, mergeVulnRight.value, mergeLanguageRight.value);
        getVulnerabilities();
        Notify.create({
          message: t('msg.vulnerabilityMergeOk'),
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

    const dblClick = row => {
      clone(row);
      if (isAllowed('vulnerabilities:update') && row.status === 2) proxy.$refs.updatesModal.show();
      else proxy.$refs.editModal.show();
    };

    onMounted(() => {
      getLanguages();
      getVulnerabilities();
      getVulnerabilityCategories();
      getCustomFields();
    });

    return {
      t,
      user,
      isAllowed,
      vulnerabilities,
      loading,
      pagination,
      rowsPerPageOptions,
      filteredRowsCount,
      languages,
      locale,
      search,
      errors,
      currentVulnerability,
      currentLanguage,
      displayFilters,
      dtLanguage,
      currentDetailsIndex,
      vulnerabilityId,
      vulnUpdates,
      currentUpdate,
      currentUpdateLocale,
      vulnTypes,
      mergeLanguageLeft,
      mergeLanguageRight,
      mergeVulnLeft,
      mergeVulnRight,
      vulnCategories,
      currentCategory,
      customFields,
      dtHeaders,
      vulnTypesLang,
      computedVulnerabilities,
      vulnCategoriesOptions,
      getLanguages,
      getCustomFields,
      getVulnTypes,
      _,
      getVulnerabilityCategories,
      getVulnerabilities,
      createVulnerability,
      updateVulnerability,
      deleteVulnerability,
      confirmDeleteVulnerability,
      getVulnUpdates,
      clone,
      editChangeCategory,
      cleanErrors,
      cleanCurrentVulnerability,
      setCurrentDetails,
      isTextInCustomFields,
      getTextDiffInCustomFields,
      getDtTitle,
      getDtType,
      customSort,
      customFilter,
      goToAudits,
      getVulnTitleLocale,
      mergeVulnerabilities,
      dblClick,
    };
  },
  components: {
    BasicEditor,
    Breadcrumb,
    TextareaArray,
    CustomFields,
  },
};