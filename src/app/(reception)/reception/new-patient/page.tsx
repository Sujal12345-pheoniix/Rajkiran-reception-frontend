import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import PatientForm from "@/components/patient/PatientForm";

export default function Home() {
  return (
    <>
    <Header activeItem="New Patient" />
    <main className="min-h-screen bg-gray-100 py-8">
      <PatientForm />
    </main>
    <Footer/>
    </>
  );
}
