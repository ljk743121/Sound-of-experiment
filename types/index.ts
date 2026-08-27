import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { InferSelectModel } from "drizzle-orm";
import type { users } from "~~/server/db/schema";
import type { AppRouter } from "~~/server/trpc/routers";

export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;

export type User = InferSelectModel<typeof users>;
export type TMediaSource =
  | "wy"
  | "tx"
  | "bilibili"
  | "custom";
export interface TSong {
  id: string;
  name: string;
  artists: string;
  album?: string;
  source: TMediaSource;
  imgId: string;
  duration: number;
};

export type TSongState = "pending" | "approved" | "rejected" | "used" | "played" | "dropped" | "missed" | "failed";

export type TPermission =
  | "login" // login to home page
  | "admin" // visit the admin page
  | "review" // review songs
  | "arrange" // arrange songs
  | "deleteArrangement"
  | "time" // set opening time
  | "blockWords" // manage block words
  | "manageUser" // manage users (listing, banning, ...)
  | "deleteUser"
  | "editPermissions"
  | "resetPassword"
  | "announcement" // manage announcement
  | "deleteSong"
  | "robot"
  | "config"
  | "manualArrange";

export type TSubmitType = "realName" | "anonymous" | "alias";

// for vue-music-flow
export interface TMusicFlow {
  id: number;
  audio: string;
  title: string;
  artist: string;
  artwork: string;
  album: string;
  original?: Record<string, unknown>;
}
