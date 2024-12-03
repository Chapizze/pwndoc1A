import { Notify, Dialog, QSpinnerGears } from 'quasar';

import BasicEditor from 'components/editor';
import Breadcrumb from 'components/breadcrumb';
import CvssCalculator from 'components/cvsscalculator'
import TextareaArray from 'components/textarea-array'
import CustomFields from 'components/custom-fields'
import AttachmentService from '@/services/attachment'
import AuditService from '@/services/audit';
import DataService from '@/services/data';
import UserService from '@/services/user';
import VulnService from '@/services/vulnerability';
import Utils from '@/services/utils';
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import _ from 'lodash';
import settings from '@/boot/settings';
import { socket } from '@/boot/socketio';
import { user } from '@/services/user';

export default {
  props: {
    frontEndAuditState: Number,
    parentState: String,
    parentApprovals: Array,
  },
  components: {
    BasicEditor,
    Breadcrumb,
    TextareaArray,
    CustomFields
  },
  setup(props) {
    const { t } = useI18n();
    const route = useRoute();
    const router = useRouter();
    const { proxy } = getCurrentInstance();

    const auditId = ref(route.params.auditId);
    const findingId = ref(route.params.findingId);
    const finding = reactive({});
    const findingOrig = reactive({});
    const selectedTab = ref("definition");
    const proofsTabVisited = ref(false);
    const detailsTabVisited = ref(false);
    const vulnTypes = ref([]);
    const AUDIT_VIEW_STATE = Utils.AUDIT_VIEW_STATE;
    const data = reactive({ isAttachement: true, fId: findingId.value });
    const currentTemplate = reactive({ name: '', file: '', ext: '' });
    const errors = reactive({ name: '', file: '' });
    const files = ref(null);
    const oldPickedFile = ref(null);
    const vulnCategories = ref([]);
    const attachments = ref([]);
    const audit = computed(() => proxy.$parent.$parent.audit);
    const sectionId = ref(null);

    const vulnTypesLang = computed(() => vulnTypes.value.filter(type => type.locale === audit.language));
    const screenshotsSize = computed(() => ((JSON.stringify(uploadedImages.value).length) / 1024).toFixed(2));
    const overrideLeaveCheck = ref(false);
    const transitionEnd = ref(true);
    const fieldHighlighted = ref("");
    const commentTemp = ref(null);
    const replyTemp = ref(null);
    const hoverReply = ref(null);
    const  commentDateOptions = ref({
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
    });
    
    const _listener = (e) => {
      if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) && e.keyCode == 83) {
        e.preventDefault();
        if (props.frontEndAuditState === AUDIT_VIEW_STATE.EDIT)
          updateFinding();
      }
    };

        // Get Vulnerabilities types
        getVulnTypes: function() {
            DataService.getVulnerabilityTypes()
            .then((data) => {
                this.vulnTypes = data.data.datas;
            })
            .catch((err) => {
                console.log(err)
            })
        },

        // Get Finding
        getFinding: function() {
            AuditService.getFinding(this.auditId, this.findingId)
            .then((data) => {
                this.finding = data.data.datas;
                if (this.finding.customFields && // For retrocompatibility with customField reference instead of object
                    this.finding.customFields.length > 0 && 
                    typeof (this.finding.customFields[0].customField) === 'string') 
                    this.finding.customFields = Utils.filterCustomFields('finding', this.finding.category, this.$parent.customFields, this.finding.customFields, this.$parent.audit.language)
                if (this.finding.paragraphs.length > 0 && !this.finding.poc)
                    this.finding.poc = this.convertParagraphsToHTML(this.finding.paragraphs)

                this.$nextTick(() => {
                    Utils.syncEditors(this.$refs)
                    this.findingOrig = this.$_.cloneDeep(this.finding); 
                })
            })
            .catch((err) => {
                if (!err.response)
                    console.log(err)
                else if (err.response.status === 403)
                    this.$router.push({name: '403', params: {error: err.response.data.datas}})
                else if (err.response.status === 404)
                    this.$router.push({name: '404', params: {error: err.response.data.datas}})
            })
        },

        // For retro compatibility with old paragraphs
        convertParagraphsToHTML: function(paragraphs) {
            var result = ""
            paragraphs.forEach(p => {
                result += `<p>${p.text}</p>`
                if (p.images.length > 0) {
                    p.images.forEach(img => {
                        result += `<img src="${img.image}" alt="${img.caption}" />`
                    })
                }
            })
            return result
        },

        // Update Finding
        updateFinding: function() {
            Utils.syncEditors(this.$refs)
            this.$nextTick(() => {
                var customFieldsEmpty = this.$refs.customfields && this.$refs.customfields.requiredFieldsEmpty()
                var defaultFieldsEmpty = this.requiredFieldsEmpty()
                if (customFieldsEmpty || defaultFieldsEmpty) {
                    Notify.create({
                        message: $t('msg.fieldRequired'),
                        color: 'negative',
                        textColor:'white',
                        position: 'top-right'
                    })
                    return
                }
                
                AuditService.updateFinding(this.auditId, this.findingId, this.finding)
                .then(() => {
                    this.findingOrig = this.$_.cloneDeep(this.finding);
                    Notify.create({
                        message: $t('msg.findingUpdateOk'),
                        color: 'positive',
                        textColor:'white',
                        position: 'top-right'
                    })
                    this.getFinding()
                })
                .catch((err) => {
                    Notify.create({
                        message: err.response.data.datas,
                        color: 'negative',
                        textColor:'white',
                        position: 'top-right'
                    })
                })
            })
        },

        deleteFinding: function() {
            Dialog.create({
                title: $t('msg.deleteFindingConfirm'),
                message: $t('msg.deleteFindingNotice'),
                ok: {label: $t('btn.confirm'), color: 'negative'},
                cancel: {label: $t('btn.cancel'), color: 'white'}
            })
            .onOk(() => {
                AuditService.deleteFinding(this.auditId, this.findingId)
                .then(() => {
                    Notify.create({
                        message: $t('msg.findingDeleteOk'),
                        color: 'positive',
                        textColor:'white',
                        position: 'top-right'
                    })
                    this.findingOrig = this.finding
                    this.overrideLeaveCheck = true
                    var currentIndex = this.$parent.audit.findings.findIndex(e => e._id === this.findingId)
                    if (this.$parent.audit.findings.length === 1)
                        this.$router.push(`/audits/${this.$parent.auditId}/findings/add`)
                    else if (currentIndex === this.$parent.audit.findings.length - 1)
                        this.$router.push(`/audits/${this.$parent.auditId}/findings/${this.$parent.audit.findings[currentIndex - 1]._id}`)
                    else
                        this.$router.push(`/audits/${this.$parent.auditId}/findings/${this.$parent.audit.findings[currentIndex + 1]._id}`)
                })
                .catch((err) => {
                    Notify.create({
                        message: err.response.data.datas,
                        color: 'negative',
                        textColor:'white',
                        position: 'top-right'
                    })
                })
            })
        },

         // Backup Finding to vulnerability database
        backupFinding: function() {
            Utils.syncEditors(this.$refs)
            VulnService.backupFinding(this.$parent.audit.language, this.finding)
            .then((data) => {
                Notify.create({
                    message: data.data.datas,
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
        },

        syncEditors: function() {
            this.transitionEnd = false
            Utils.syncEditors(this.$refs)
        },

        updateOrig: function() {
            this.transitionEnd = true
            if (this.selectedTab === 'proofs' && !this.proofsTabVisited){
                Utils.syncEditors(this.$refs)
                this.findingOrig.poc = this.finding.poc
                this.proofsTabVisited = true
            }
            else if (this.selectedTab === 'details' && !this.detailsTabVisited){
                Utils.syncEditors(this.$refs)
                this.findingOrig.remediation = this.finding.remediation
                this.detailsTabVisited = true
            }
        },

        toggleSplitView: function() {
            this.$parent.retestSplitView = !this.$parent.retestSplitView
            if (this.$parent.retestSplitView) {
                this.$parent.retestSplitRatio = 50
                this.$parent.retestSplitLimits = [40, 60]
            }
            else {
                this.$parent.retestSplitRatio = 100
                this.$parent.retestSplitLimits = [100, 100]
            }
        },

        // *** Comments Handling ***

    const toggleCommentView = () => {
        Utils.syncEditors(proxy.$refs)
        proxy.$parent.$parent.commentMode = !proxy.$parent.$parent.commentMode
        if (proxy.$parent.$parent.commentMode) {
            proxy.$parent.$parent.commentSplitRatio = 80
            proxy.$parent.$parent.commentSplitLimits = [80, 80]
        }
        else {
            proxy.$parent.$parent.commentSplitRatio = 100
            proxy.$parent.$parent.commentSplitLimits = [100, 100]
        }
    };

        focusComment: function(comment) {
            if (
                (!!this.$parent.editComment && this.$parent.editComment !== comment._id) || 
                (this.$parent.replyingComment && !comment.replyTemp) || 
                (this.$parent.focusedComment === comment._id)
            )
                return

            if (comment.findingId && this.findingId !== comment.findingId) {
                this.$router.replace({name: 'editFinding', params: {
                    auditId: this.auditId, 
                    findingId: comment.findingId, 
                    comment: comment
                }})
                return
            }

        if (comment.sectionId && sectionId.value !== comment.sectionId) {
            proxy.$router.replace({name: 'editSection', params: {
                auditId: this.auditId, 
                sectionId: comment.sectionId, 
                comment: comment
            }})
            return
        }

            let definitionFields = ["titleField", "typeField", "descriptionField", "observationField", "referencesField"]
            let detailsFields = ["affectedField", "cvssField", "remediationDifficultyField", "priorityField", "remediationField"]

        // Go to definition tab and scrollTo field
        if (selectedTab !== 'definition' && (definitionFields.includes(comment.fieldName) || comment.fieldName.startsWith('field-'))) {
            selectedTab.value = "definition"
        }
        else if (selectedTab !== 'poc' && comment.fieldName === 'pocField') {
            selectedTab.value = "proofs"
        }
        else if (selectedTab !== 'details' && detailsFields.includes(comment.fieldName)) {
            selectedTab.value = "details"
        }
        let checkCount = 0
        const intervalId = setInterval(() => {
            checkCount++
            if (document.getElementById(comment.fieldName)) {
                clearInterval(intervalId)
                nextTick(() => {
                    document.getElementById(comment.fieldName).scrollIntoView({block: "center"})
                })
            }
            else if (checkCount >= 10) {
                clearInterval(intervalId)
            }
        }, 100)

        fieldHighlighted.value = comment.fieldName
        proxy.$parent.focusedComment = comment._id

        },

    const createComment = (fieldName) => {
        let comment = {
            _id: 42,
            findingId: findingId.value,
            fieldName: fieldName,
            authorId: user.value.id,
            author: {
                firstname: user.value.firstname,
                lastname: user.value.lastname
            },
            text: "" 
        }
        if (proxy.$parent.editComment === 42){
            proxy.$parent.focusedComment = null
            proxy.$parent.$parent.audit.comments.pop()
        }
        proxy.fieldHighlighted = fieldName
        proxy.$parent.$parent.audit.comments.push(comment)
        proxy.$parent.editComment = 42
        proxy.focusComment(comment)
    };


        cancelEditComment: function(comment) {
            this.$parent.editComment = null
            if (comment._id === 42) {
                this.$parent.audit.comments.pop()
                this.fieldHighlighted = ""
            }
        },

    const deleteComment =  (comment) => {
        AuditService.deleteComment(auditId.value, comment._id)
        .then(() => {
            console.log(proxy.$parent)
            if (proxy.$parent.focusedComment === comment._id)
                fieldHighlighted = ""
        })
        .catch((err) => {
            Notify.create({
                message: err.response.data.datas,
                color: 'negative',
                textColor:'white',
                position: 'top-right'
            })
        })
    };

        updateComment: function(comment) {
            if (comment.textTemp)
                comment.text = comment.textTemp
            if (comment.replyTemp){
                comment.replies.push({
                    author: UserService.user.id,
                    text: comment.replyTemp
                })
            }
            if (comment._id === 42) { 
                AuditService.createComment(this.auditId, comment)
                .then((res) => {
                    let newComment = res.data.datas
                    this.$parent.editComment = null
                    this.$parent.focusedComment = newComment._id
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
            else {
                
                AuditService.updateComment(this.auditId, comment)
                .then(() => {
                    this.$parent.editComment = null
                    this.$parent.editReply = null
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

        removeReplyFromComment: function(reply, comment) {
            comment.replies = comment.replies.filter(e => e._id !== reply._id)
            this.updateComment(comment)
        },

        displayComment: function(comment) {
            let response = true
            if ((this.$parent.commentsFilter === 'active' && comment.resolved)|| (this.$parent.commentsFilter === 'resolved' && !comment.resolved))
                response = false
            return response
        },

    const numberOfFilteredComments = () => {
        let count = proxy.$parent.$parent.audit.comments.length
        if (proxy.$parent.commentsFilter === 'active')
            count = proxy.$parent.$parent.audit.comments.filter(e => !e.resolved).length
        else if (proxy.$parent.commentsFilter === 'resolved')
            count = proxy.$parent.$parent.audit.comments.filter(e => e.resolved).length
        
        if (count === 1)
            return `${count} ${t('item')}`
        else
            return `${count} ${t('items')}`
    };

    const unsavedChanges = () => {
      if (finding.title !== findingOrig.title)
        return true;
      if ((finding.vulnType || findingOrig.vulnType) && finding.vulnType !== findingOrig.vulnType)
        return true;
      if ((finding.issueBackground || findingOrig.issueBackground) && finding.issueBackground !== findingOrig.issueBackground)
        return true;
      if ((finding.CvssScoreAma || findingOrig.CvssScoreAma) && finding.CvssScoreAma !== findingOrig.CvssScoreAma)
        return true;
      if (!_.isEqual(finding.remediationBackground, findingOrig.remediationBackground))
        return true;
      if (!_.isEqual(finding.customFields, findingOrig.customFields))
        return true;
      if ((finding.request || findingOrig.request) && finding.request !== findingOrig.request)
        return true;
      if ((finding.response || findingOrig.response) && finding.response !== findingOrig.response)
        return true;
      if ((finding.cvssv3 || findingOrig.cvssv3) && finding.cvssv3 !== findingOrig.cvssv3)
        return true;
      if ((finding.urgency || findingOrig.urgency) && finding.urgency !== findingOrig.urgency)
        return true;
      if ((finding.severity || findingOrig.severity) && finding.severity !== findingOrig.severity)
        return true;
      if ((finding.remediationDetails || findingOrig.remediationDetails) && finding.remediationDetails !== findingOrig.remediationDetails)
        return true;
      if ((finding.issueDetails || findingOrig.issueDetails) && finding.issueDetails !== findingOrig.issueDetails)
        return true;
      if (finding.status !== findingOrig.status)
        return true;

      return false;
    };

    const displayHighlightWarning = () => {
        if (overrideLeaveCheck)
            return null

        if (!proxy.settings.report.enabled || !proxy.settings.report.public.highlightWarning)
            return null

        var matchString = `(<mark data-color="${proxy.settings.report.public.highlightWarningColor}".+?>.+?)</mark>`
        var regex = new RegExp(matchString)
        var result = ""

        result = regex.exec(finding.description)
        if (result && result[1])
            return (result[1].length > 119) ? "<b>Description</b><br/>"+result[1].substring(0,119)+'...' : "<b>Description</b><br/>"+result[1]
        result = regex.exec(finding.observation)
        if (result && result[1])
            return (result[1].length > 119) ? "<b>Observation</b><br/>"+result[1].substring(0,119)+'...' : "<b>Observation</b><br/>"+result[1]
        result = regex.exec(finding.poc)
        if (result && result[1])
            return (result[1].length > 119) ? "<b>Proofs</b><br/>"+result[1].substring(0,119)+'...' : "<b>Proofs</b><br/>"+result[1]
        result = regex.exec(finding.remediation)
        if (result && result[1])
            return (result[1].length > 119) ? "<b>Remediation</b><br/>"+result[1].substring(0,119)+'...' : "<b>Remediation</b><br/>"+result[1]
        

        if (finding.customFields && finding.customFields.length > 0) {
            for (let i in finding.customFields) {
                let field = finding.customFields[i]
                if (field.customField && field.text && field.customField.fieldType === "text") {
                    result = regex.exec(field.text)
                    if (result && result[1])
                        return (result[1].length > 119) ? `<b>${field.customField.label}</b><br/>`+result[1].substring(0,119)+'...' : `<b>${field.customField.label}</b><br/>`+result[1]
                }
            }
        }
        
        return null
    };

    const requiredFieldsEmpty = () => {
        var hasErrors = false

        if (proxy.$refs.titleField) {
            proxy.$refs.titleField.validate()
            hasErrors = hasErrors || proxy.$refs.titleField.hasError
        }
        if (proxy.$refs.typeField) {
            proxy.$refs.typeField.validate()
            hasErrors = hasErrors || proxy.$refs.typeField.hasError
        }
        if (proxy.$refs.descriptionField) {
            proxy.$refs.descriptionField.validate()
            hasErrors = hasErrors || proxy.$refs.descriptionField.hasError
        }
        if (proxy.$refs.observationField) {
            proxy.$refs.observationField.validate()
            hasErrors = hasErrors || proxy.$refs.observationField.hasError
        }
        if (proxy.$refs.referencesField) {
            proxy.$refs.referencesField.validate()
            hasErrors = hasErrors || proxy.$refs.referencesField.hasError
        }
        if (proxy.$refs.pocField) {
            proxy.$refs.pocField.validate()
            hasErrors = hasErrors || proxy.$refs.pocField.hasError
        }
        if (proxy.$refs.affectedField) {
            proxy.$refs.affectedField.validate()
            hasErrors = hasErrors || proxy.$refs.affectedField.hasError
        }
        if (proxy.$refs.remediationDifficultyField) {
            proxy.$refs.remediationDifficultyField.validate()
            hasErrors = hasErrors || proxy.$refs.remediationDifficultyField.hasError
        }
        if (proxy.$refs.priorityField) {
            proxy.$refs.priorityField.validate()
            hasErrors = hasErrors || proxy.$refs.priorityField.hasError
        }
        if (proxy.$refs.remediationField) {
            proxy.$refs.remediationField.validate()
            hasErrors = hasErrors || proxy.$refs.remediationField.hasError
        }

        return hasErrors
    };

    onMounted(() => {
      getFinding();
      getVulnerabilityCategories();
      socket.emit('menu', { menu: 'editFinding', finding: findingId.value, room: auditId.value });
      syncEditors();
      updateOrig();

      // save on ctrl+s
      document.addEventListener('keydown', _listener, false);
      proxy.$parent.focusedComment = null
      if (proxy.$route.params.comment)
          proxy.focusComment(proxy.$route.params.comment)
    });

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', _listener, false);
    });

    watch(() => route.params, (newParams, oldParams) => {
      if (unsavedChanges()) {
        Dialog.create({
          title: t('msg.thereAreUnsavedChanges'),
          message: t('msg.doYouWantToLeave'),
          ok: { label: t('btn.confirm'), color: 'negative' },
          cancel: { label: t('btn.cancel'), color: 'white' }
        })
          .onOk(() => {
            next();
          });
      } else {
        next();
      }

      
    });

    return {
      t,
      auditId,
      findingId,
      finding,
      user,
      findingOrig,
      selectedTab,
      proofsTabVisited,
      detailsTabVisited,
      vulnTypes,
      AUDIT_VIEW_STATE,
      data,
      currentTemplate,
      errors,
      files,
      oldPickedFile,
      audit,
      vulnCategories,
      attachments,
      vulnTypesLang,
      screenshotsSize,
      overrideLeaveCheck,
      transitionEnd,
      fieldHighlighted,
      commentTemp,
      replyTemp,
      hoverReply,
      commentDateOptions,
      attachments,
      _listener,
      getVulnTypes,
      cleanFiles,
      getVulnerabilityCategories,
      downloadAttachement,
      printPositiveMessage,
      printNegativeMessage,
      deleteAttachement,
      updateFiles,
      handleFile,
      getFinding,
      convertParagraphsToHTML,
      updateFinding,
      deleteFinding,
      backupFinding,
      syncEditors,
      updateOrig,
      unsavedChanges,
      requiredFieldsEmpty,
      toggleCommentView,
      numberOfFilteredComments,
      createComment,
      displayComment,
      deleteComment,
      updateComment,
      focusComment,
      removeReplyFromComment,
      cancelEditComment,
      displayHighlightWarning
    };
  }
}