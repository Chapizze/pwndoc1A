import { Notify } from 'quasar';
import { ref, reactive, computed, onMounted, watch, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import _ from 'lodash';

import Breadcrumb from 'components/breadcrumb';

import VulnService from '@/services/vulnerability';
import AuditService from '@/services/audit';
import DataService from '@/services/data';
import Utils from '@/services/utils';

import { $t } from '@/boot/i18n'

export default {
  components: {
    Breadcrumb,
  },
  props: {
    frontEndAuditState: Number,
    parentState: String,
    parentApprovals: Array,
    parentAudit: Object,
    parentCustomFields: Array,
  },
  setup(props) {
    const { t } = useI18n();
    const route = useRoute();
    const audit = ref({});
    const proxy = getCurrentInstance();
    const auditId = ref(route.params.auditId);
    const finding = reactive({});
    const findingTitle = ref('');
    const vulnerabilities = ref([]);
    const loading = ref(true);
    const vulnPagination = reactive({
      page: 1,
      rowsPerPage: 25,
      sortBy: 'title',
    });
    const rowsPerPageOptions = ref([
      { label: '25', value: 25 },
      { label: '50', value: 50 },
      { label: '100', value: 100 },
      { label: 'All', value: 0 },
    ]);
    const filteredRowsCount = ref(0);
    const search = reactive({ title: '', category: '' });
    const languages = ref([{ locale: 'eng', language: 'English' }]);
    const dtLanguage = ref('');
    const currentExpand = ref(-1);
    const vulnCategories = ref([]);
    const htmlEncode = Utils.htmlEncode;
    const AUDIT_VIEW_STATE = Utils.AUDIT_VIEW_STATE;

    const dtVulnHeaders = computed(() => [
      { name: 'title', label: t('title'), field: (row) => row.detail.title, align: 'left', sortable: true },
      { name: 'category', label: t('category'), field: 'category', align: 'left', sortable: true },
      { name: 'action', label: '', field: 'action', align: 'left', sortable: false },
    ]);

    const vulnCategoriesOptions = computed(() => _.uniq(_.map(vulnerabilities.value, (vuln) => vuln.category)));
    const vulnTypeOptions = computed(() => _.uniq(_.map(vulnerabilities.value, (vuln) => vuln.detail.vulnType || t('undefined'))));

    const pagesNumber = computed(() => {
      return Math.ceil(filteredRowsCount.value / vulnPagination.rowsPerPage);
    });

    const getLanguages = async () => {
      try {
        const data = await DataService.getLanguages();
        languages.value = data.data.datas;
      } catch (err) {
        console.log(err);
      }
    };

        // Get vulnerabilities by language
        getVulnerabilities: function() {
            this.loading = true
            VulnService.getVulnByLanguage(this.dtLanguage)
            .then((data) => {
                this.vulnerabilities = data.data.datas;
                this.loading = false
            })
            .catch((err) => {
                console.log(err)
            })
        },

        // Get available vulnerability categories
        getVulnerabilityCategories: function() {
            DataService.getVulnerabilityCategories()
            .then((data) => {
                this.vulnCategories = data.data.datas;
            })
            .catch((err) => {
                console.log(err)
            })
        },

        getDtTitle: function(row) {
            var index = row.details.findIndex(obj => obj.locale === this.dtLanguage.locale);
            if (index < 0)
                return $t('err.notDefinedLanguage');
            else
                return row.details[index].title;         
        },

        customFilter: function(rows, terms, cols, getCellValue) {
            var result = rows && rows.filter(row => {
                var title = (row.detail.title || $t('err.notDefinedLanguage')).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                var type = (row.detail.vulnType || $t('undefined')).toLowerCase()
                var category = (row.category || $t('noCategory')).toLowerCase()
                var termTitle = (terms.title || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                var termCategory = (terms.category || "").toLowerCase()
                var termVulnType = (terms.vulnType || "").toLowerCase()
                return title.indexOf(termTitle) > -1 && 
                type.indexOf(termVulnType) > -1 &&
                category.indexOf(termCategory) > -1
            })
            this.filteredRowsCount = result.length
            this.filteredRows = result
            return result;
        },

        addFindingFromVuln: function(vuln) {
            var finding = null;
            if (vuln) {
                finding = {
                    title: vuln.detail.title,
                    vulnType: vuln.detail.vulnType,
                    description: vuln.detail.description,
                    observation: vuln.detail.observation,
                    remediation: vuln.detail.remediation,
                    remediationComplexity: vuln.remediationComplexity,
                    priority: vuln.priority,
                    references: vuln.detail.references,
                    cvssv3: vuln.cvssv3,
                    category: vuln.category,
                    customFields: Utils.filterCustomFields('finding', vuln.category, this.$parent.customFields, vuln.detail.customFields, this.$parent.audit.language)
                };
            }

            if (finding) {
                AuditService.createFinding(this.auditId, finding)
                .then(() => {
                    this.findingTitle = "";
                    Notify.create({
                        message: $t('msg.findingCreateOk'),
                        color: 'positive',
                        textColor:'white',
                        position: 'top-right'
                    })
                })
                .catch((err) => {
                    Notify.create({
                        message: err.response.data.datas,
                        color: 'negative',
                        textColor:'white',
                        position: 'top-right'
                    })
                })
            }
        },

    const addFinding = async (category) => {
      let finding = null;
      if (category && findingTitle.value) {
        finding = {
          title: findingTitle.value,
          vulnType: '',
          description: '',
          CvssScoreAma: '',
          remediationDetails: '',
          issueDetails: '',
          urgency: '',
          severity: '',
          remediationBackground: '',
          cvssv3: '',
          category: category.name,
          customFields: Utils.filterCustomFields('finding', category.name, props.parentCustomFields, [], languages.value),
        };
      } else if (findingTitle.value) {
        finding = {
          title: findingTitle.value,
          vulnType: '',
          description: '',
          CvssScoreAma: '',
          remediationDetails: '',
          issueDetails: '',
          urgency: '',
          severity: '',
          remediationBackground: '',
          cvssv3: '',
          customFields: Utils.filterCustomFields('finding', '', props.parentCustomFields, [], languages.value),
        };
        console.log(proxy)
        proxy.$parent.getAudit();
      }

      if (finding) {
        try {
          await AuditService.createFinding(auditId.value, finding);
          findingTitle.value = '';
          Notify.create({
            message: t('msg.findingCreateOk'),
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
      }
      proxy.$parent.getAudit();
    };

    watch(

    );

    onMounted(() => {
      getLanguages();
      getVulnerabilities();
      getVulnerabilityCategories();
      socket.emit('menu', { menu: 'addFindings', room: auditId.value });
    });

    return {
      t,
      auditId,
      finding,
      findingTitle,
      vulnerabilities,
      loading,
      vulnPagination,
      rowsPerPageOptions,
      filteredRowsCount,
      search,
      languages,
      dtLanguage,
      currentExpand,
      vulnCategories,
      htmlEncode,
      AUDIT_VIEW_STATE,
      dtVulnHeaders,
      vulnCategoriesOptions,
      vulnTypeOptions,
      pagesNumber,
      getLanguages,
      getVulnerabilities,
      getVulnerabilityCategories,
      getDtTitle,
      customFilter,
      addFindingFromVuln,
      addFinding,
    };
  },
};