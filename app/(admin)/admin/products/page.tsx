"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  getAllProductsAdminFull,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/firestore";
import { useTablePagination } from "@/hooks/useTablePagination";
import { uploadImage } from "@/lib/upload";
import { PLACEHOLDER_IMAGE } from "@/lib/utils";
import { Product } from "@/types";
import { productSchema, ProductInput } from "@/lib/validations";
import { DataTable } from "@/components/admin/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    pageData: pagedProducts,
    page,
    totalPages,
    from,
    to,
    total,
    setPage,
    resetPage,
  } = useTablePagination(products, 15);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({ resolver: zodResolver(productSchema) });

  const loadProducts = () => {
    setLoading(true);
    getAllProductsAdminFull()
      .then((p) => {
        setProducts(p);
        resetPage();
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({
      name: "",
      slug: "",
      description: "",
      price: 0,
      category: "Electronics",
      brand: "",
      stock: 0,
      tags: "",
      specifications: "",
      isActive: true,
      rating: 4,
      reviewCount: 0,
    });
    setImageFile(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setImageFile(null);
    setImagePreview(product.images[0] || null);
    reset({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      comparePrice: product.comparePrice,
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      stock: product.stock,
      tags: product.tags.join(", "),
      specifications: JSON.stringify(product.specifications, null, 2),
      isActive: product.isActive,
      rating: product.rating,
      reviewCount: product.reviewCount,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: ProductInput) => {
    try {
      let specs: Record<string, string> = {};
      if (data.specifications) {
        try {
          specs = JSON.parse(data.specifications);
        } catch {
          toast("Invalid specifications JSON", "error");
          return;
        }
      }

      const productData: Record<string, unknown> = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: data.price,
        images: editing?.images?.length ? editing.images : [PLACEHOLDER_IMAGE],
        category: data.category,
        brand: data.brand,
        stock: data.stock,
        rating: data.rating ?? 4,
        reviewCount: data.reviewCount ?? 0,
        tags: data.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
        specifications: specs,
        isActive: data.isActive ?? true,
      };

      if (data.subcategory?.trim()) {
        productData.subcategory = data.subcategory.trim();
      }
      if (
        data.comparePrice != null &&
        !Number.isNaN(data.comparePrice) &&
        data.comparePrice > 0
      ) {
        productData.comparePrice = data.comparePrice;
      }

      let productId = editing?.id;
      const existingImages: string[] = editing?.images?.length
        ? editing.images
        : [PLACEHOLDER_IMAGE];

      if (editing) {
        await updateProduct(editing.id, productData as Partial<Product>);
        productId = editing.id;
      } else {
        productId = await createProduct(
          productData as Omit<Product, "id" | "createdAt">
        );
      }

      let finalImages = existingImages;

      if (imageFile && productId) {
        setUploadingImage(true);
        try {
          const url = await uploadImage(imageFile, "products", productId);
          finalImages = editing
            ? [url, ...existingImages.filter((_, i) => i > 0)]
            : [url];
          await updateProduct(productId, { images: finalImages });
        } finally {
          setUploadingImage(false);
        }
      }

      toast(editing ? "Product updated" : "Product created");
      setImageFile(null);
      setImagePreview(null);
      setModalOpen(false);
      loadProducts();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save product";
      toast(message, "error");
      console.error("Save product error:", err);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteProduct(deleteConfirm.id);
    toast("Product deleted");
    setDeleteConfirm(null);
    loadProducts();
  };

  const toggleActive = async (product: Product) => {
    await updateProduct(product.id, { isActive: !product.isActive });
    loadProducts();
    toast(`Product ${product.isActive ? "deactivated" : "activated"}`);
  };

  const columns = [
    { key: "name", header: "Name" },
    { key: "category", header: "Category" },
    {
      key: "price",
      header: "Price",
      render: (p: Product) => formatPrice(p.price),
    },
    { key: "stock", header: "Stock" },
    {
      key: "isActive",
      header: "Status",
      render: (p: Product) => (
        <Badge variant={p.isActive ? "success" : "danger"}>
          {p.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (p: Product) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(p)} className="text-primary">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => toggleActive(p)} className="text-gray-500 text-xs">
            Toggle
          </button>
          <button
            onClick={() => setDeleteConfirm(p)}
            className="text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading products...</p>
      ) : (
        <DataTable
          columns={columns}
          data={pagedProducts}
          keyExtractor={(p) => p.id}
          page={page}
          totalPages={totalPages}
          from={from}
          to={to}
          total={total}
          onPageChange={setPage}
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Product" : "Add Product"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" {...register("name")} error={errors.name?.message} />
          <Input label="Slug" {...register("slug")} error={errors.slug?.message} />
          <Input
            label="Description"
            {...register("description")}
            error={errors.description?.message}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              {...register("price", { valueAsNumber: true })}
              error={errors.price?.message}
            />
            <Input
              label="Compare Price"
              type="number"
              {...register("comparePrice", { valueAsNumber: true })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Category" {...register("category")} />
            <Input label="Brand" {...register("brand")} />
          </div>
          <Input
            label="Stock"
            type="number"
            {...register("stock", { valueAsNumber: true })}
          />
          <Input label="Tags (comma separated)" {...register("tags")} />
          <div>
            <label className="mb-1 block text-sm font-medium">
              Specifications (JSON)
            </label>
            <textarea
              {...register("specifications")}
              className="w-full rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              rows={3}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Product Image</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImageFile(file);
                if (file) {
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
              className="block w-full text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              JPG, PNG or WebP — max 5MB. Saved on this server under /public/uploads.
            </p>
            {imagePreview && (
              <div className="relative mt-2 h-32 w-32 overflow-hidden rounded border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-contain"
                />
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isActive")} />
            Active
          </label>
          <Button type="submit" loading={isSubmitting || uploadingImage}>
            {editing ? "Update" : "Create"}
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Product"
      >
        <p className="mb-4">
          Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;?
        </p>
        <div className="flex gap-4">
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
