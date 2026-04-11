import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập | Happy Furniture Admin",
  description:
    "Cổng quản trị Happy Furniture — quản lý tin tức, sản phẩm và nội dung website.",
};

export default function SignIn() {
  return <SignInForm />;
}
