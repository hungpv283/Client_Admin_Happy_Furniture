const BASE_URL = "https://happyfurniture-huexcrecemgaesdy.southeastasia-01.azurewebsites.net/api";

// const BASE_URL = "https://localhost:7290/api"

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("hf_token");
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
  nameEn: string | null;
  description: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  parentId: number | null;
  sortOrder: number | null;
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

function buildQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export interface CategoryFilters {
  name?: string;
  parentId?: number | null;
  isActive?: boolean;
  includeChildren?: boolean;
}

export async function getCategories(
  pageNumber = 1,
  pageSize = 10,
  filters: CategoryFilters = {}
): Promise<PaginatedResponse<Category>> {
  return request<PaginatedResponse<Category>>(
    `/Categories${buildQueryString({
      PageNumber: pageNumber,
      PageSize: pageSize,
      Name: filters.name,
      ParentId: filters.parentId,
      IsActive: filters.isActive,
      IncludeChildren: filters.includeChildren,
    })}`
  );
}

export async function getCategoryById(id: number): Promise<Category> {
  return request<Category>(`/Categories/${id}`);
}

export async function createCategory(data: {
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  imageUrl?: string;
  parentId?: number | null;
  sortOrder?: number | null;
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
    nameEn?: string;
    description?: string;
    descriptionEn?: string;
    imageUrl?: string;
    parentId?: number | null;
    sortOrder?: number | null;
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

export async function createProductImage(data: {
  productId: number;
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}): Promise<ProductImage> {
  return request<ProductImage>("/ProductImages", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createProductImageWithImage(data: {
  productId: number;
  image: File;
  isPrimary: boolean;
  sortOrder: number;
  altText?: string | null;
}): Promise<ProductImage> {
  const formData = new FormData();
  formData.append("productId", String(data.productId));
  formData.append("image", data.image);
  formData.append("isPrimary", data.isPrimary ? "true" : "false");
  formData.append("sortOrder", String(data.sortOrder));
  if (data.altText != null) formData.append("altText", data.altText);

  return requestMultipart<ProductImage>("/ProductImages/with-image", formData);
}

export async function updateProductImage(
  id: number,
  data: { imageUrl: string; altText?: string | null; isPrimary: boolean; sortOrder: number }
): Promise<ProductImage> {
  return request<ProductImage>(`/ProductImages/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteProductImage(id: number): Promise<void> {
  return request<void>(`/ProductImages/${id}`, { method: "DELETE" });
}

export async function getProductImagesByProduct(productId: number): Promise<ProductImage[]> {
  return request<ProductImage[]>(`/ProductImages/product/${productId}`);
}

export async function setProductImagePrimary(imageId: number): Promise<void> {
  return request<void>(`/ProductImages/${imageId}/set-primary`, { method: "POST" });
}
export interface Assembly {
  id: number;
  nameVi: string;
  nameEn: string | null;
  code: string;
  descriptionVi: string | null;
  descriptionEn: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDeliveryFields {
  deliveryInfo: string | null;
  deliveryInfoEn: string | null;
  weight: string | null;
  deliveryHeight: string | null;
  deliveryWidth: string | null;
  deliveryDepth: string | null;
}

export interface Product extends ProductDeliveryFields {
  id: number;
  name: string;
  nameEn: string | null;
  slug: string;
  description: string;
  descriptionEn: string | null;
  price?: number | null;
  oldPrice?: number | null;
  dimensionsHeight: string | null;
  dimensionsWidth: string | null;
  dimensionsDepth: string | null;
  dimensionUnit: string;
  detail: string | null;
  detailEn: string | null;
  isFeatured: boolean;
  isActive: boolean;
  assemblyId: number | null;
  assembly: Assembly | null;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
  materials?: Material[];
  materialIds?: number[];
  variants: unknown[];
  images: ProductImage[];
}

export interface ProductFilters {
  name?: string;
  slug?: string;
  categoryId?: number;
  materialId?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: string;
}

export async function getProducts(
  pageNumber = 1,
  pageSize = 10,
  filters: ProductFilters = {}
): Promise<PaginatedResponse<Product>> {
  return request<PaginatedResponse<Product>>(
    `/Products${buildQueryString({
      PageNumber: pageNumber,
      PageSize: pageSize,
      Name: filters.name,
      Slug: filters.slug,
      CategoryId: filters.categoryId,
      MaterialId: filters.materialId,
      IsFeatured: filters.isFeatured,
      IsActive: filters.isActive,
      SortBy: filters.sortBy,
      SortOrder: filters.sortOrder,
    })}`
  );
}

export async function getProductById(id: number): Promise<Product> {
  return request<Product>(`/Products/${id}`);
}

export interface CreateProductData extends Partial<ProductDeliveryFields> {
  name: string;
  nameEn?: string;
  slug: string;
  description: string;
  descriptionEn?: string;
  dimensionsHeight?: string | null;
  dimensionsWidth?: string | null;
  dimensionsDepth?: string | null;
  dimensionUnit: string;
  detail?: string | null;
  detailEn?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  assemblyId?: number | null;
  categoryIds: number[];
  materialIds: number[];
  imageUrls: string[];
}

export async function createProduct(data: CreateProductData): Promise<Product> {
  return request<Product>("/Products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface UpdateProductData extends Omit<CreateProductData, "imageUrls"> {
  imageUrls?: string[];
}

export async function updateProduct(
  id: number,
  data: UpdateProductData
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

export interface CreateProductWithImagesData extends Partial<ProductDeliveryFields> {
  name: string;
  nameEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  dimensionsHeight?: string | null;
  dimensionsWidth?: string | null;
  dimensionsDepth?: string | null;
  dimensionUnit?: string;
  detail?: string | null;
  detailEn?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
  assemblyId?: number | null;
  categoryIds: number[];
  materialIds: number[];
  images: File[];
}

export async function createProductWithImages(
  data: CreateProductWithImagesData
): Promise<Product> {
  const formData = new FormData();
  formData.append("name", data.name);
  if (data.nameEn) formData.append("nameEn", data.nameEn);
  formData.append("slug", data.slug);
  if (data.description) formData.append("description", data.description);
  if (data.descriptionEn) formData.append("descriptionEn", data.descriptionEn);
  if (data.dimensionsHeight != null) formData.append("dimensionsHeight", String(data.dimensionsHeight));
  if (data.dimensionsWidth != null) formData.append("dimensionsWidth", String(data.dimensionsWidth));
  if (data.dimensionsDepth != null) formData.append("dimensionsDepth", String(data.dimensionsDepth));
  if (data.dimensionUnit) formData.append("dimensionUnit", data.dimensionUnit);
  if (data.detail != null) formData.append("detail", data.detail);
  if (data.detailEn != null) formData.append("detailEn", data.detailEn);
  if (data.deliveryInfo != null) formData.append("deliveryInfo", data.deliveryInfo);
  if (data.deliveryInfoEn != null) formData.append("deliveryInfoEn", data.deliveryInfoEn);
  if (data.weight != null) formData.append("weight", String(data.weight));
  if (data.deliveryHeight != null) formData.append("deliveryHeight", String(data.deliveryHeight));
  if (data.deliveryWidth != null) formData.append("deliveryWidth", String(data.deliveryWidth));
  if (data.deliveryDepth != null) formData.append("deliveryDepth", String(data.deliveryDepth));
  if (data.assemblyId != null) formData.append("assemblyId", String(data.assemblyId));
  formData.append("isFeatured", data.isFeatured ? "true" : "false");
  formData.append("isActive", data.isActive !== false ? "true" : "false");
  formData.append("categoryIds", data.categoryIds.join(","));
  formData.append("materialIds", data.materialIds.join(","));
  data.images.forEach((file) => formData.append("images", file));

  return requestMultipart<Product>("/Products/with-images", formData);
}

// ─── Product Variants ─────────────────────────────────────────────────────────

export interface ProductVariantImage {
  id: number;
  variantId: number;
  imageUrl: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: number;
  productId: number;
  colorName: string;
  slug: string | null;
  colorCode: string;
  imageUrl: string | null;
  price: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  images: ProductVariantImage[];
}

export interface CreateProductVariantData {
  productId: number;
  colorName: string;
  slug?: string | null;
  colorCode: string;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface UpdateProductVariantData {
  colorName: string;
  slug?: string | null;
  colorCode: string;
  imageUrl?: string | null;
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

export interface CreateProductVariantWithImageData {
  productId: number;
  colorName: string;
  colorCode: string;
  isActive: boolean;
  image: File;
}

export async function createProductVariantWithImage(
  data: CreateProductVariantWithImageData
): Promise<ProductVariant> {
  const formData = new FormData();
  formData.append("productId", String(data.productId));
  formData.append("colorName", data.colorName);
  formData.append("colorCode", data.colorCode);
  formData.append("isActive", data.isActive ? "true" : "false");
  formData.append("image", data.image);

  return requestMultipart<ProductVariant>("/ProductVariants/with-image", formData);
}

// ─── Product Variant Images ───────────────────────────────────────────────────

export async function getVariantImages(variantId: number): Promise<ProductVariantImage[]> {
  return request<ProductVariantImage[]>(`/ProductVariants/${variantId}/images`);
}

export async function createVariantImage(variantId: number, data: {
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}): Promise<ProductVariantImage> {
  return request<ProductVariantImage>(`/ProductVariants/${variantId}/images`, {
    method: "POST",
    body: JSON.stringify({ ...data, variantId }),
  });
}

export async function createVariantImageWithUpload(variantId: number, data: {
  image: File;
  isPrimary: boolean;
  sortOrder: number;
  altText?: string | null;
}): Promise<ProductVariantImage> {
  const formData = new FormData();
  formData.append("image", data.image);
  formData.append("isPrimary", data.isPrimary ? "true" : "false");
  formData.append("sortOrder", String(data.sortOrder));
  if (data.altText != null) formData.append("altText", data.altText);

  return requestMultipart<ProductVariantImage>(`/ProductVariants/${variantId}/images/with-image`, formData);
}

export async function deleteVariantImage(imageId: number): Promise<void> {
  return request<void>(`/ProductVariants/images/${imageId}`, { method: "DELETE" });
}

export async function setVariantImagePrimary(imageId: number): Promise<void> {
  return request<void>(`/ProductVariants/images/${imageId}/set-primary`, { method: "POST" });
}

export interface CreateCategoryWithImageData {
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  parentId?: number | null;
  sortOrder?: number | null;
  isActive: boolean;
  image: File;
}

export async function createCategoryWithImage(
  data: CreateCategoryWithImageData
): Promise<Category> {
  const formData = new FormData();
  formData.append("name", data.name);
  if (data.nameEn) formData.append("nameEn", data.nameEn);
  if (data.description) formData.append("description", data.description);
  if (data.descriptionEn) formData.append("descriptionEn", data.descriptionEn);
  if (data.parentId != null) formData.append("parentId", String(data.parentId));
  if (data.sortOrder != null) formData.append("sortOrder", String(data.sortOrder));
  formData.append("isActive", data.isActive ? "true" : "false");
  formData.append("image", data.image);

  return requestMultipart<Category>("/Categories/with-image", formData);
}

// Materials

export interface Material {
  id: number;
  nameVi: string;
  nameEn: string | null;
  descriptionVi: string | null;
  descriptionEn: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialPayload {
  nameVi: string;
  nameEn?: string;
  descriptionVi?: string;
  descriptionEn?: string;
  isActive: boolean;
}

export interface MaterialFilters {
  name?: string;
  isActive?: boolean;
}

export async function getMaterials(
  pageNumber = 1,
  pageSize = 10,
  filters: MaterialFilters = {}
): Promise<PaginatedResponse<Material>> {
  return request<PaginatedResponse<Material>>(
    `/Materials${buildQueryString({
      PageNumber: pageNumber,
      PageSize: pageSize,
      Name: filters.name,
      IsActive: filters.isActive,
    })}`
  );
}

export async function getMaterialById(id: number): Promise<Material> {
  return request<Material>(`/Materials/${id}`);
}

export async function createMaterial(data: MaterialPayload): Promise<Material> {
  return request<Material>("/Materials", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMaterial(
  id: number,
  data: MaterialPayload
): Promise<Material> {
  return request<Material>(`/Materials/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMaterial(id: number): Promise<void> {
  return request<void>(`/Materials/${id}`, { method: "DELETE" });
}

export async function getActiveMaterials(): Promise<Material[]> {
  return request<Material[]>("/Materials/active");
}

// ─── Assemblies ───────────────────────────────────────────────────────────────

export interface AssemblyFilters {
  name?: string;
  isActive?: boolean;
}

export async function getAssemblies(
  pageNumber = 1,
  pageSize = 100,
  filters: AssemblyFilters = {}
): Promise<PaginatedResponse<Assembly>> {
  return request<PaginatedResponse<Assembly>>(
    `/Assemblies${buildQueryString({
      PageNumber: pageNumber,
      PageSize: pageSize,
      Name: filters.name,
      IsActive: filters.isActive,
    })}`
  );
}

export async function getAssemblyById(id: number): Promise<Assembly> {
  return request<Assembly>(`/Assemblies/${id}`);
}

export interface AssemblyPayload {
  nameVi: string;
  nameEn?: string;
  code: string;
  descriptionVi?: string;
  descriptionEn?: string;
  isActive: boolean;
}

export async function createAssembly(data: AssemblyPayload): Promise<Assembly> {
  return request<Assembly>("/Assemblies", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAssembly(id: number, data: AssemblyPayload): Promise<Assembly> {
  return request<Assembly>(`/Assemblies/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAssembly(id: number): Promise<void> {
  return request<void>(`/Assemblies/${id}`, { method: "DELETE" });
}

export async function getActiveAssemblies(): Promise<Assembly[]> {
  return request<Assembly[]>("/Assemblies/active");
}

// ─── News ────────────────────────────────────────────────────────────────────────

export interface News {
  id: number;
  titleVi: string;
  titleEn: string | null;
  slug: string;
  contentVi: string | null;
  contentEn: string | null;
  imageUrl: string | null;
  excerptVi: string | null;
  excerptEn: string | null;
  isActive: boolean;
  sortOrder: number;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsResponse {
  events: News[];
  activities: News[];
}

export interface NewsFilters {
  title?: string;
  type?: string;
  isActive?: boolean;
}

export async function getNews(
  pageNumber = 1,
  pageSize = 10,
  filters: NewsFilters = {}
): Promise<{ items: News[]; total: number; page: number; pageSize: number }> {
  return request<{ items: News[]; total: number; page: number; pageSize: number }>(
    `/News${buildQueryString({
      pageNumber,
      pageSize,
      type: filters.type,
      title: filters.title,
      isActive: filters.isActive,
    })}`
  );
}

export async function getActiveNews(): Promise<NewsResponse> {
  return request<NewsResponse>("/News/active");
}

export async function getNewsById(id: number): Promise<News> {
  return request<News>(`/News/${id}`);
}

export async function getNewsBySlug(slug: string): Promise<News> {
  return request<News>(`/News/slug/${slug}`);
}

export interface NewsPayload {
  titleVi: string;
  titleEn?: string;
  slug: string;
  contentVi?: string;
  contentEn?: string;
  imageUrl?: string;
  excerptVi?: string;
  excerptEn?: string;
  isActive: boolean;
  sortOrder: number;
  type: string;
}

export async function createNews(data: NewsPayload): Promise<News> {
  return request<News>("/News", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateNews(id: number, data: NewsPayload): Promise<News> {
  return request<News>(`/News/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteNews(id: number): Promise<void> {
  return request<void>(`/News/${id}`, { method: "DELETE" });
}
