"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { MainLayout } from "@/components/common";
import { Card, Button, Table, SearchInput, Text } from "@/components/common";
import PageHeader from "@/components/PageHeader";
import Pagination from "@/components/Pagination";
import AddManagedUserModal from "@/components/AddAccountOfficerFormModal";
import PreviewAccountOfficerModal from "@/components/PreviewAccountOfficerModal";
import OfficerDetailsModal from "@/components/OfficerDetailsModal";
import SuccessModal from "@/components/SuccessModal";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useOfficers } from "@/hooks/api/useOfficer";
import { usePagination, getAppliedPageSize } from "@/hooks/usePagination";
import { useAuthStore } from "@/store/auth.store";
import plus from "@/assets/icons/plus.svg";
import { formatRegion } from "@/utils/formatter";
import { safeText, safeNumber, safeDateText } from "@/utils/safe";
import {
  formatRole,
  formatRoleScope,
  ROLE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/constants/roles";
import type { CreateOfficerResponse } from "@/lib/api/types";
import ArrowBack from "@/components/common/ArrowBack";

/** One row of the managed-users table */
interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  /** Wire value behind the label, e.g. "OFFICER" */
  roleValue: string;
  region: string;
  phoneNo: string;
  customers: number;
  status: string;
  lastLogin: string;
  deactivatedAt: string;
  createdAt: string;
  isActive: boolean;
  action: string;
}

const tableColumns = [
  { key: "name" as const, title: "NAME" },
  { key: "email" as const, title: "EMAIL" },
  { key: "role" as const, title: "ROLE" },
  { key: "region" as const, title: "REGION" },
  { key: "phoneNo" as const, title: "PHONE NO" },
  { key: "status" as const, title: "STATUS" },
  { key: "lastLogin" as const, title: "LAST LOGIN" },
  { key: "deactivatedAt" as const, title: "DEACTIVATED" },
  { key: "action" as const, title: "ACTION" },
];

/**
 * Users - every internally managed staff account in one place.
 *
 * Backed by GET /admin/officers?managed=true, which returns all four managed
 * roles at once. That flag is ADMIN-only and is silently ignored for a
 * regional admin, who gets their own region's officers back instead - the
 * screen is hidden from them in the sidebar, but the API is the real control.
 */
