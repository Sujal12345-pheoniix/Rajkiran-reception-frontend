import LoginForm from "@/components/admin/LoginForm";
import { AdminHeader } from "@/components/AdminHeader";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function page() {
  return (
    <>
    <AdminHeader isLoginPage={true} />
    <LoginForm/>
    <Footer/>
    </>
  )
}
