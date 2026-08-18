import { redirect } from "next/navigation";

export default function AdminRootPage() {
  // Selalu arahkan ke halaman login admin terlebih dahulu
  redirect("/admin/login");
}
