import { useLang } from '../context/LangContext'

export default function OverviewPanel() {
  const { t } = useLang()
  return (
    <section className="card-float overview-panel">
      <div>
        <h2>{t.overview_title}</h2>
        <p>{t.overview_desc}</p>
      </div>
      <div className="feature-grid">
        <div className="feature-item">
          <span className="f-icon">🗂️</span>
          <h4>{t.feature1_title}</h4>
          <p>{t.feature1_desc}</p>
        </div>
        <div className="feature-item">
          <span className="f-icon">📅</span>
          <h4>{t.feature2_title}</h4>
          <p>{t.feature2_desc}</p>
        </div>
        <div className="feature-item">
          <span className="f-icon">🏥</span>
          <h4>{t.feature3_title}</h4>
          <p>{t.feature3_desc}</p>
        </div>
      </div>
    </section>
  )
}
