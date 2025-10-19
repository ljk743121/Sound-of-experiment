// fix pinia
export default defineNuxtRouteMiddleware((to) => {
  if (to.matched.length === 0) {
    return navigateTo("/404");
  }
});
