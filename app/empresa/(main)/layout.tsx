import HeaderEmpresa from "@/components/layout/HeaderEmpresa";
import Footer from "@/components/layout/Footer";

export default function EmpresaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HeaderEmpresa />
      <main className="pt-24 min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
}
