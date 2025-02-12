export default defineNuxtRouteMiddleware(() => {
  const user = useUserStore();
  if (user.loggedIn && user.accessToken) {
    return navigateTo('/');
  }
});
