import sso from '../../config/config.json'

var isSSO = sso.isSSO;


export default [
  {path: '/', component: () => import('layouts/home'), meta: {breadcrumb: 'Home'}, children: [
    {path: '', redirect: 'audits' },
    {path: 'audits', component: () => import('pages/audits'), meta: {breadcrumb: 'Audits'}, children: [
      {path: '', name:'audits', component: () => import('pages/audits/list')},
      {path: ':auditId', name: 'AuditDetail', component: () => import('pages/audits/edit'), meta: {breadcrumb: 'Edit Audit'}, children: [
        {path: '', redirect: 'general'},
        {path: 'general', name:'general', component: () => import('pages/audits/edit/general')},
        {path: 'network', name: 'network', component: () => import('pages/audits/edit/network')},
        {path: 'findings/add', name: 'addFindings', component: () => import('pages/audits/edit/findings/add')},
        {path: 'findings/:findingId', name: 'editFinding', component: () => import('pages/audits/edit/findings/edit')},
        {path: 'sections/:sectionId', name: 'editSection', component: () => import('pages/audits/edit/sections')}
      ]}
    ]},
    {path: 'data', component: () => import('pages/data'), meta: {breadcrumb: 'Datas'}, children: [
      {path: '', redirect: 'collaborators'},
      {path: 'collaborators', component: () => import('pages/data/collaborators')},
      {path: 'companies', component: () => import('pages/data/companies')},
      {path: 'clients', component: () => import('pages/data/clients')},
      {path: 'templates', component: () => import('pages/data/templates')},   
      {path: 'dump', component: () => import('pages/data/dump')},
      {path: 'custom', component: () => import('pages/data/custom')}
    ]},
    {path: 'vulnerabilities', component: () => import('pages/vulnerabilities'), meta: {breadcrumb: 'Vulnerabilities'}},
    {path: 'stats', component: () => import ('pages/stats')},
    {path: 'profile', component: () => import('pages/profile')},
    {path: 'settings', component: () => import('pages/settings')},
    {path: '403', name: '403', component: () => import('pages/403')},
    {path: '404', name: '404', component: () => import('pages/404')}
  ]},
  {
    path: '/login',
    component: () => import('pages/login'),
    beforeEnter: (to, from, next) => {
      if (isSSO) {
        next('/sso-login-forward'); // Redirect to SSO forward if SSO is true
      } else {
        next(); // Allow navigation if SSO is false
      }
    }
  },
  {
    path: '/sso-login-forward', component: () => {
      window.location.href = '/api/sso';
    }
      // Redirect to your backend SSO endpoint
      // No need for next() here as we are leaving the SPA
  },
  {
    path: '/:catchAll',
    redirect: (to) => {
      if (isSSO) {
        return '/sso-login-forward'; // Redirect to SSO login
      } else {
        return '/login'; // Redirect to regular login
      }
    }
  }
]
