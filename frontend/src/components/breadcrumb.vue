<template>
    <q-bar class="card-breadcrumb" :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark'">
        <template v-if="path">
            <q-btn 
                :to="path" 
                :label="pathName" 
                no-caps 
                dense 
                flat 
                :color="$q.dark.isActive ? 'secondary' : 'primary'" 
                icon="arrow_back" 
            />
            <q-separator 
                class="q-mr-sm" 
                vertical 
                inset 
                :color="$q.dark.isActive ? 'grey-6' : 'grey-4'"
            />
        </template>
        <span class="text-bold">{{title}}</span>
        <div v-if="this.$settings?.reviews.enabled && state !== 'EDIT'">
            <audit-state-icon 
                class="q-mx-sm" 
                :approvals="approvals" 
                :state="state"
            />
        </div>
        <q-space />
        <slot name="buttons"></slot>
    </q-bar>
</template>

<script>
import AuditStateIcon from 'components/audit-state-icon';

export default {
    name: 'breadcrumb',
    props: ['buttons', 'title', 'approvals', 'state', 'path', 'pathName'],

    components: {
        AuditStateIcon
    }
}
</script>

<style lang="stylus">
.card-breadcrumb {
    height: 50px
    padding-right: 20px
    font-size: 14px
    transition: background-color 0.3s, color 0.3s
}

.card-breadcrumb .q-btn {
    font-size: 14px
}

.breadcrumb-title {
    margin-top: 11px
}

.breadcrumb-buttons {
    margin-top: 7px
}

.card-breadcrumb>.q-breadcrumbs {
    margin-top: 17px
}

.approvedMark {
    margin-left: 10px;
    font-size: 1.25em!important;
}
</style>