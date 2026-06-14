import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import PatientSearch from "@/components/patient/PatientSearch";

export default function page() {
  return (
    <>
      <Header activeItem="Renew Visit" />
      <PatientSearch/>
      <Footer />
    </>
  );
}
