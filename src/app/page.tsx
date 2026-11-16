import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { DemoSample } from '@/components/sections/DemoSample';
import { DemoForm } from '@/components/sections/DemoForm';
import { Faq } from '@/components/sections/Faq';
import { Features } from '@/components/sections/Features';
import { Hero } from '@/components/sections/Hero';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { Impact } from '@/components/sections/Impact';
import { Problems } from '@/components/sections/Problems';
import { Testimonials } from '@/components/sections/Testimonials';

export default function Home() {
  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1}>
        <Hero />
        <Problems />
        <Features />
        <HowItWorks />
        <DemoSample />
        <Impact />
        <Testimonials />
        <Faq />
        <DemoForm />
      </main>
      <Footer />
    </>
  );
}
