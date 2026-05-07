import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import HeroSection from "@/components/home/HeroSection";
import WhyChooseUsSection from "@/components/home/WhyChooseUsSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import BrandsSection from "@/components/home/BrandsSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FAQSection from "@/components/home/FAQSection";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <WhyChooseUsSection />
        <HowItWorksSection />
        <BrandsSection />
        <TestimonialsSection />
        <FAQSection />
      </main>
      <WhatsAppButton />
      <Footer />
    </>
  );
}
