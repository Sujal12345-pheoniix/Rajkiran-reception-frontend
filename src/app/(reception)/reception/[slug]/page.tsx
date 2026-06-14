import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import PatientVisit from "@/components/patient/PatientVisit";
import { getPatientById } from "@/lib/actions/patientForm";
import { requireReceptionist } from "@/lib/auth";
import { unauthorized } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const receptionist = await requireReceptionist();
  if (!receptionist) unauthorized();

  const patientVisit = await getPatientById(slug);
  if (!patientVisit.success) {
    return (
      <>
        <Header activeItem="Renew Visit"></Header>
        <main className="min-h-screen bg-gray-100 py-8">
          <div className="max-w-4xl mx-auto p-6 space-y-8 flex flex-col gap-3 ">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">
              Visit Form
            </h1>
            <p className="text-red-600">Error: Patient NOT FOUND</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header activeItem="Renew Visit"></Header>
      <PatientVisit patientId={slug} />
      <Footer />
    </>
  );
}
