import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import BudgetAlerts from "../components/BudgetAlerts";
import Pricing from "../components/Pricing";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <BudgetAlerts />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
