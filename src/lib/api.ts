const BASE_URL = "https://happyfurniture-huexcrecemgaesdy.southeastasia-01.azurewebsites.net/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hf_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.message || message;
    } catch {}
    throw new Error(message);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    role: string;
    createdAt: string;
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/Auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// ─── Categories ──────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  imageUrl: string | null;
  parentId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent: Category | null;
  children: Category[];
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export async function getCategories(
  pageNumber = 1,
  pageSize = 10
): Promise<PaginatedResponse<Category>> {
  return request<PaginatedResponse<Category>>(
    `/Categories?pageNumber=${pageNumber}&pageSize=${pageSize}`
  );
}

export async function getCategoryById(id: number): Promise<Category> {
  return request<Category>(`/Categories/${id}`);
}

export async function createCategory(data: {
  name: string;
  imageUrl?: string;
  parentId?: number | null;
  isActive: boolean;
}): Promise<Category> {
  return request<Category>("/Categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  id: number,
  data: {
    name: string;
    imageUrl?: string;
    parentId?: number | null;
    isActive: boolean;
  }
): Promise<Category> {
  return request<Category>(`/Categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: number): Promise<void> {
  return request<void>(`/Categories/${id}`, { method: "DELETE" });
}

export async function getRootCategories(): Promise<Category[]> {
  return request<Category[]>("/Categories/root");
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice: number | null;
  dimensionsHeight: number | null;
  dimensionsWidth: number | null;
  dimensionsDepth: number | null;
  dimensionUnit: string;
  detail: string | null;
  deliveryInfo: string | null;
  weight: number | null;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
  variants: unknown[];
  images: ProductImage[];
}

export async function getProducts(
  pageNumber = 1,
  pageSize = 10
): Promise<PaginatedResponse<Product>> {
  return request<PaginatedResponse<Product>>(
    `/Products?pageNumber=${pageNumber}&pageSize=${pageSize}`
  );
}

export async function getProductById(id: number): Promise<Product> {
  return request<Product>(`/Products/${id}`);
}

export interface CreateProductData {
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  dimensionsHeight?: number | null;
  dimensionsWidth?: number | null;
  dimensionsDepth?: number | null;
  dimensionUnit: string;
  detail?: string;
  deliveryInfo?: string;
  weight?: number | null;
  isFeatured: boolean;
  isActive: boolean;
  categoryIds: number[];
  imageUrls: string[];
}

export async function createProduct(data: CreateProductData): Promise<Product> {
  return request<Product>("/Products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProduct(
  id: number,
  data: CreateProductData
): Promise<Product> {
  return request<Product>(`/Products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: number): Promise<void> {
  return request<void>(`/Products/${id}`, { method: "DELETE" });
}

// Multipart upload helpers (no Content-Type header — browser sets boundary automatically)
async function requestMultipart<T>(
  path: string,
  formData: FormData
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.message || message;
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

export interface CreateProductWithImagesData {
  name: string;
  slug: string;
  description?: string;
  price: number;
  oldPrice?: number | null;
  dimensionsHeight?: number | null;
  dimensionsWidth?: number | null;
  dimensionsDepth?: number | null;
  dimensionUnit?: string;
  detail?: string;
  deliveryInfo?: string;
  weight?: number | null;
  isFeatured?: boolean;
  isActive?: boolean;
  categoryIds: number[];
  images: File[];
}

export async function createProductWithImages(
  data: CreateProductWithImagesData
): Promise<Product> {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("slug", data.slug);
  if (data.description) formData.append("description", data.description);
  formData.append("price", String(data.price));
  if (data.oldPrice != null) formData.append("oldPrice", String(data.oldPrice));
  if (data.dimensionsHeight != null) formData.append("dimensionsHeight", String(data.dimensionsHeight));
  if (data.dimensionsWidth != null) formData.append("dimensionsWidth", String(data.dimensionsWidth));
  if (data.dimensionsDepth != null) formData.append("dimensionsDepth", String(data.dimensionsDepth));
  if (data.dimensionUnit) formData.append("dimensionUnit", data.dimensionUnit);
  if (data.detail) formData.append("detail", data.detail);
  if (data.deliveryInfo) formData.append("deliveryInfo", data.deliveryInfo);
  if (data.weight != null) formData.append("weight", String(data.weight));
  formData.append("isFeatured", data.isFeatured ? "true" : "false");
  formData.append("isActive", data.isActive !== false ? "true" : "false");
  // categoryIds as comma-separated string (per API docs)
  formData.append("categoryIds", data.categoryIds.join(","));
  data.images.forEach((file) => formData.append("images", file));

  return requestMultipart<Product>("/Products/with-images", formData);
}

// ─── Product Variants ─────────────────────────────────────────────────────────

export interface ProductVariant {
  id: number;
  productId: number;
  colorName: string;
  colorCode: string;
  imageUrl: string | null;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductVariantData {
  productId: number;
  colorName: string;
  colorCode: string;
  price: number;
  isActive: boolean;
}

export interface UpdateProductVariantData {
  colorName: string;
  colorCode: string;
  price: number;
  isActive: boolean;
}

export async function getProductVariants(
  productId: number,
  pageNumber = 1,
  pageSize = 50
): Promise<PaginatedResponse<ProductVariant>> {
  return request<PaginatedResponse<ProductVariant>>(
    `/ProductVariants/product/${productId}?pageNumber=${pageNumber}&pageSize=${pageSize}`
  );
}

export async function getProductVariantById(id: number): Promise<ProductVariant> {
  return request<ProductVariant>(`/ProductVariants/${id}`);
}

export async function createProductVariant(
  data: CreateProductVariantData
): Promise<ProductVariant> {
  return request<ProductVariant>("/ProductVariants", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateProductVariant(
  id: number,
  data: UpdateProductVariantData
): Promise<ProductVariant> {
  return request<ProductVariant>(`/ProductVariants/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProductVariant(id: number): Promise<void> {
  return request<void>(`/ProductVariants/${id}`, { method: "DELETE" });
}

export interface CreateCategoryWithImageData {
  name: string;
  parentId?: number | null;
  isActive: boolean;
  image: File;
}

export async function createCategoryWithImage(
  data: CreateCategoryWithImageData
): Promise<Category> {
  const formData = new FormData();
  formData.append("name", data.name);
  if (data.parentId != null) formData.append("parentId", String(data.parentId));
  formData.append("isActive", data.isActive ? "true" : "false");
  formData.append("image", data.image);

  return requestMultipart<Category>("/Categories/with-image", formData);
}
