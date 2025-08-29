import type { RouterOutput, TPermission } from '~~/types';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  const loggedIn = ref(false);
  const accessToken = ref('');
  const id = ref('');
  const name = ref('');
  const displayName = ref('');
  const permissions = ref<TPermission[]>([]);
  const remainSubmitSongs = ref(0);
  const lastLoginAt = ref((''));

  const login = (data: RouterOutput['user']['login']) => {
    loggedIn.value = true;
    accessToken.value = data.accessToken;
    id.value = data.id;
    name.value = data.name ?? '';
    displayName.value = data.displayName ?? '';
    permissions.value = data.permissions ?? [];
    remainSubmitSongs.value = data.remainSubmitSongs ?? 0;
    lastLoginAt.value = (new Date(data.lastLoginAt)).toISOString();
  };

  const logout = () => {
    loggedIn.value = false;
    accessToken.value = '';
    id.value = '';
    name.value = '';
    displayName.value = '';
    remainSubmitSongs.value = 0;
    permissions.value = [];
    lastLoginAt.value = (new Date(0)).toISOString();
  };

  return {
    loggedIn,
    accessToken,
    id,
    name,
    displayName,
    remainSubmitSongs,
    permissions,
    lastLoginAt,
    login,
    logout,
  };
}, {
  persist: true,
});
