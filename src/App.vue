<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <csv-load-form/>
  </div>
</template>

<script>
import CsvLoadForm from'./components/CsvLoadForm'

export default {
  name: 'app',
  components: {
    CsvLoadForm
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
