import { Link } from 'react-router-dom'
import Nav from '../components/Nav'

export default function NotFound() {
  return (
    <div className="page">
      <Nav />
      <main className="container notfound">
        <h1>404</h1>
        <p className="muted">That page doesn't exist.</p>
        <Link className="btn btn-primary" to="/" style={{ marginTop: 16, display: 'inline-block' }}>
          Back to home
        </Link>
      </main>
    </div>
  )
}
