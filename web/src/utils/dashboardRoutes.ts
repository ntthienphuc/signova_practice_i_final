import type { AppTab } from "../types/learn";

export function pathToTab(pathname: string): AppTab {
  if (pathname.endsWith('/review'))   return "review";
  if (pathname.endsWith('/progress')) return "progress";
  if (pathname.endsWith('/account'))  return "account";
  if (pathname.endsWith('/family'))   return "family";
  if (pathname.endsWith('/mascot'))   return "mascot";
  if (pathname.endsWith('/school'))   return "school";
  if (pathname.endsWith('/story'))    return "story";
  if (pathname.endsWith('/custom'))   return "custom_package";
  return "learn";
}

export function tabToPath(tab: AppTab): string {
  if (tab === "learn") return "/learn-dashboard";
  if (tab === "custom_package") return "/learn-dashboard/custom";
  if (tab === "story") return "/learn-dashboard/story";
  return `/learn-dashboard/${tab}`;
}
