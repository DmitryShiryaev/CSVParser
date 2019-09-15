import Vue from 'vue'
import App from './App.vue'
import 'element-ui/lib/theme-chalk/index.css';
import ElementUI from 'element-ui';

Vue.config.productionTip = false
Vue.use(ElementUI);

import elementLangRu from 'element-ui/lib/locale/lang/ru-RU';
import elementLocale from 'element-ui/lib/locale';
elementLocale.use(elementLangRu);

new Vue({
  render: h => h(App),
}).$mount('#app')
