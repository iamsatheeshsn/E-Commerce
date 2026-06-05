"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllReviews, deleteReview } from "@/lib/firestore";
import { Review } from "@/types";
import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { useTablePagination } from "@/hooks/useTablePagination";

export default function AdminReviewsPage() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    pageData: pagedReviews,
    page,
    totalPages,
    from,
    to,
    total,
    setPage,
    resetPage,
  } = useTablePagination(reviews, 15);

  const load = () => {
    setLoading(true);
    getAllReviews()
      .then((data) => {
        setReviews(data);
        resetPage();
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteReview(deleteTarget.id);
      toast("Review deleted");
      setDeleteTarget(null);
      load();
    } catch {
      toast("Failed to delete review", "error");
    }
  };

  const columns = [
    {
      key: "rating",
      header: "Rating",
      render: (r: Review) => (
        <Badge variant={r.rating >= 4 ? "success" : "default"}>
          {r.rating}★
        </Badge>
      ),
    },
    { key: "title", header: "Title" },
    {
      key: "body",
      header: "Review",
      render: (r: Review) => (
        <p className="line-clamp-2 max-w-xs text-sm text-gray-600">{r.body}</p>
      ),
    },
    {
      key: "productId",
      header: "Product",
      render: (r: Review) => (
        <Link
          href={`/products/${r.productId}`}
          className="text-sm text-primary hover:underline"
          target="_blank"
        >
          View product
        </Link>
      ),
    },
    {
      key: "verified",
      header: "Verified",
      render: (r: Review) => (r.verified ? "Yes" : "No"),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (r: Review) =>
        r.createdAt?.toDate?.()
          ? format(r.createdAt.toDate(), "dd MMM yyyy")
          : "—",
    },
    {
      key: "actions",
      header: "",
      render: (r: Review) => (
        <button
          onClick={() => setDeleteTarget(r)}
          className="text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <p className="text-sm text-gray-500">
          Moderate customer product reviews
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p className="rounded-lg border bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-900">
          No reviews yet. Reviews appear when customers submit them on product
          pages.
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={pagedReviews}
          keyExtractor={(r) => r.id}
          page={page}
          totalPages={totalPages}
          from={from}
          to={to}
          total={total}
          onPageChange={setPage}
        />
      )}

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Review"
      >
        <p className="mb-4">Remove this review permanently?</p>
        <div className="flex gap-4">
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
