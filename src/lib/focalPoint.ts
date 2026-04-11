/**
 * Focal point được lưu dưới dạng query param `_fp=X,Y` trong imageUrl.
 * Ví dụ: https://res.cloudinary.com/.../img.jpg?_fp=35,20
 * X, Y là phần trăm (0–100) tính từ góc trên-trái.
 */

/** Parse focal point từ URL, trả về src sạch và objectPosition CSS. */
export function parseFocalPoint(url: string): {
  src: string;
  objectPosition: string;
  hasFocal: boolean;
} {
  if (!url) return { src: url, objectPosition: "center", hasFocal: false };
  try {
    // Tách _fp ra khỏi URL thô (tránh lỗi với URL không chuẩn)
    const fpMatch = url.match(/[?&]_fp=([0-9]+),([0-9]+)/);
    if (fpMatch) {
      const x = Math.min(100, Math.max(0, parseInt(fpMatch[1])));
      const y = Math.min(100, Math.max(0, parseInt(fpMatch[2])));
      const src = url.replace(/([?&])_fp=[^&]+(&|$)/, (_, pre, post) =>
        post ? pre : ""
      ).replace(/[?&]$/, "");
      return { src, objectPosition: `${x}% ${y}%`, hasFocal: true };
    }
  } catch {}
  return { src: url, objectPosition: "center", hasFocal: false };
}

/** Gắn focal point vào URL. Ghi đè nếu đã có. */
export function setFocalPoint(url: string, x: number, y: number): string {
  if (!url) return url;
  const clean = url.replace(/([?&])_fp=[^&]+(&|$)/, (_, pre, post) =>
    post ? pre : ""
  ).replace(/[?&]$/, "");
  const sep = clean.includes("?") ? "&" : "?";
  return `${clean}${sep}_fp=${Math.round(x)},${Math.round(y)}`;
}

/** Xoá focal point khỏi URL. */
export function clearFocalPoint(url: string): string {
  if (!url) return url;
  return url.replace(/([?&])_fp=[^&]+(&|$)/, (_, pre, post) =>
    post ? pre : ""
  ).replace(/[?&]$/, "");
}
