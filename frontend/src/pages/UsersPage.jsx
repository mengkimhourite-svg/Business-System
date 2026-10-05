import { useMemo } from "react";
import { UserCog, Phone } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { ResourcePage } from "../components/data-display/ResourcePage.jsx";
import { StatusBadge } from "../components/data-display/StatusBadge.jsx";
import { Avatar, Badge } from "../components/ui/index.js";

const STATUS_OPTIONS = [
  { value: "active", labelKey: "status.active" },
  { value: "inactive", labelKey: "status.inactive" },
];

export default function UsersPage() {
  const { user } = useAuth();

  const config = useMemo(
    () => ({
      resource: "users",
      itemKey: "users.item",
      titleKey: "users.title",
      descriptionKey: "users.subtitle",
      addLabelKey: "users.add",
      emptyTitleKey: "users.empty",
      emptyHintKey: "users.emptyHint",
      icon: UserCog,
      lookups: ["roles", "branches"],
      canDeleteRow: (row) => row.id !== user?.id,
      columns: [
        { key: "id", labelKey: "common.id", sortable: true, render: (r) => <span className="font-mono text-xs text-fg-secondary">{r.id}</span> },
        {
          key: "name",
          labelKey: "common.name",
          primary: true,
          sortable: true,
          render: (r, { t }) => (
            <div className="min-w-0">
              <p className="truncate font-medium text-fg">
                {r.name}
                {r.id === user?.id && <span className="ml-1.5 text-xs font-normal text-fg-muted">({t("users.you")})</span>}
              </p>
              <p className="truncate text-xs text-fg-muted">{r.email}</p>
            </div>
          ),
        },
        { key: "avatar", labelKey: "common.image", render: (r) => <Avatar src={r.avatar} name={r.name} size="md" /> },
        { key: "role_name", labelKey: "common.role", sortable: true, align: "center", render: (r) => <Badge variant="primary">{r.role_name}</Badge> },
        { key: "branch_name", labelKey: "common.branch", sortable: true, hideOnMobile: true },
        { key: "phone", labelKey: "common.phone", hideOnMobile: true, render: (r) => <span className="inline-flex items-center gap-1.5 tabular"><Phone className="h-3.5 w-3.5 text-fg-muted" />{r.phone}</span> },
        { key: "status", labelKey: "common.status", sortable: true, align: "center", render: (r) => <StatusBadge status={r.status} /> },
        { key: "last_active_at", labelKey: "users.lastActive", sortable: true, render: (r, { fmt }) => <span className="text-fg-secondary">{fmt.relative(r.last_active_at)}</span> },
      ],
      filters: [
        { key: "role_id", labelKey: "common.role", optionsFrom: "roles" },
        { key: "branch_id", labelKey: "common.branch", optionsFrom: "branches" },
        { key: "status", labelKey: "common.status", options: STATUS_OPTIONS },
      ],
      form: {
        defaults: { status: "active" },
        validate: (values, t, mode) => {
          const errs = {};
          if ((mode === "create" || values.password) && values.password !== values.password_confirmation) errs.password_confirmation = t("validation.passwordMatch");
          return errs;
        },
        sections: [
          {
            titleKey: "users.personalInfo",
            fields: [
              { name: "name", labelKey: "users.fullName", type: "text", required: true },
              { name: "email", labelKey: "common.email", type: "email", required: true },
              { name: "phone", labelKey: "common.phone", type: "tel" },
              { name: "avatar", labelKey: "common.imageUrl", type: "image" },
            ],
          },
          {
            titleKey: "users.accountInfo",
            fields: [
              { name: "role_id", labelKey: "common.role", type: "select", optionsFrom: "roles", required: true },
              { name: "branch_id", labelKey: "common.branch", type: "select", optionsFrom: "branches" },
              { name: "status", labelKey: "common.status", type: "select", options: STATUS_OPTIONS, required: true },
              { name: "password", labelKey: "common.password", type: "password", required: (mode) => mode === "create", minLength: 6, hintKey: "users.passwordHint" },
              { name: "password_confirmation", labelKey: "users.confirmPassword", type: "password", transient: true, required: (mode) => mode === "create" },
            ],
          },
        ],
      },
    }),
    [user?.id]
  );

  return <ResourcePage config={config} />;
}
