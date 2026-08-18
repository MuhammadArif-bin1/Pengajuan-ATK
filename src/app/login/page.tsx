import { redirect } from "next/navigation";

export default function LoginPage() {
  // Always redirect to public user portal
  redirect("/");
}
