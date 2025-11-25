import type { FeatureAccess } from "../../src/types/accessControl";

export const featureAccessSeed: FeatureAccess[] = [
  {
    id: "controlPanelAccessFeatures",
    route: "/access",
    area: "controlPanel",
    titleKey: "nav.controlPanel.access",
    status: "logged_in",
    minRole: "admin",
    allowedRoles: ["admin"],
    allowedGroups: [],
    allowedUserIds: [],
    showInTopbar: false,
    showInSidebar: true,
    navOrder: 60,
    isExperimental: false,
  },
];
