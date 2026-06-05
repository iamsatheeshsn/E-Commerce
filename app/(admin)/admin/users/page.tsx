"use client";

import { useEffect, useState } from "react";
import { getAllUsers, updateUserRole } from "@/lib/firestore";
import { User } from "@/types";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { Input } from "@/components/ui/Input";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getAllUsers()
      .then(setUsers)
      .catch(() => toast("Failed to load users", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = async (uid: string, role: string) => {
    try {
      await updateUserRole(uid, role as "customer" | "admin");
      toast("User role updated");
      load();
    } catch {
      toast("Failed to update role", "error");
    }
  };

  const columns = [
    {
      key: "displayName",
      header: "Name",
      render: (u: User) => (
        <div>
          <p className="font-medium">{u.displayName}</p>
          <p className="text-xs text-gray-500">{u.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u: User) => (
        <Badge variant={u.role === "admin" ? "accent" : "default"}>
          {u.role}
        </Badge>
      ),
    },
    {
      key: "addresses",
      header: "Addresses",
      render: (u: User) => u.addresses?.length ?? 0,
    },
    {
      key: "createdAt",
      header: "Joined",
      render: (u: User) =>
        u.createdAt?.toDate?.()
          ? format(u.createdAt.toDate(), "dd MMM yyyy")
          : "—",
    },
    {
      key: "actions",
      header: "Change role",
      render: (u: User) => (
        <Select
          value={u.role}
          onChange={(e) => handleRoleChange(u.uid, e.target.value)}
          options={[
            { value: "customer", label: "Customer" },
            { value: "admin", label: "Admin" },
          ]}
          className="min-w-[120px]"
        />
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-gray-500">
            Manage customers and admin access ({users.length} total)
          </p>
        </div>
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">Loading users...</p>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(u) => u.uid}
        />
      )}
    </div>
  );
}
