"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/firestore";
import { Category } from "@/types";
import { categorySchema, CategoryInput } from "@/lib/validations";
import { DataTable } from "@/components/admin/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { uploadImage } from "@/lib/upload";
import { DEFAULT_CATEGORY_IMAGE } from "@/lib/utils";
import Image from "next/image";

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({ resolver: zodResolver(categorySchema) });

  const load = () => getCategories().then(setCategories);

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setImageFile(null);
    setImagePreview(null);
    reset({
      name: "",
      slug: "",
      description: "",
    });
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setImageFile(null);
    setImagePreview(cat.image || null);
    reset({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: CategoryInput) => {
    try {
      let categoryId = editing?.id;
      const payload: Omit<Category, "id"> = {
        name: data.name,
        slug: data.slug,
        image: editing?.image || DEFAULT_CATEGORY_IMAGE,
        description: data.description,
      };

      if (editing) {
        await updateCategory(editing.id, payload);
        categoryId = editing.id;
      } else {
        categoryId = await createCategory(payload);
      }

      if (imageFile && categoryId) {
        setUploadingImage(true);
        try {
          const url = await uploadImage(imageFile, "categories", categoryId);
          await updateCategory(categoryId, { image: url });
        } finally {
          setUploadingImage(false);
        }
      }

      toast(editing ? "Category updated" : "Category created");
      setImageFile(null);
      setImagePreview(null);
      setModalOpen(false);
      load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save category";
      toast(message, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory(deleteTarget.id);
      toast("Category deleted");
      setDeleteTarget(null);
      load();
    } catch {
      toast("Failed to delete", "error");
    }
  };

  const columns = [
    {
      key: "image",
      header: "Image",
      render: (c: Category) => (
        <div className="relative h-10 w-16 overflow-hidden rounded">
          <Image
            src={c.image || DEFAULT_CATEGORY_IMAGE}
            alt=""
            fill
            className="object-cover"
            unoptimized={c.image?.startsWith("/uploads")}
          />
        </div>
      ),
    },
    { key: "name", header: "Name" },
    { key: "slug", header: "Slug" },
    {
      key: "actions",
      header: "Actions",
      render: (c: Category) => (
        <div className="flex gap-2">
          <button onClick={() => openEdit(c)} className="text-primary">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteTarget(c)} className="text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-gray-500">
            Manage shop categories — images stored on local server
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        keyExtractor={(c) => c.id}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Category" : "Add Category"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" {...register("name")} error={errors.name?.message} />
          <Input label="Slug" {...register("slug")} error={errors.slug?.message} />
          <Input label="Description" {...register("description")} />
          <div>
            <label className="mb-1 block text-sm font-medium">Category Image</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImageFile(file);
                if (file) setImagePreview(URL.createObjectURL(file));
              }}
              className="block w-full text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              JPG, PNG or WebP — max 5MB. Saved under /public/uploads/categories/
            </p>
            {imagePreview && (
              <div className="relative mt-2 h-24 w-40 overflow-hidden rounded border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
          <Button type="submit" loading={isSubmitting || uploadingImage}>
            {editing ? "Update" : "Create"}
          </Button>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category"
      >
        <p className="mb-4">
          Delete &quot;{deleteTarget?.name}&quot;? Products in this category are
          not deleted.
        </p>
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
