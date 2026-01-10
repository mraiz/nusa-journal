<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <CommonToastContainer />
  </div>
</template>

<script setup>
  // Enable smooth page transitions
  const route = useRoute()

  // Set page transition
  useHead({
    bodyAttrs: {
      class: 'font-sans',
    },
  })
</script>

<style>
  .page-enter-active,
  .page-leave-active {
    transition: all 0.3s;
  }
  .page-enter-from,
  .page-leave-to {
    opacity: 0;
    filter: blur(1rem);
  }
</style>
