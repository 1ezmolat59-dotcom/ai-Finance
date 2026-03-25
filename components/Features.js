import styles from "./Features.module.css";

const features = [
  {
    icon: "🧠",
    title: "AI-Powered Insights",
    description:
      "Get personalized spending analysis and smart recommendations. Our AI learns your habits and suggests ways to save more every month.",
  },
  {
    icon: "🔔",
    title: "Budget Alerts",
    description:
      "Real-time notifications when you're approaching budget limits. Set custom thresholds for any category and never overspend again.",
  },
  {
    icon: "📈",
    title: "Expense Tracking",
    description:
      "Automatically categorize transactions across all your accounts. See exactly where every dollar goes with beautiful visual breakdowns.",
  },
  {
    icon: "💹",
    title: "Investment Analysis",
    description:
      "Track your portfolio performance with AI-driven market insights. Get alerts on opportunities and risks tailored to your goals.",
  },
  {
    icon: "💱",
    title: "Multi-Currency",
    description:
      "Seamlessly track finances in USD, EUR, GBP, and NGN. Auto-convert between currencies with real-time exchange rates across all your accounts.",
  },
  {
    icon: "📊",
    title: "Financial Reports",
    description:
      "Generate comprehensive monthly and yearly reports. Visualize trends, track net worth growth, and share reports with your advisor.",
  },
];

export default function Features() {
  return (
    <section className={`section-padding ${styles.features}`} id="features">
      <div className="container">
        <div className={styles.featuresHeader}>
          <div className="section-badge">✨ Features</div>
          <h2 className="section-title">
            Everything you need to{" "}
            <span className="gradient-text">master your money</span>
          </h2>
          <p className="section-subtitle">
            Powerful tools powered by artificial intelligence, designed to make
            financial management effortless and insightful.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        {features.map((feature, idx) => (
          <div
            key={idx}
            className={styles.card}
          >
            <div className={styles.cardIcon}>{feature.icon}</div>
            <h3 className={styles.cardTitle}>{feature.title}</h3>
            <p className={styles.cardDescription}>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
