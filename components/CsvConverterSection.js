import CsvConverter from "./CsvConverter";

export default function CsvConverterSection() {
  return (
    <section
      style={{ padding: "80px 0" }}
      id="csv-converter"
    >
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div className="section-badge">🤖 AI Data Extraction</div>
          <h2 className="section-title">
            Screenshot to <span className="gradient-text">CSV in seconds</span>
          </h2>
          <p className="section-subtitle">
            Upload a bank statement screenshot or paste raw data — our AI
            extracts, cleans, and converts it to a ready-to-use CSV file.
          </p>
        </div>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <CsvConverter />
        </div>
      </div>
    </section>
  );
}
