import type { AccessGroup } from "../../src/types/accessControl";

export const accessGroupsSeed: AccessGroup[] = [
  {
    id: "beta_testers",
    label: "Beta Testers",
    description: "Users who get access to beta features before public release.",
    userIds: [],
    minRole: "user",
    allowedRoles: ["user", "moderator", "developer", "admin"],
    isSystem: true,
  },
  {
    id: "dev_team",
    label: "Developer Team",
    description: "Internal developers who can access dev-only tools and debug views.",
    userIds: [],
    minRole: "developer",
    allowedRoles: ["developer", "admin"],
    isSystem: true,
  },
  {
    id: "creator_program",
    label: "Creator Program",
    description: "Content creators with extra tools and stats.",
    userIds: [],
    minRole: "user",
    allowedRoles: ["user", "moderator", "developer", "admin"],
    isSystem: false,
  },
];
