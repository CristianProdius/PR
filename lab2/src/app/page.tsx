"use client";

import { useState, useEffect } from "react";
import { ProductCreateInput } from "@/lib/prisma";

interface Product {
  id: number;
  name: string;
  price: number;
  link: string;
  description?: string | null;
  availability?: string | null;
  currency: string;
}

interface PaginatedResponse {
  data: Product[];
  metadata: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function Home() {
  const [paginatedData, setPaginatedData] = useState<PaginatedResponse>({
    data: [],
    metadata: {
      total: 0,
      totalPages: 0,
      currentPage: 1,
      pageSize: 10,
      hasNextPage: false,
      hasPrevPage: false,
    },
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductCreateInput>({
    name: "",
    price: 0,
    link: "",
    description: "",
    availability: "",
    currency: "GBP",
  });

  const fetchProducts = async (page: number) => {
    setLoading(true);
    try {
      const url = searchTerm
        ? `/api/products?page=${page}&pageSize=${pageSize}&name=${searchTerm}`
        : `/api/products?page=${page}&pageSize=${pageSize}`;
      const res = await fetch(url);
      const data = await res.json();
      setPaginatedData(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, pageSize, searchTerm]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({
          name: "",
          price: 0,
          link: "",
          description: "",
          availability: "",
          currency: "GBP",
        });
        fetchProducts(currentPage);
      }
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setEditingProduct(null);
        setFormData({
          name: "",
          price: 0,
          link: "",
          description: "",
          availability: "",
          currency: "GBP",
        });
        fetchProducts(currentPage);
      }
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchProducts(currentPage);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  return (
    <main className="p-8">
      {/* Search Bar */}
      <div className="mb-8">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Create/Edit Form */}
      <form
        onSubmit={editingProduct ? handleUpdate : handleCreate}
        className="mb-8"
      >
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Name"
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseFloat(e.target.value) })
            }
            placeholder="Price"
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            placeholder="Link"
            className="border p-2 rounded"
            required
          />
          <input
            type="text"
            value={formData.description || ""}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Description"
            className="border p-2 rounded"
          />
          <input
            type="text"
            value={formData.availability || ""}
            onChange={(e) =>
              setFormData({ ...formData, availability: e.target.value })
            }
            placeholder="Availability"
            className="border p-2 rounded"
          />
          <select
            value={formData.currency}
            onChange={(e) =>
              setFormData({ ...formData, currency: e.target.value })
            }
            className="border p-2 rounded"
          >
            <option value="GBP">GBP</option>
            <option value="MDL">MDL</option>
          </select>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {editingProduct ? "Update Product" : "Create Product"}
        </button>
        {editingProduct && (
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setFormData({
                name: "",
                price: 0,
                link: "",
                description: "",
                availability: "",
                currency: "GBP",
              });
            }}
            className="ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel Edit
          </button>
        )}
      </form>

      {/* Items per page selector */}
      <div className="mr-4 pb-4">
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1); // Reset to first page when changing page size
          }}
          className="border rounded p-2"
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
        </select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {paginatedData.data.map((product) => (
            <div key={product.id} className="border p-4 rounded shadow">
              <h2 className="text-xl font-bold">{product.name}</h2>
              <p className="text-gray-600">
                Price: {product.price} {product.currency}
              </p>
              <p className="text-gray-600">Link: {product.link}</p>
              {product.description && (
                <p className="text-gray-600">
                  Description: {product.description}
                </p>
              )}
              {product.availability && (
                <p className="text-gray-600">
                  Availability: {product.availability}
                </p>
              )}
              <div className="mt-4 space-x-2">
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setFormData({
                      name: product.name,
                      price: product.price,
                      link: product.link,
                      description: product.description || "",
                      availability: product.availability || "",
                      currency: product.currency,
                    });
                  }}
                  className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-2">
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={!paginatedData.metadata.hasPrevPage}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>

        {[...Array(paginatedData.metadata.totalPages)].map((_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-4 py-2 border rounded ${
              currentPage === i + 1 ? "bg-blue-500 text-white" : ""
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={!paginatedData.metadata.hasNextPage}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </main>
  );
}
