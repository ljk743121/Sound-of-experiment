import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~~/server/trpc/routers';

export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;

export type TPermission =
  'login' | // login to home page
  'admin' | // visit the admin page
  'review' | // review songs
  'arrange' | // arrange songs
  'time' | // set opening time
  'blockWords' | // manage block words
  'manageUser' | // manage users (listing, banning, ...)
  'announcement'; //manage announcement

export type TSongState = 'pending' | 'approved' | 'rejected' | 'used' | 'dropped';

export type TIdentity = 'student' | 'teacher' | 'admin' | 'host' | 'superadmin' | 'retiree' | 'grad';

export type TSubmitType = 'realName' | 'anonymous' | 'alias';

export type TMediaSource = 'wy' | 'tx';