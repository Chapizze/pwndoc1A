import Lodash from 'lodash'
import { createApp } from 'vue';
import App from '../App.vue';

const app = createApp(App);

app.config.globalProperties.$_ = Lodash;