function ManagedUsersContent() {
  const { user } = useAuthStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [successKind, setSuccessKind] = useState<"created" | "status">(
    "created",
  );
  const [credentialsEmailSent, setCredentialsEmailSent] = useState(true);

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [detailsRow, setDetailsRow] = useState<UserRow | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  // "" on either filter means the param is not sent at all
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const {
    currentPage,
    pageSize: itemsPerPage,
    setPageSize,
    previousPage,
    nextPage,
    resetPage,
  } = usePagination();

  /**
   * `managed` overrides `role` server-side, so a role filter has to drop the
   * managed flag and query that one role instead.
   */
  const listParams = {
    page: currentPage,
    pageSize: itemsPerPage,
    search: searchTerm || undefined,
    isActive: statusFilter === "" ? undefined : statusFilter === "true",
  };

  const { data, isLoading, error } = useOfficers(
    roleFilter
      ? { ...listParams, role: roleFilter }
      : { ...listParams, managed: true },
  );

  const rows = data?.data;

  const tableData: UserRow[] = useMemo(() => {
    if (!rows) return [];

    return rows.map((row) => {
      const roleValue = safeText(row.role, "OFFICER");
      const isActive = row.isActive !== false;

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: formatRole(roleValue),
        roleValue,
        region: formatRoleScope(roleValue, formatRegion(row.region)),
        phoneNo: safeText(row.phone),
        customers: safeNumber(row._count?.customers, 0),
        status: isActive ? "Active" : "Inactive",
        lastLogin: row.lastLoginAt ? safeDateText(row.lastLoginAt) : "Never",
        // Set the last time an admin deactivated the account
        deactivatedAt: row.deactivatedAt
          ? safeDateText(row.deactivatedAt)
          : "-",
        createdAt: safeDateText(row.createdAt),
        isActive,
        action: isActive ? "Deactivate" : "Reactivate",
      };
    });
  }, [rows]);

  const totalItems = data?.meta.total || 0;
  const totalPages = data?.meta.totalPages || 1;
  const appliedPageSize = getAppliedPageSize(data?.meta, itemsPerPage);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value);
    resetPage();
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    resetPage();
  };

  const handleActionClick = (action: string, row: UserRow) => {
    if (action.includes("Deactivate") || action.includes("Reactivate")) {
      setSelectedUser(row);
      setIsPreviewOpen(true);
    }
  };

  const handleUserCreated = (created: CreateOfficerResponse) => {
    setCredentialsEmailSent(created?.emailSent !== false);
    setSuccessKind("created");
    setIsSuccessOpen(true);
  };

  // The toast already reported exactly what changed; this is the confirmation
  const handleStatusChanged = () => {
    setSuccessKind("status");
    setIsSuccessOpen(true);
  };

  return (
    <MainLayout>
      <div className="p-4 overflow-y-auto space-y-6 pb-30 h-screen bg-milkwhite/90">
        <ArrowBack />
        <div className="flex flex-col-reverse md:flex-row justify-between md:items-center items-end gap-4">
          <PageHeader
            title="Users"
            subtitle="Create, deactivate and reactivate admins, regional admins, account officers and loading officers."
          />
          <Button
            variant="primary"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-linear-to-r from-primary via-orange to-primary flex items-center gap-1 p-1 md:gap-2"
          >
            <Image
              src={plus}
              width={50}
              height={50}
              className="w-1.5 h-1.5 md:w-2.5 md:h-2.5"
              alt="plus icon"
            />
            <span className="whitespace-nowrap md:whitespace-normal text-[12px] font-medium md:text-[14px]">
              New User
            </span>
          </Button>
        </div>

        <Card border={false}>
          <div className="flex flex-wrap justify-end items-center gap-3 mt-4">
            <select
              value={roleFilter}
              onChange={(event) => handleRoleFilter(event.target.value)}
              aria-label="Filter by role"
              className="px-3 py-2 rounded-md border border-muted/50 bg-white text-[13px] font-medium"
            >
              {ROLE_FILTER_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => handleStatusFilter(event.target.value)}
              aria-label="Filter by status"
              className="px-3 py-2 rounded-md border border-muted/50 bg-white text-[13px] font-medium"
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <SearchInput
              placeholder="Search users"
              onSearch={handleSearch}
              debounceDelay={500}
            />
          </div>

          {isLoading && (
            <div className="py-6 text-center">
              <Text variant="caption" color="muted">
                Loading users...
              </Text>
            </div>
          )}

          {error && (
            <div className="py-6 text-center">
              <Text variant="caption" color="primary">
                Error loading users. Please try again.
              </Text>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div className="overflow-x-auto mt-6">
                <Table
                  columns={tableColumns}
                  data={tableData}
                  onRowClick={setDetailsRow}
                  onActionClick={handleActionClick}
                  rowKey={(row: UserRow) => row.id}
                />
              </div>

              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={appliedPageSize}
                onPrevious={previousPage}
                onNext={() => nextPage(totalPages)}
                onItemsPerPageChange={setPageSize}
              />
            </>
          )}
        </Card>

        {/* Profile + audit trail */}
        <OfficerDetailsModal
          open={!!detailsRow}
          onClose={() => setDetailsRow(null)}
          officer={
            detailsRow
              ? {
                  id: detailsRow.id,
                  name: detailsRow.name,
                  email: detailsRow.email,
                  phone: detailsRow.phoneNo,
                  region: detailsRow.region,
                  role: detailsRow.roleValue,
                  status: detailsRow.status,
                  customers: detailsRow.customers,
                  lastLogin: detailsRow.lastLogin,
                  createdAt: detailsRow.createdAt,
                }
              : null
          }
        />

        {/* Create - the full role picker, unlike the officers screen */}
        <AddManagedUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleUserCreated}
          title="Add User"
        />

        {selectedUser && (
          <PreviewAccountOfficerModal
            isOpen={isPreviewOpen}
            onClose={() => {
              setIsPreviewOpen(false);
              setSelectedUser(null);
            }}
            officer={{
              id: selectedUser.id,
              name: selectedUser.name,
              email: selectedUser.email,
              region: selectedUser.region,
              role: selectedUser.role,
              roleValue: selectedUser.roleValue,
              phoneNo: selectedUser.phoneNo,
              distributors: selectedUser.customers,
              tickets: "-",
              createdAt: selectedUser.createdAt,
              isActive: selectedUser.isActive,
              // Every row on this screen came back from ?managed=true, so it
              // is by definition one of the four roles an admin manages
              isManaged: true,
            }}
            onConfirm={handleStatusChanged}
          />
        )}

        <SuccessModal
          isOpen={isSuccessOpen}
          onClose={() => {
            setIsSuccessOpen(false);
            setCredentialsEmailSent(true);
          }}
          title={
            successKind === "created"
              ? "User Created Successfully"
              : "User Updated Successfully"
          }
          message={
            successKind === "created"
              ? credentialsEmailSent
                ? "The new account has been created successfully. They will receive an email with their login credentials."
                : "The account has been created. The credentials email could not be sent, so pass the password on directly."
              : "The account status has been updated. Nothing is deleted - the account, its history and its conversations all remain available for audit."
          }
        />

        {/* Not reachable through the sidebar for anyone else, but say so if a
            non-admin lands here by URL rather than showing an empty table */}
        {user?.role !== "ADMIN" && (
          <Text variant="caption" color="muted">
            Only an administrator can manage users. This list is scoped to what
            your account is permitted to see.
          </Text>
        )}
      </div>
    </MainLayout>
  );
}

export default function ManagedUsersPage() {
  return (
    <ProtectedRoute redirectPath="/auth/login">
      <ManagedUsersContent />
    </ProtectedRoute>
  );
}
