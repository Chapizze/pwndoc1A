<template src='./general.html'></template>

<script src='./general.js'></script>

<style>
  .custom-active-item {
	/* Subtle background for active state */
	background-color: rgba(0, 0, 0, 0.05) !important;
  }
  
  body.body--dark .custom-active-item {
	/* Dark mode: very subtle light gray with some opacity */
	background-color: rgba(255, 255, 255, 0.1) !important;
  }
</style>